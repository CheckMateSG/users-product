// functions\src\models\types\generation.ts
import { Timestamp } from "firebase-admin/firestore"

interface Report {
  en: string
  cn: string | null
  isDownvoted: boolean
}

interface CommunityNote {
  en: string
  cn: string | null
  isDownvoted: boolean
  isPendingCorrection: boolean
  adminBroadcastMessageId: string | null
}

export interface Generation {
  id: string
  timestamp: Timestamp
  usable: boolean
  sources: string[]
  report: Report
  communityNote: CommunityNote
}

export const generationConverter = {
  toFirestore(generation: Generation): FirebaseFirestore.DocumentData {
    const { id, ...rest } = generation
    return rest
  },
  fromFirestore(snapshot: FirebaseFirestore.QueryDocumentSnapshot): Generation {
    return {
      id: snapshot.id,
      ...snapshot.data(),
    } as Generation
  },
}
