// functions\src\models\users.repository.ts
import { BaseRepository } from "./base.repository"
import { User, userConverter } from "./types/users"
import {
  CollectionReference,
  Firestore,
  FieldValue,
} from "firebase-admin/firestore"
import { createRepositoryLogger } from "../config/logger"

export class UsersRepository extends BaseRepository<User> {
  private logger = createRepositoryLogger("UsersRepository")
  private static COLLECTION_NAME = "users"

  constructor(firestore: Firestore) {
    const collection = firestore.collection(
      UsersRepository.COLLECTION_NAME
    ) as CollectionReference<User>
    super(collection, userConverter)
  }

  async findByWhatsappId(whatsappId: string): Promise<User | null> {
    return this.queryOne(this.collection.where("whatsappId", "==", whatsappId))
  }

  async findByTelegramId(telegramId: string): Promise<User | null> {
    return this.queryOne(this.collection.where("telegramId", "==", telegramId))
  }

  async findByEmailId(emailId: string): Promise<User | null> {
    return this.queryOne(this.collection.where("emailId", "==", emailId))
  }

  async incrementSubmissionCount(
    userId: string,
    increment: number = 1
  ): Promise<void> {
    await (this.collection as CollectionReference<User>).doc(userId).update({
      submissionCount: FieldValue.increment(increment),
      numSubmissionsRemaining: FieldValue.increment(increment * -1),
    })
    this.logger.info({
      method: "incrementSubmissionCount",
      userId,
      submissionCount: increment,
      numSubmissionsRemaining: increment * -1,
    })
  }

  async incrementReferralCount(
    userId: string,
    increment: number = 1
  ): Promise<void> {
    await (this.collection as CollectionReference<User>).doc(userId).update({
      referralCount: FieldValue.increment(increment),
    })
  }
}
