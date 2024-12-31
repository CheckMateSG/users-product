// src/models/base.repository.ts
import {
  CollectionReference,
  Query,
  UpdateData,
  DocumentData,
  CollectionGroup,
  FirestoreDataConverter,
} from "firebase-admin/firestore"

export abstract class BaseRepository<T extends { id: string }> {
  protected constructor(
    protected collection: CollectionReference | CollectionGroup,
    protected converter: FirestoreDataConverter<T>
  ) {
    if (collection instanceof CollectionReference) {
      this.collection = collection.withConverter(converter)
    } else {
      this.collection = collection.withConverter(null).withConverter(converter)
    }
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

  async create(data: Omit<T, "id">): Promise<T> {
    if (!(this.collection instanceof CollectionReference)) {
      throw new Error("Cannot create document in a collection group")
    }
    const docRef = await this.collection.add(data as DocumentData)
    const doc = await docRef.get()
    return doc.data() as T
  }

  async update(id: string, data: UpdateData<T>): Promise<void> {
    if (!(this.collection instanceof CollectionReference)) {
      throw new Error(
        "Cannot update document in a collection group without full path"
      )
    }
    await this.collection.doc(id).update(data as DocumentData)
  }

  protected async queryOne(query: Query): Promise<T | null> {
    const snapshot = await query.limit(1).get()
    return snapshot.empty ? null : (snapshot.docs[0].data() as T)
  }

  protected async queryMany(query: Query): Promise<T[]> {
    const snapshot = await query.get()
    return snapshot.docs.map((doc) => doc.data() as T)
  }
}
