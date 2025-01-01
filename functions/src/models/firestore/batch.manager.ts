// functions\src\models\firestore\batch.manager.ts
import { WriteBatch } from "firebase-admin/firestore"
import { createRepositoryLogger } from "../../config/logger"
import { firestore } from "./firestore"

export class BatchManager {
  private logger = createRepositoryLogger("BatchManager")
  private batch: WriteBatch

  constructor() {
    this.batch = firestore.batch()
  }

  getBatch(): WriteBatch {
    return this.batch
  }

  async commit(): Promise<void> {
    try {
      await this.batch.commit()
      this.logger.info({
        method: "commit",
        message: "Batch committed successfully",
      })
    } catch (error) {
      this.logger.error({
        method: "commit",
        error,
      })
      throw error
    } finally {
      // Create a new batch after commit/rollback
      this.batch = firestore.batch()
    }
  }

  // Helper method to create a new batch if needed
  reset(): void {
    this.batch = firestore.batch()
  }
}
