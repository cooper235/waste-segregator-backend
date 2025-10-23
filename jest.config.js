/**
 * Jest Configuration
 * Setup for running tests with MongoDB
 */

module.exports = {
  testEnvironment: "node",
  coveragePathIgnorePatterns: ["/node_modules/"],
  testMatch: ["**/__tests__/**/*.test.js"],
  collectCoverageFrom: ["src/**/*.js", "!src/**/*.test.js", "!src/config/**", "!src/utils/seed.js"],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup.js"],
  testTimeout: 10000,
  testEnvironmentOptions: {
    NODE_ENV: "test",
  },
  globals: {
    "ts-jest": {
      isolatedModules: true,
    },
  },
}
