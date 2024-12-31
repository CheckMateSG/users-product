import { BaseRepository } from "./base.repository"
import { Message, messageConverter } from "./types/message"
import { Submission } from "./types/submission"
import { SubmissionRepository } from "./submission.repository"
import { Firestore, WithFieldValue, FieldValue } from "firebase-admin/firestore"

export class MessageRepository extends BaseRepository<Message> {
  constructor(private firestore: Firestore) {
    super(firestore.collection("messages"), messageConverter)
  }

  getSubmissionRepository(messageId: string): SubmissionRepository {
    return new SubmissionRepository(this.firestore, messageId)
  }

  async addSubmission(
    messageId: string,
    submission: Omit<Submission, "id">
  ): Promise<Submission> {
    const submissionRepo = this.getSubmissionRepository(messageId)
    return await submissionRepo.create(submission)
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

  async findByMachineCategory(category: string): Promise<Message[]> {
    return this.queryMany(
      this.collection.where("machineCategory", "==", category)
    )
  }

  async findByEmbeddingVector(
    vector: number[],
    limit = 10
  ): Promise<Message[]> {
    return this.queryMany(
      this.collection
        .where("embedding", "!=", null)
        .orderBy("embedding", "asc")
        .limit(limit)
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
}
