import { Timestamp, DocumentReference } from 'firebase-admin/firestore';

export type MessageType = 'text' | 'image';
export type ImageType = 'convo' | 'email' | 'letter' | 'others' | null;
export type NumberPointScale = 5 | 6;
export type GenerationStatus = 'generated' | 'unusable' | 'error';

export interface TagsMap {
  [key: string]: boolean;
}

export interface CustomReply {
  type: MessageType;
  text: string;
  caption?: string;
  lastUpdatedBy: DocumentReference;
  lastUpdatedTimestamp: Timestamp;
}
