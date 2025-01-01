import * as admin from "firebase-admin"
import { SubmissionRepository } from "../../src/models/submission.repository"
import { MessageRepository } from "../../src/models/message.repository"
import { Submission } from "../../src/models/types/submission"
import { Timestamp } from "firebase-admin/firestore"

describe("SubmissionRepository", () => {
  let firestore: admin.firestore.Firestore
  let messageRepo: MessageRepository
  let submissionRepo: SubmissionRepository
  let messageId: string

  beforeAll(async () => {
    firestore = admin.firestore()
    messageRepo = new MessageRepository(firestore)

    // Create a test message that we'll use throughout the tests
    const message = await messageRepo.create({
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
    })

    messageId = message.id
    submissionRepo = new SubmissionRepository(firestore, messageId)
  })

  const createTestSubmission = (
    overrides: Partial<Submission> = {}
  ): Omit<Submission, "id"> => ({
    source: "test-source",
    sourceUniqueId: "test-unique-id",
    timestamp: Timestamp.now(),
    type: "text",
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
    it("should create and retrieve a submission", async () => {
      const testData = createTestSubmission()
      const messageRepo = new MessageRepository(firestore)
      const submission = await messageRepo.addSubmission(
        messageId,
        testData,
        testData.sourceUniqueId
      )

      if (!submission) {
        throw new Error("Submission not found")
      }

      expect(submission.id).toBeDefined()
      expect(submission.text).toBe(testData.text)

      const retrieved = await submissionRepo.findById(submission.id)
      expect(retrieved).toEqual(submission)
    })
  })

  describe("findUnreplied", () => {
    it("should find unreplied submissions", async () => {
      // Create test submissions
      const replied = createTestSubmission({ isReplied: true })
      const unreplied = createTestSubmission({ isReplied: false })

      await Promise.all([
        submissionRepo.create(replied),
        submissionRepo.create(unreplied),
      ])

      const results = await submissionRepo.findUnreplied()
      expect(results.some((s) => s.isReplied === false)).toBe(true)
      expect(results.every((s) => s.isReplied === false)).toBe(true)
    })
  })

  describe("getMessageSubmissions", () => {
    it("should get all submissions for a message", async () => {
      // Create multiple submissions
      const submissions = await Promise.all([
        submissionRepo.create(createTestSubmission()),
        submissionRepo.create(createTestSubmission()),
        submissionRepo.create(createTestSubmission()),
      ])

      const results = await submissionRepo.getMessageSubmissions()
      expect(results.length).toBeGreaterThanOrEqual(3)
      submissions.forEach((submission) => {
        expect(results.some((r) => r.id === submission.id)).toBe(true)
      })
    })
  })

  describe("markAsReplied", () => {
    it("should mark a submission as replied with a category", async () => {
      const submission = await submissionRepo.create(createTestSubmission())
      await submissionRepo.markAsReplied(submission.id, "test-category")

      const updated = await submissionRepo.findById(submission.id)
      expect(updated?.isReplied).toBe(true)
      expect(updated?.replyCategory).toBe("test-category")
    })

    it("should mark a submission as replied without a category", async () => {
      const submission = await submissionRepo.create(createTestSubmission())
      await submissionRepo.markAsReplied(submission.id)

      const updated = await submissionRepo.findById(submission.id)
      expect(updated?.isReplied).toBe(true)
      expect(updated?.replyCategory).toBeNull()
    })
  })

  describe("getAllSubmissions", () => {
    it("should throw error when trying to get all submissions with messageId", async () => {
      await expect(submissionRepo.getAllSubmissions()).rejects.toThrow(
        "Cannot get all submissions: repository was initialized with a message ID"
      )
    })

    it("should get all submissions when no messageId is provided", async () => {
      const globalRepo = new SubmissionRepository(firestore)
      const results = await globalRepo.getAllSubmissions()
      expect(Array.isArray(results)).toBe(true)
    })
  })
})
