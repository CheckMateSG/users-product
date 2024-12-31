import * as admin from "firebase-admin"
import { MessageRepository } from "../../src/models/message.repository"
import { Message } from "../../src/models/types/message"
import { Timestamp } from "firebase-admin/firestore"

describe("MessageRepository", () => {
  let repository: MessageRepository
  let firestore: admin.firestore.Firestore

  beforeEach(() => {
    firestore = admin.firestore()
    repository = new MessageRepository(firestore)
  })

  afterEach(async () => {
    // Clean up - delete all documents in the messages collection
    const snapshot = await firestore.collection("messages").get()
    const deletePromises = snapshot.docs.map((doc) => doc.ref.delete())
    await Promise.all(deletePromises)
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

  //   describe("submissions", () => {
  //     it("should handle submissions for a message", async () => {
  //       // Create a test message first
  //       const message = await repository.create(createTestMessage())

  //       // Add a submission
  //       const submissionData = {
  //         messageId: message.id,
  //         userId: "test-user",
  //         timestamp: Timestamp.now(),
  //         text: "test submission",
  //       }

  //       const submission = await repository.addSubmission(
  //         message.id,
  //         submissionData
  //       )
  //       expect(submission.id).toBeDefined()
  //       expect(submission.messageId).toBe(message.id)

  //       // Get all submissions
  //       const submissions = await repository.getSubmissions(message.id)
  //       expect(submissions.length).toBe(1)
  //       expect(submissions[0].id).toBe(submission.id)
  //     })
  //   })
})
