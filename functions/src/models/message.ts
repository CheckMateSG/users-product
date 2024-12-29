import {
  getFirestore,
  Timestamp,
  DocumentReference,
  FieldValue,
} from "firebase-admin/firestore"
import {
  CustomReply,
  TagsMap,
  GenerationStatus,
  NumberPointScale,
} from "./types"

export interface Message {
  id: string
  machineCategory: string
  isMachineCategorised: boolean
  isWronglyCategorisedIrrelevant: boolean
  text: string | null
  redactedText: string | null
  caption: string | null
  latestSubmission: DocumentReference | null
  firstTimestamp: Timestamp
  lastTimestamp: Timestamp
  lastRefreshedTimestamp: Timestamp
  isVotingTriggered: boolean
  isAssessed: boolean
  assessmentTimestamp: Timestamp | null
  assessmentExpiry: Timestamp | null
  assessmentExpired: boolean
  truthScore: number | null
  numberPointScale: NumberPointScale
  isControversial: boolean | null
  isIrrelevant: boolean | null
  isHarmful: boolean | null
  isHarmless: boolean | null
  tags: TagsMap
  primaryCategory: string | null
  customReply: CustomReply | null
  generationStatus: GenerationStatus
  generationDocument: DocumentReference | null
  submissionCount: number
  adminBroadcastMessageId: string | null
  embedding: number[] | null
}

export interface Submission {
  id: string
  source: string
  timestamp: Timestamp
  type: "text" | "image"
  text: string | null
  textHash: string | null
  caption: string | null
  captionHash: string | null
  sender: string | null
  imageType: "convo" | "email" | "letter" | "others" | null
  ocrVersion: string | null
  from: string | null
  subject: string | null
  hash: string | null
  mediaId: string | null
  mimeType: string | null
  storageUrl: string | null
  isForwarded: boolean | null
  isFrequentlyForwarded: boolean | null
  isReplied: boolean
  isInterimPromptSent: boolean | null
  isInterimReplySent: boolean | null
  isMeaningfulInterimReplySent: boolean | null
  isCommunityNoteSent: boolean | null
  isCommunityNoteCorrected: boolean
  isCommunityNoteUseful: boolean | null
  isIrrelevantAppealed: boolean | null
  replyCategory: string | null
  embedding: number[] | null
}

// Firestore data converter
export const messageConverter = {
  toFirestore(message: Message): FirebaseFirestore.DocumentData {
    const { id, embedding, ...rest } = message
    return {
      ...rest,
      embedding: embedding ? FieldValue.vector(embedding) : null,
    }
  },
  fromFirestore(snapshot: FirebaseFirestore.QueryDocumentSnapshot): Message {
    return {
      id: snapshot.id,
      ...snapshot.data(),
    } as Message
  },
}

export const submissionConverter = {
  toFirestore(submission: Submission): FirebaseFirestore.DocumentData {
    const { id, embedding, ...rest } = submission
    return {
      ...rest,
      embedding: embedding ? FieldValue.vector(embedding) : null,
    }
  },
  fromFirestore(snapshot: FirebaseFirestore.QueryDocumentSnapshot): Submission {
    return {
      id: snapshot.id,
      ...snapshot.data(),
    } as Submission
  },
}
