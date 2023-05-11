import { clearCaches } from '@aws-lambda-powertools/parameters';

describe('Function tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    clearCaches();
  });

  // ...
});
