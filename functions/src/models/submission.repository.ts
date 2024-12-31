// src/models/submission.repository.ts
import { BaseRepository } from "./base.repository"
import { Submission, submissionConverter } from "./types/submission"
import {
  Firestore,
  UpdateData,
  CollectionReference,
} from "firebase-admin/firestore"

export class SubmissionRepository extends BaseRepository<Submission> {
  constructor(private firestore: Firestore, private messageId?: string) {
    const collection = messageId
      ? firestore
          .collection("messages")
          .doc(messageId)
          .collection("submissions")
      : firestore.collectionGroup("submissions")

    super(collection, submissionConverter)
  }

  async findUnreplied(): Promise<Submission[]> {
    return this.queryMany(this.collection.where("isReplied", "==", false))
  }

  async getMessageSubmissions(): Promise<Submission[]> {
    if (!this.messageId) {
      throw new Error(
        "Cannot get message submissions: no message ID provided in constructor"
      )
    }
    if (!(this.collection instanceof CollectionReference)) {
      throw new Error(
        "Cannot get message submissions: collection is not a CollectionReference"
      )
    }
    return this.queryMany(this.collection)
  }

  async getAllSubmissions(): Promise<Submission[]> {
    if (this.messageId) {
      throw new Error(
        "Cannot get all submissions: repository was initialized with a message ID"
      )
    }
    return this.queryMany(this.collection)
  }

  async markAsReplied(
    submissionId: string,
    replyCategory?: string
  ): Promise<void> {
    const updateData: UpdateData<Submission> = {
      isReplied: true,
    }
    if (replyCategory) {
      updateData.replyCategory = replyCategory
    }
    await this.update(submissionId, updateData)
  }
}
