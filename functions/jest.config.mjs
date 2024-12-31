export default {
  preset: "ts-jest",
  testEnvironment: "node",
  setupFilesAfterEnv: ["./tests/helpers/setup.ts"],
}
