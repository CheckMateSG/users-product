# Project Directory Structure

## Root Directory

- **.gitignore**: Global Git ignore file.
- **.prettierrc**: Prettier configuration for the entire project.
- **README.md**: Global project documentation.
- **package.json**: Dependencies for the entire project (if applicable).
- **tsconfig.base.json**: Base TypeScript configuration shared across subprojects.

---

## `functions/` - Firebase Functions Logic

- **src/** - Source code directory

  - **controllers/**: Handles API logic and maps to service functions.
  - **models/**: Defines Firestore models and interactions.
  - **services/**: Implements business logic.
  - **routes/**: Maps API endpoints to controllers.
  - **middlewares/**: Middleware for auth, validation, etc.
  - **triggers/**: Cloud functions triggered by Firestore/other events.
  - **config/**: Firebase and environment-specific configurations.
  - **utils/**: Shared utility functions.
  - **index.ts**: Entry point for Firebase Functions.
  - **app.ts**: Application setup and initialization.

- **tests/** - Unit and integration tests for backend logic.

- **Configuration Files**
  - **.firebaserc**: Firebase project configuration.
  - **firebase.json**: Firebase hosting and functions configuration.
  - **firestore.rules**: Firestore security rules.
  - **firestore.indexes.json**: Firestore composite index definitions.
  - **package.json**: Backend-specific dependencies.
  - **tsconfig.json**: TypeScript configuration for `functions`.
  - **.prettierrc**: (Optional) Prettier config specific to the backend, overrides root.

---

## `docs/` - Documentation Files

- **firestore-schema.yaml**: YAML file for Firestore schema.

---

## `public/` - Static Files for Firebase Hosting (Optional)

---

## `scripts/` - Utility and Database Scripts

- **seedFirestore.js**: Script for seeding Firestore with data.
- **migrateData.js**: Script for migrating data.
- **cleanup.js**: Script for cleaning up old data.
