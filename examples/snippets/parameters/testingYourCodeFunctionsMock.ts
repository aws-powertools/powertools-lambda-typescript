import { afterEach, describe, expect, it, vi } from 'vitest';
import { handler } from './testingYourCodeFunctionsHandler.js';

const mocks = vi.hoisted(() => ({
  getParameter: vi.fn(),
}));

vi.mock('@aws-lambda-powertools/parameters/ssm', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@aws-lambda-powertools/parameters/ssm')
  >()),
  getParameter: mocks.getParameter,
}));

describe('Function tests', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns the correct response', async () => {
    // Prepare
    mocks.getParameter.mockResolvedValueOnce('my/param');

    // Act
    const result = await handler({}, {});

    // Assess
    expect(result).toEqual({
      value: 'my/param',
    });
  });
});
