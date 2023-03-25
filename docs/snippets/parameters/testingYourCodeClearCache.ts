import { clearCache } from '@aws-lambda-powertools/parameters';

describe('Function tests', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    clearCache();
  });

  // ...

});