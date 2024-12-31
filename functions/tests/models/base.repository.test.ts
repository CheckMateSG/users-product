import * as admin from "firebase-admin"
import { BaseRepository } from "../../src/models/base.repository"
import {
  CollectionReference,
  FirestoreDataConverter,
} from "firebase-admin/firestore"

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

describe("BaseRepository", () => {
  let repository: TestRepository
  let collection: CollectionReference

  beforeEach(() => {
    // Get a reference to a test collection
    collection = admin.firestore().collection("test-collection")
    repository = new TestRepository(collection)
  })

  afterEach(async () => {
    // Clean up - delete all documents in the test collection
    const snapshot = await collection.get()
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
})
