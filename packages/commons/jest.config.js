module.exports = {
  'preset': 'ts-jest',
  'transform': {
    '^.+\\.ts?$': 'ts-jest',
  },
  moduleFileExtensions: [ 'js', 'ts' ],
  'collectCoverageFrom': [
    '**/src/**/*.ts',
    '!**/node_modules/**',
  ],
  'testMatch': ['**/?(*.)+(spec|test).ts'],
  'roots': [
    '<rootDir>/src',
    '<rootDir>/tests',
  ],
  'testPathIgnorePatterns': [
    '/node_modules/',
  ],
  'testEnvironment': 'node',
  'coveragePathIgnorePatterns': [
    '/node_modules/',
    /** 
    * e2eUtils.ts contains helper methods that simplify several calls to CDK and SDK interface.
    * Unit testing it is mostly mocking the CDK/SDK functions. It will be brittle and yield little value.
    * In addition, the file is used for every E2E test run, so its correctness is verified for every PR. 
    */
    '/src/tests/e2e/e2eUtils.ts',
  ],
  'coverageThreshold': {
    'global': {
      'statements': 100,
      'branches': 100,
      'functions': 100,
      'lines': 100,
    },
  },
  'coverageReporters': [
    'json-summary',
    'text',
    'lcov' ],
};