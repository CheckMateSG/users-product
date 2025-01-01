// functions\tests\models\users.repository.test.ts
import { UsersRepository } from "../../src/models/users.repository"
import { User } from "../../src/models/types/users"
import { Timestamp } from "firebase-admin/firestore"
import { firestore } from "../../src/models/firestore/firestore"

describe("UsersRepository", () => {
  let usersRepository: UsersRepository

  beforeEach(() => {
    usersRepository = new UsersRepository(firestore)
  })

  afterEach(async () => {
    const snapshot = await firestore.collection("users").get()
    const deletePromises = snapshot.docs.map((doc) => doc.ref.delete())
    await Promise.all(deletePromises)
  })

  const createTestUser = (overrides: Partial<User> = {}): Omit<User, "id"> => ({
    whatsappId: "test-whatsapp-id",
    telegramId: "test-telegram-id",
    emailId: "test@example.com",
    ageGroup: "21-35",
    submissionCount: 0,
    firstInteractionTime: Timestamp.now(),
    firstMessageType: "normal",
    lastSent: null,
    initialJourney: {},
    referralId: "test-referral",
    utm: {
      source: "test",
      medium: "test",
      content: "test",
      campaign: "test",
      term: "test",
    },
    referralCount: 0,
    isReferralMessageSent: false,
    language: "en",
    isSubscribedUpdates: false,
    isIgnored: false,
    isOnboardingComplete: false,
    numSubmissionsRemaining: 10,
    dailySubmissionLimit: 10,
    isInterestedInSubscription: null,
    isInterestedAtALowerPoint: null,
    interestedFor: null,
    priceWhereInterested: null,
    feedback: null,
    tier: "free",
    isTester: false,
    ...overrides,
  })

  describe("create", () => {
    it("should create a new user", async () => {
      const userData = createTestUser()
      const user = await usersRepository.create(userData)

      expect(user.id).toBeDefined()
      expect(user.whatsappId).toBe(userData.whatsappId)
      expect(user.telegramId).toBe(userData.telegramId)
      expect(user.emailId).toBe(userData.emailId)
    })
  })

  describe("findById", () => {
    it("should find user by id", async () => {
      const userData = createTestUser()
      const created = await usersRepository.create(userData)

      const found = await usersRepository.findById(created.id)
      expect(found).toEqual(created)
    })

    it("should return null if user not found", async () => {
      const found = await usersRepository.findById("non-existent")
      expect(found).toBeNull()
    })
  })

  describe("findByWhatsappId", () => {
    it("should find user by whatsapp id", async () => {
      const userData = createTestUser()
      const created = await usersRepository.create(userData)

      const found = await usersRepository.findByWhatsappId(userData.whatsappId!)
      expect(found).toEqual(created)
    })

    it("should return null if user not found", async () => {
      const found = await usersRepository.findByWhatsappId("non-existent")
      expect(found).toBeNull()
    })
  })

  describe("findByTelegramId", () => {
    it("should find user by telegram id", async () => {
      const userData = createTestUser()
      const created = await usersRepository.create(userData)

      const found = await usersRepository.findByTelegramId(userData.telegramId!)
      expect(found).toEqual(created)
    })

    it("should return null if user not found", async () => {
      const found = await usersRepository.findByTelegramId("non-existent")
      expect(found).toBeNull()
    })
  })

  describe("findByEmailId", () => {
    it("should find user by email id", async () => {
      const userData = createTestUser()
      const created = await usersRepository.create(userData)

      const found = await usersRepository.findByEmailId(userData.emailId!)
      expect(found).toEqual(created)
    })

    it("should return null if user not found", async () => {
      const found = await usersRepository.findByEmailId("non-existent")
      expect(found).toBeNull()
    })
  })

  describe("incrementSubmissionCount", () => {
    it("should increment submission count and decrement remaining submissions", async () => {
      const userData = createTestUser({
        submissionCount: 5,
        numSubmissionsRemaining: 5,
      })
      const user = await usersRepository.create(userData)

      await usersRepository.incrementSubmissionCount(user.id)

      const updated = await usersRepository.findById(user.id)
      expect(updated?.submissionCount).toBe(6)
      expect(updated?.numSubmissionsRemaining).toBe(4)
    })

    it("should increment by specified amount", async () => {
      const userData = createTestUser({
        submissionCount: 5,
        numSubmissionsRemaining: 5,
      })
      const user = await usersRepository.create(userData)

      await usersRepository.incrementSubmissionCount(user.id, 3)

      const updated = await usersRepository.findById(user.id)
      expect(updated?.submissionCount).toBe(8)
      expect(updated?.numSubmissionsRemaining).toBe(2)
    })
  })

  describe("incrementReferralCount", () => {
    it("should increment referral count", async () => {
      const userData = createTestUser({ referralCount: 5 })
      const user = await usersRepository.create(userData)

      await usersRepository.incrementReferralCount(user.id)

      const updated = await usersRepository.findById(user.id)
      expect(updated?.referralCount).toBe(6)
    })

    it("should increment by specified amount", async () => {
      const userData = createTestUser({ referralCount: 5 })
      const user = await usersRepository.create(userData)

      await usersRepository.incrementReferralCount(user.id, 3)

      const updated = await usersRepository.findById(user.id)
      expect(updated?.referralCount).toBe(8)
    })
  })
})
