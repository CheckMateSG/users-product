// functions\tests\models\submissions.repository.test.ts
import { SubmissionRepository } from "../../src/models/submission.repository"
import { MessageRepository } from "../../src/models/message.repository"
import { Timestamp } from "firebase-admin/firestore"

describe("SubmissionRepository", () => {
  let messageRepo: MessageRepository
  let submissionRepo: SubmissionRepository
  let messageId: string

  beforeAll(async () => {
    messageRepo = new MessageRepository()

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
    submissionRepo = new SubmissionRepository(messageId)
  })

  // const createTestSubmission = (
  //   overrides: Partial<Submission> = {}
  // ): Omit<Submission, "id"> => ({
  //   source: "test-source",
  //   sourceUniqueId: "1",
  //   timestamp: Timestamp.now(),
  //   type: "text" as const,
  //   text: "test submission",
  //   textHash: "hash123",
  //   caption: null,
  //   captionHash: null,
  //   sender: "test-sender",
  //   imageType: null,
  //   ocrVersion: null,
  //   from: null,
  //   subject: null,
  //   hash: "hash123",
  //   mediaId: null,
  //   mimeType: null,
  //   storageUrl: null,
  //   isForwarded: false,
  //   isFrequentlyForwarded: false,
  //   isReplied: false,
  //   isInterimPromptSent: false,
  //   isInterimReplySent: false,
  //   isMeaningfulInterimReplySent: false,
  //   isCommunityNoteSent: false,
  //   isCommunityNoteCorrected: false,
  //   isCommunityNoteUseful: null,
  //   isIrrelevantAppealed: false,
  //   replyCategory: null,
  //   embedding: null,
  //   ...overrides,
  // })

  describe("getMessageSubmissions", () => {
    it("should get all submissions for a message", async () => {
      const results = await submissionRepo.getMessageSubmissions()
      expect(Array.isArray(results)).toBe(true)
    })

    it("should get all submissions when no messageId is provided", async () => {
      const globalRepo = new SubmissionRepository()
      const results = await globalRepo.getAllSubmissions()
      expect(Array.isArray(results)).toBe(true)
    })
  })
})
