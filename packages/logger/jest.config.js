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
  ],
  'coverageThreshold': {
    'global': {
      'statements': 70,
      'branches': 60,
      'functions': 70,
      'lines': 70,
    },
  },
  'coverageReporters': [
    'json-summary',
    'text',
    'lcov' ],
};