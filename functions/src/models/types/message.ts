// functions\src\models\types\message.ts
import {
  Timestamp,
  DocumentReference,
  FieldValue,
} from "firebase-admin/firestore"

export type MessageType = "text" | "image"
export type ImageType = "convo" | "email" | "letter" | "others" | null
export type NumberPointScale = 5 | 6
export type GenerationStatus = "generated" | "unusable" | "error" | null

export interface TagsMap {
  [key: string]: boolean
}

export interface CustomReply {
  type: MessageType
  text: string
  caption?: string
  lastUpdatedBy: DocumentReference
  lastUpdatedTimestamp: Timestamp
}

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
