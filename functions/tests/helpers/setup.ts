// functions\tests\helpers\setup.ts
import * as admin from "firebase-admin"

// Initialize Firebase Admin with emulator
process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080"
process.env.NODE_ENV = "test"

admin.initializeApp({
  projectId: "demo-project-id",
})

// Extend Jest timeout for async operations
jest.setTimeout(10000)
