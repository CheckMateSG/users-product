import { BaseRepository } from "./base.repository"
import { Message, messageConverter } from "./types/message"
import { Submission, submissionConverter } from "./types/submission"
import { SubmissionRepository } from "./submission.repository"
import {
  Firestore,
  WithFieldValue,
  FieldValue,
  CollectionReference,
} from "firebase-admin/firestore"
import { createRepositoryLogger } from "../config/logger"

export class MessageRepository extends BaseRepository<Message> {
  constructor(private firestore: Firestore) {
    super(firestore.collection("messages"), messageConverter)
  }

  private logger = createRepositoryLogger("MessageRepository")

  getSubmissionRepository(messageId: string): SubmissionRepository {
    return new SubmissionRepository(this.firestore, messageId)
  }

  async addSubmission(
    messageId: string,
    submissionData: Omit<Submission, "id">,
    sourceUniqueId: string
  ): Promise<Submission | null> {
    const logger = this.logger.child({
      method: "addSubmission",
      sourceUniqueId,
      sender: submissionData.from,
    })
    // execute transaction
    const result = await this.firestore.runTransaction(async (transaction) => {
      // Create submission document reference
      const query = this.firestore
        .collectionGroup("submissions")
        .where("sourceUniqueId", "==", sourceUniqueId)
        .limit(1)
      const querySnapshot = await query.get()
      if (!querySnapshot.empty) {
        logger.warn("Submission with sourceUniqueId already exists")
        return null
      }
      const messageRef = (this.collection as CollectionReference).doc(messageId)
      const submissionRef = messageRef.collection("submissions").doc()
      const submissionWithId = { id: submissionRef.id, ...submissionData }
      transaction.set(
        submissionRef,
        submissionConverter.toFirestore(submissionWithId)
      )
      // Update message's submission count and latest submission reference
      transaction.update(messageRef, {
        submissionCount: FieldValue.increment(1),
        latestSubmission: submissionRef,
      })

      logger.info("Added submission")

      return submissionWithId
    })
    return result
  }

  async getSubmissions(messageId: string): Promise<Submission[]> {
    const submissionRepo = this.getSubmissionRepository(messageId)
    return await submissionRepo.getMessageSubmissions()
  }

  async findUnassessedMessages(): Promise<Message[]> {
    return this.queryMany(
      this.collection
        .where("isAssessed", "==", false)
        .where("isVotingTriggered", "==", true)
    )
  }

  async incrementSubmissionCount(messageId: string): Promise<void> {
    await this.update(messageId, {
      submissionCount: FieldValue.increment(1),
    } as WithFieldValue<Partial<Message>>)
  }

  async updateAssessment(
    messageId: string,
    assessmentData: Partial<
      Pick<
        Message,
        | "isAssessed"
        | "assessmentTimestamp"
        | "assessmentExpiry"
        | "truthScore"
        | "isControversial"
      >
    >
  ): Promise<void> {
    await this.update(messageId, assessmentData)
  }

  async createMessageWithSubmission(
    messageData: Omit<Message, "id">,
    submissionData: Omit<Submission, "id">,
    sourceUniqueId: string
  ): Promise<{ message: Message | null; submission: Submission | null }> {
    const logger = this.logger.child({
      method: "createMessageWithSubmission",
      sourceUniqueId,
      sender: submissionData.from,
    })
    const result = await this.firestore.runTransaction(async (transaction) => {
      const query = this.firestore
        .collectionGroup("submissions")
        .where("sourceUniqueId", "==", sourceUniqueId)
        .limit(1)
      const querySnapshot = await query.get()
      if (!querySnapshot.empty) {
        logger.warn({}, "Submission with sourceUniqueId already exists")
        return {
          message: null,
          submission: null,
        }
      }
      // Create message document reference
      const messageRef = (this.collection as CollectionReference).doc()
      const messageWithId = { id: messageRef.id, ...messageData }

      // Create submission document reference
      const submissionRef = messageRef.collection("submissions").doc()
      const submissionWithId = { id: submissionRef.id, ...submissionData }

      // Set both documents in the transaction
      transaction.set(messageRef, messageConverter.toFirestore(messageWithId))
      transaction.set(
        submissionRef,
        submissionConverter.toFirestore(submissionWithId)
      )

      // Update message's submission count and latest submission reference
      transaction.update(messageRef, {
        submissionCount: FieldValue.increment(1),
        latestSubmission: submissionRef,
      })

      logger.info("Created message and submission")

      return { message: messageWithId, submission: submissionWithId }
    })

    return result
  }
}
