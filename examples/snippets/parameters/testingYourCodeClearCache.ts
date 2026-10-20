import { clearCaches } from '@aws-lambda-powertools/parameters';
import { afterEach, describe } from 'vitest';

describe('Function tests', () => {
  afterEach(() => {
    clearCaches();
  });

  // ...
});
