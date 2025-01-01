import { Timestamp } from "firebase-admin/firestore"

export type AgeGroup = "<20" | "21-35" | "36-50" | "51-65" | ">65" | null
export type FirstMessageType = "normal" | "irrelevant" | "prepopulated"
export type Language = "en" | "cn"
export type UserTier = "free" | "paid"

export interface UtmParameters {
  source: string
  medium: string
  content: string
  campaign: string
  term: string
}

export interface User {
  id: string
  whatsappId: string | null
  telegramId: string | null
  emailId: string | null
  ageGroup: AgeGroup
  submissionCount: number
  firstInteractionTime: Timestamp
  firstMessageType: FirstMessageType
  lastSent: Timestamp | null
  initialJourney: { [key: string]: string }
  referralId: string
  utm: UtmParameters
  referralCount: number
  isReferralMessageSent: boolean
  language: Language
  isSubscribedUpdates: boolean
  isIgnored: boolean
  isOnboardingComplete: boolean
  numSubmissionsRemaining: number
  dailySubmissionLimit: number
  isInterestedInSubscription: boolean | null
  isInterestedAtALowerPoint: boolean | null
  interestedFor: string[] | null
  priceWhereInterested: number | null
  feedback: string | null
  tier: UserTier
  isTester: boolean
}

// Firestore data converter
export const userConverter = {
  toFirestore(user: User): FirebaseFirestore.DocumentData {
    const { id, ...rest } = user
    return rest
  },
  fromFirestore(snapshot: FirebaseFirestore.QueryDocumentSnapshot): User {
    return {
      id: snapshot.id,
      ...snapshot.data(),
    } as User
  },
}