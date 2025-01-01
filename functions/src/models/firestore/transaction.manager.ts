// functions\src\models\firestore\transaction.manager.ts
import { Transaction } from "firebase-admin/firestore"
import { createRepositoryLogger } from "../../config/logger"
import { firestore } from "./firestore"

export class TransactionManager {
  private logger = createRepositoryLogger("TransactionManager")

  async runTransaction<T>(
    operation: (transaction: Transaction) => Promise<T>
  ): Promise<T> {
    return firestore.runTransaction(async (transaction) => {
      try {
        const result = await operation(transaction)
        return result
      } catch (error) {
        this.logger.error({
          method: "runTransaction",
          error,
        })
        throw error
      }
    })
  }
}
