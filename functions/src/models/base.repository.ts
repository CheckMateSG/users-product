// src/models/base.repository.ts
import {
  CollectionReference,
  Query,
  UpdateData,
  DocumentData,
  CollectionGroup,
  FirestoreDataConverter,
  Transaction,
  WriteBatch,
} from "firebase-admin/firestore"
import { TransactionManager } from "./firestore/transaction.manager"
import { BatchManager } from "./firestore/batch.manager"

export abstract class BaseRepository<T extends { id: string }> {
  protected transactionManager: TransactionManager
  protected batchManager: BatchManager

  protected constructor(
    protected collection: CollectionReference | CollectionGroup,
    protected converter: FirestoreDataConverter<T>
  ) {
    if (collection instanceof CollectionReference) {
      this.collection = collection.withConverter(converter)
    } else {
      this.collection = collection.withConverter(null).withConverter(converter)
    }
    this.transactionManager = new TransactionManager()
    this.batchManager = new BatchManager()
  }

  async findById(id: string): Promise<T | null> {
    // Need to handle the case where collection is a CollectionGroup
    if (this.collection instanceof CollectionReference) {
      const doc = await this.collection.doc(id).get()
      return doc.exists ? (doc.data() as T) : null
    }
    // For CollectionGroup, we need to query by document ID
    const snapshot = await this.collection
      .where("__name__", "==", id)
      .limit(1)
      .get()
    return snapshot.empty ? null : (snapshot.docs[0].data() as T)
  }

  async findByIdInTransaction(
    transaction: Transaction,
    id: string
  ): Promise<T | null> {
    if (this.collection instanceof CollectionReference) {
      const doc = await transaction.get(this.collection.doc(id))
      return doc.exists ? (doc.data() as T) : null
    }
    // For CollectionGroup, we need to query by document ID
    return this.queryOneInTransaction(
      transaction,
      this.collection.where("__name__", "==", id).limit(1)
    )
  }

  async create(data: Omit<T, "id">): Promise<T> {
    if (!(this.collection instanceof CollectionReference)) {
      throw new Error("Cannot create document in a collection group")
    }
    const docRef = await this.collection.add(data as DocumentData)
    const doc = await docRef.get()
    return doc.data() as T
  }

  createInTransaction(transaction: Transaction, data: Omit<T, "id">): T {
    if (!(this.collection instanceof CollectionReference)) {
      throw new Error("Cannot create document in a collection group")
    }
    const docRef = this.collection.doc()
    transaction.set(docRef, data as DocumentData)
    return { id: docRef.id, ...data } as T
  }

  createInBatch(batch: WriteBatch, data: Omit<T, "id">): T {
    if (!(this.collection instanceof CollectionReference)) {
      throw new Error("Cannot create document in a collection group")
    }
    const docRef = this.collection.doc()
    batch.set(docRef, data as DocumentData)
    return { id: docRef.id, ...data } as T
  }

  async update(id: string, data: UpdateData<T>): Promise<void> {
    if (!(this.collection instanceof CollectionReference)) {
      throw new Error(
        "Cannot update document in a collection group without full path"
      )
    }
    await this.collection.doc(id).update(data as DocumentData)
  }

  updateInTransaction(
    transaction: Transaction,
    id: string,
    data: UpdateData<T>
  ): void {
    if (!(this.collection instanceof CollectionReference)) {
      throw new Error(
        "Cannot update document in a collection group without full path"
      )
    }
    transaction.update(this.collection.doc(id), data as DocumentData)
  }

  updateInBatch(batch: WriteBatch, id: string, data: UpdateData<T>): void {
    if (!(this.collection instanceof CollectionReference)) {
      throw new Error(
        "Cannot update document in a collection group without full path"
      )
    }
    batch.update(this.collection.doc(id), data as DocumentData)
  }

  async delete(id: string): Promise<void> {
    if (!(this.collection instanceof CollectionReference)) {
      throw new Error(
        "Cannot delete document in a collection group without full path"
      )
    }
    await this.collection.doc(id).delete()
  }

  deleteInTransaction(transaction: Transaction, id: string): void {
    if (!(this.collection instanceof CollectionReference)) {
      throw new Error(
        "Cannot delete document in a collection group without full path"
      )
    }
    transaction.delete(this.collection.doc(id))
  }

  deleteInBatch(batch: WriteBatch, id: string): void {
    if (!(this.collection instanceof CollectionReference)) {
      throw new Error(
        "Cannot delete document in a collection group without full path"
      )
    }
    batch.delete(this.collection.doc(id))
  }

  protected async queryOne(query: Query): Promise<T | null> {
    const snapshot = await query.limit(1).get()
    return snapshot.empty ? null : (snapshot.docs[0].data() as T)
  }

  protected async queryOneInTransaction(
    transaction: Transaction,
    query: Query
  ): Promise<T | null> {
    const snapshot = await transaction.get(query.limit(1))
    return snapshot.empty ? null : (snapshot.docs[0].data() as T)
  }

  protected async queryMany(query: Query): Promise<T[]> {
    const snapshot = await query.get()
    return snapshot.docs.map((doc) => doc.data() as T)
  }

  async getAll(): Promise<T[]> {
    return this.queryMany(this.collection)
  }

  protected async queryManyInTransaction(
    transaction: Transaction,
    query: Query
  ): Promise<T[]> {
    const snapshot = await transaction.get(query)
    return snapshot.docs.map((doc) => doc.data() as T)
  }

  // Transaction wrapper method
  protected async withTransaction<TResult>(
    operation: (transaction: Transaction) => Promise<TResult>
  ): Promise<TResult> {
    return this.transactionManager.runTransaction(operation)
  }

  // Batch wrapper method
  protected async withBatch(
    operation: (batch: WriteBatch) => Promise<void>
  ): Promise<void> {
    const batch = this.batchManager.getBatch()
    await operation(batch)
    await this.batchManager.commit()
  }
}
