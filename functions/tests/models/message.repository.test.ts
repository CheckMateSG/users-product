import * as admin from "firebase-admin"
import { MessageRepository } from "../../src/models/message.repository"
import { Message } from "../../src/models/types/message"
import { Timestamp } from "firebase-admin/firestore"
import { Submission } from "../../src/models/types/submission"

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

  const createTestSubmission = (
    overrides: Partial<Submission> = {}
  ): Omit<Submission, "id"> => ({
    source: "test-source",
    timestamp: Timestamp.now(),
    type: "text" as const,
    text: "test submission",
    textHash: "hash123",
    caption: null,
    captionHash: null,
    sender: "test-sender",
    imageType: null,
    ocrVersion: null,
    from: null,
    subject: null,
    hash: "hash123",
    mediaId: null,
    mimeType: null,
    storageUrl: null,
    isForwarded: false,
    isFrequentlyForwarded: false,
    isReplied: false,
    isInterimPromptSent: false,
    isInterimReplySent: false,
    isMeaningfulInterimReplySent: false,
    isCommunityNoteSent: false,
    isCommunityNoteCorrected: false,
    isCommunityNoteUseful: null,
    isIrrelevantAppealed: false,
    replyCategory: null,
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

  describe("createMessageWithSubmission", () => {
    it("should create message and submission atomically", async () => {
      const messageData = createTestMessage()
      const submissionData = createTestSubmission()

      const { message, submission } =
        await repository.createMessageWithSubmission(
          messageData,
          submissionData
        )

      // Verify message was created with correct data
      expect(message.id).toBeDefined()
      expect(message.machineCategory).toBe(messageData.machineCategory)
      expect(message.text).toBe(messageData.text)
      expect(message.submissionCount).toBe(1)
      expect(message.latestSubmission).toBeDefined()

      // Verify submission was created with correct data
      expect(submission.id).toBeDefined()
      expect(submission.text).toBe(submissionData.text)
      expect(submission.source).toBe(submissionData.source)
      expect(submission.type).toBe(submissionData.type)

      // Verify we can retrieve the message
      const retrievedMessage = await repository.findById(message.id)
      expect(retrievedMessage).toEqual(message)

      // Verify we can get the submission through the message
      const submissions = await repository.getSubmissions(message.id)
      expect(submissions).toHaveLength(1)
      expect(submissions[0]).toEqual(submission)
    })

    it("should handle multiple submissions for the same message", async () => {
      const messageData = createTestMessage()
      const firstSubmission = createTestSubmission()
      const secondSubmission = createTestSubmission({
        text: "second submission",
        textHash: "hash456",
      })

      // Create first message+submission
      const first = await repository.createMessageWithSubmission(
        messageData,
        firstSubmission
      )

      // Add second submission
      const second = await repository.addSubmission(
        first.message.id,
        secondSubmission
      )

      // Get all submissions
      const submissions = await repository.getSubmissions(first.message.id)
      expect(submissions).toHaveLength(2)
      expect(submissions.map((s) => s.text)).toContain(firstSubmission.text)
      expect(submissions.map((s) => s.text)).toContain(secondSubmission.text)

      // Verify message was updated
      const message = await repository.findById(first.message.id)
      expect(message?.submissionCount).toBe(2)
      expect(message?.latestSubmission).toBeDefined()
    })
  })
})
