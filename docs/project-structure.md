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

  - **handlers/**: Event handlers for different types of inputs
    - **http/**: HTTP endpoint handlers
    - **triggers/**: Firestore trigger handlers
    - **pubsub/**: Pub/Sub event handlers
  - **services/**: Core business logic implementation
  - **models/**: Firestore models and data access
  - **middlewares/**: HTTP request middleware (auth, validation, etc.)
  - **config/**: Firebase and environment-specific configurations
  - **utils/**: Shared utility functions
  - **index.ts**: Entry point for Firebase Functions
  - **app.ts**: Express app setup and initialization

- **tests/** - Unit and integration tests for backend logic

  - **handlers/**: Tests for handlers
  - **services/**: Tests for business logic
  - **models/**: Tests for data access
  - **utils/**: Tests for utilities

- **Configuration Files**
  - **.firebaserc**: Firebase project configuration
  - **firebase.json**: Firebase hosting and functions configuration
  - **firestore.rules**: Firestore security rules
  - **firestore.indexes.json**: Firestore composite index definitions
  - **package.json**: Backend-specific dependencies
  - **tsconfig.json**: TypeScript configuration for `functions`

---

## `docs/` - Documentation Files

- **firestore-schema.yaml**: YAML file for Firestore schema
- **project-structure.md**: This file - project organization documentation

---

## `public/` - Static Files for Firebase Hosting (Optional)

---

## `scripts/` - Utility and Database Scripts

- **seedFirestore.js**: Script for seeding Firestore with data.
- **migrateData.js**: Script for migrating data.
- **cleanup.js**: Script for cleaning up old data.
