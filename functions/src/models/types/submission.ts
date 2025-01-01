import { Timestamp, FieldValue } from "firebase-admin/firestore"

export interface Submission {
  id: string
  source: string
  sourceUniqueId: string
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
