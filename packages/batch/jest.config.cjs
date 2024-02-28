module.exports = {
  displayName: {
    name: 'Powertools for AWS Lambda (TypeScript) utility: BATCH',
    color: 'orange',
  },
  runner: 'groups',
  preset: 'ts-jest',
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
  moduleFileExtensions: ['js', 'ts'],
  collectCoverageFrom: ['**/src/**/*.ts', '!**/node_modules/**'],
  testMatch: ['**/?(*.)+(spec|test).ts'],
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testPathIgnorePatterns: ['/node_modules/'],
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/node_modules/', '/types/'],
  coverageThreshold: {
    global: {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
    },
  },
  coverageReporters: ['json-summary', 'text', 'lcov'],
  setupFiles: ['<rootDir>/tests/helpers/populateEnvironmentVariables.ts'],
};
