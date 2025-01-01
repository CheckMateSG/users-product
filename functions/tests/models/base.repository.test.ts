// functions\tests\models\base.repository.test.ts
import { BaseRepository } from "../../src/models/base.repository"
import {
  CollectionReference,
  FirestoreDataConverter,
} from "firebase-admin/firestore"
import { Timestamp } from "firebase-admin/firestore"
import { firestore } from "../../src/models/firestore/firestore"
import { TransactionManager } from "../../src/models/firestore/transaction.manager"
import { BatchManager } from "../../src/models/firestore/batch.manager"

// Test interface
interface TestModel {
  id: string
  name: string
  value: number
}

// Test implementation of BaseRepository
class TestRepository extends BaseRepository<TestModel> {
  constructor(collection: CollectionReference) {
    const converter: FirestoreDataConverter<TestModel> = {
      toFirestore: (data: TestModel) => ({
        name: data.name,
        value: data.value,
      }),
      fromFirestore: (snapshot) => {
        const data = snapshot.data()
        return {
          id: snapshot.id,
          name: data.name,
          value: data.value,
        }
      },
    }
    super(collection, converter)
  }
}

interface TestDoc {
  id: string
  text: string
  number: number
  timestamp: Timestamp
}

class TestRepositoryForTests extends BaseRepository<TestDoc> {
  constructor() {
    const converter: FirestoreDataConverter<TestDoc> = {
      toFirestore: (data: TestDoc) => ({
        text: data.text,
        number: data.number,
        timestamp: data.timestamp,
      }),
      fromFirestore: (snapshot) =>
        ({
          id: snapshot.id,
          ...snapshot.data(),
        } as TestDoc),
    }
    super(firestore.collection("test-collection"), converter)
  }
}

describe("BaseRepository", () => {
  let repository: TestRepository
  let collection: CollectionReference

  beforeEach(() => {
    // Get a reference to a test collection
    collection = firestore.collection("test-collection")
    repository = new TestRepository(collection)
  })

  afterEach(async () => {
    // Clean up - delete all documents in the test collection
    const snapshot = await firestore.collection("test-collection").get()
    const deletePromises = snapshot.docs.map((doc) => doc.ref.delete())
    await Promise.all(deletePromises)
  })

  describe("create", () => {
    it("should create a new document with generated id", async () => {
      const testData = { name: "Test Item", value: 42 }

      const result = await repository.create(testData)

      expect(result.id).toBeDefined()
      expect(result.name).toBe(testData.name)
      expect(result.value).toBe(testData.value)

      // Verify the document exists in Firestore
      const doc = await collection.doc(result.id).get()
      expect(doc.exists).toBe(true)
      expect(doc.data()).toEqual(testData)
    })
  })

  describe("delete", () => {
    it("should delete an existing document", async () => {
      // Create a test document first
      const testData = { name: "Test Item", value: 42 }
      const created = await repository.create(testData)

      // Delete the document
      await repository.delete(created.id)

      // Verify the document is deleted
      const doc = await collection.doc(created.id).get()
      expect(doc.exists).toBe(false)
    })
  })

  describe("findById", () => {
    it("should return null for non-existent document", async () => {
      const result = await repository.findById("non-existent-id")
      expect(result).toBeNull()
    })

    it("should find an existing document by id", async () => {
      // Create a test document first
      const testData = { name: "Test Item", value: 42 }
      const created = await repository.create(testData)

      const result = await repository.findById(created.id)

      expect(result).not.toBeNull()
      expect(result?.id).toBe(created.id)
      expect(result?.name).toBe(testData.name)
      expect(result?.value).toBe(testData.value)
    })
  })

  describe("update", () => {
    it("should update an existing document", async () => {
      // Create a test document first
      const testData = { name: "Test Item", value: 42 }
      const created = await repository.create(testData)

      // Update the document
      const updateData = { name: "Updated Name" }
      await repository.update(created.id, updateData)

      // Verify the update
      const updated = await repository.findById(created.id)
      expect(updated?.name).toBe(updateData.name)
      expect(updated?.value).toBe(testData.value) // Should remain unchanged
    })

    it("should throw error when updating non-existent document", async () => {
      const updateData = { name: "Updated Name" }
      await expect(
        repository.update("non-existent-id", updateData)
      ).rejects.toThrow()
    })
  })

  describe("queryOne and queryMany", () => {
    beforeEach(async () => {
      // Create multiple test documents
      const testData = [
        { name: "Item 1", value: 10 },
        { name: "Item 2", value: 20 },
        { name: "Item 3", value: 30 },
      ]

      await Promise.all(testData.map((data) => repository.create(data)))
    })

    it("should return one document with queryOne", async () => {
      const query = collection.where("value", ">", 15)
      const result = await (repository as any).queryOne(query)

      expect(result).not.toBeNull()
      expect(result.value).toBeGreaterThan(15)
    })

    it("should return multiple documents with queryMany", async () => {
      const query = collection.where("value", ">", 15)
      const results = await (repository as any).queryMany(query)

      expect(results.length).toBe(2)
      results.forEach((result: any) => {
        expect(result.value).toBeGreaterThan(15)
      })
    })
  })

  describe("transaction operations", () => {
    let transactionRepository: BaseRepository<TestDoc>

    beforeEach(() => {
      transactionRepository = new TestRepositoryForTests()
    })

    it("should create a document in a transaction", async () => {
      const testData = { text: "test", number: 1, timestamp: Timestamp.now() }
      const transactionManager = new TransactionManager()

      const created = await transactionManager.runTransaction(
        async (transaction) => {
          return transactionRepository.createInTransaction(
            transaction,
            testData
          )
        }
      )

      expect(created.id).toBeDefined()
      const retrieved = await transactionRepository.findById(created.id)
      expect(retrieved).toEqual(created)
    })

    it("should update a document in a transaction", async () => {
      const testData = { text: "test", number: 1, timestamp: Timestamp.now() }
      const doc = await transactionRepository.create(testData)
      const transactionManager = new TransactionManager()

      await transactionManager.runTransaction(async (transaction) => {
        const updateData = { text: "updated in transaction" }
        transactionRepository.updateInTransaction(
          transaction,
          doc.id,
          updateData
        )
      })

      const updated = await transactionRepository.findById(doc.id)
      expect(updated?.text).toBe("updated in transaction")
    })

    it("should read and write in the same transaction", async () => {
      const doc1 = await transactionRepository.create({
        text: "test",
        number: 1,
        timestamp: Timestamp.now(),
      })
      const doc2 = await transactionRepository.create({
        text: "test",
        number: 2,
        timestamp: Timestamp.now(),
      })
      const transactionManager = new TransactionManager()

      await transactionManager.runTransaction(async (transaction) => {
        const doc1Data = await transactionRepository.findByIdInTransaction(
          transaction,
          doc1.id
        )
        const doc2Data = await transactionRepository.findByIdInTransaction(
          transaction,
          doc2.id
        )

        if (!doc1Data || !doc2Data) throw new Error("Documents not found")

        const sum = doc1Data.number + doc2Data.number
        transactionRepository.updateInTransaction(transaction, doc1.id, {
          number: sum,
        })
        transactionRepository.updateInTransaction(transaction, doc2.id, {
          number: 0,
        })
      })

      const updatedDoc1 = await transactionRepository.findById(doc1.id)
      const updatedDoc2 = await transactionRepository.findById(doc2.id)
      expect(updatedDoc1?.number).toBe(3)
      expect(updatedDoc2?.number).toBe(0)
    })
  })

  describe("batch operations", () => {
    let batchRepository: BaseRepository<TestDoc>

    beforeEach(() => {
      batchRepository = new TestRepositoryForTests()
    })

    it("should create multiple documents in a batch", async () => {
      const batchManager = new BatchManager()
      const batch = batchManager.getBatch()
      const docs = [
        { text: "batch1", number: 1, timestamp: Timestamp.now() },
        { text: "batch2", number: 2, timestamp: Timestamp.now() },
        { text: "batch3", number: 3, timestamp: Timestamp.now() },
      ]

      const createdDocs = docs.map((doc) => {
        const docWithId = batchRepository.createInBatch(batch, doc)
        return docWithId
      })

      await batchManager.commit()

      const retrievedDocs = await Promise.all(
        createdDocs.map((doc) => batchRepository.findById(doc.id))
      )
      expect(retrievedDocs.map((doc) => doc?.text)).toEqual([
        "batch1",
        "batch2",
        "batch3",
      ])
    })

    it("should update multiple documents in a batch", async () => {
      const docs = await Promise.all([
        batchRepository.create({
          text: "original1",
          number: 1,
          timestamp: Timestamp.now(),
        }),
        batchRepository.create({
          text: "original2",
          number: 2,
          timestamp: Timestamp.now(),
        }),
      ])

      const batchManager = new BatchManager()
      const batch = batchManager.getBatch()
      batchRepository.updateInBatch(batch, docs[0].id, {
        text: "updated1",
      })
      batchRepository.updateInBatch(batch, docs[1].id, {
        text: "updated2",
      })
      await batchManager.commit()

      const updatedDocs = await Promise.all(
        docs.map((doc) => batchRepository.findById(doc.id))
      )
      expect(updatedDocs.map((doc) => doc?.text)).toEqual([
        "updated1",
        "updated2",
      ])
    })

    it("should handle mixed operations in a batch", async () => {
      const existingDoc = await batchRepository.create({
        text: "existing",
        number: 1,
        timestamp: Timestamp.now(),
      })
      const newDoc = { text: "new", number: 1, timestamp: Timestamp.now() }

      const batchManager = new BatchManager()
      const batch = batchManager.getBatch()
      batchRepository.updateInBatch(batch, existingDoc.id, {
        text: "modified",
      })
      batchRepository.createInBatch(batch, newDoc)
      batchRepository.deleteInBatch(batch, existingDoc.id)
      await batchManager.commit()

      const deletedDoc = await batchRepository.findById(existingDoc.id)
      expect(deletedDoc).toBeNull()

      const allDocs = await batchRepository.getAll()
      expect(allDocs).toHaveLength(1)
      expect(allDocs[0].text).toBe("new")
    })
  })
})
