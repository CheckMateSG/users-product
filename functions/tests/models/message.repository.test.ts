// functions\tests\models\message.repository.test.ts
import { MessageRepository } from "../../src/models/message.repository"
import { Message } from "../../src/models/types/message"
import { Timestamp } from "firebase-admin/firestore"
import { firestore } from "../../src/models/firestore/firestore"

describe("MessageRepository", () => {
  let repository: MessageRepository

  beforeEach(() => {
    repository = new MessageRepository()
  })

  afterEach(async () => {
    // Clean up - delete all documents in the messages collection
    const submissionsSnapshot = await firestore
      .collectionGroup("submissions")
      .get()
    const submissionDeletePromises = submissionsSnapshot.docs.map((doc) =>
      doc.ref.delete()
    )
    await Promise.all(submissionDeletePromises)
    const messagesSnapshot = await firestore.collection("messages").get()
    const messageDeletePromises = messagesSnapshot.docs.map((doc) =>
      doc.ref.delete()
    )
    await Promise.all(messageDeletePromises)
  })

  const createTestMessage = (
    overrides: Partial<Message> = {}
  ): Omit<Message, "id"> => ({
    machineCategory: "test-category",
    isMachineCategorised: true,
    isWronglyCategorisedIrrelevant: false,
    text: "test message",
    redactedText: null,
    caption: null,
    latestSubmission: null,
    firstTimestamp: Timestamp.now(),
    lastTimestamp: Timestamp.now(),
    lastRefreshedTimestamp: Timestamp.now(),
    isVotingTriggered: false,
    isAssessed: false,
    assessmentTimestamp: null,
    assessmentExpiry: null,
    assessmentExpired: false,
    truthScore: null,
    numberPointScale: 5,
    isControversial: null,
    isIrrelevant: null,
    isHarmful: null,
    isHarmless: null,
    tags: {},
    primaryCategory: null,
    customReply: null,
    generationStatus: null,
    generationDocument: null,
    submissionCount: 0,
    adminBroadcastMessageId: null,
    embedding: null,
    ...overrides,
  })

  describe("create and findById", () => {
    it("should create and retrieve a message", async () => {
      const testData = createTestMessage()
      const created = await repository.create(testData)

      expect(created.id).toBeDefined()
      expect(created.machineCategory).toBe(testData.machineCategory)

      const retrieved = await repository.findById(created.id)
      expect(retrieved).toEqual(created)
    })
  })

  describe("findUnassessedMessages", () => {
    it("should find unassessed messages with voting triggered", async () => {
      // Create test messages
      const assessed = createTestMessage({
        isAssessed: true,
        isVotingTriggered: true,
      })
      const unassessedNoVoting = createTestMessage({
        isAssessed: false,
        isVotingTriggered: false,
      })
      const unassessedWithVoting = createTestMessage({
        isAssessed: false,
        isVotingTriggered: true,
      })

      await Promise.all([
        repository.create(assessed),
        repository.create(unassessedNoVoting),
        repository.create(unassessedWithVoting),
      ])

      const results = await repository.findUnassessedMessages()
      expect(results.length).toBe(1)
      expect(results[0].isAssessed).toBe(false)
      expect(results[0].isVotingTriggered).toBe(true)
    })
  })
})
