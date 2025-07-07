import context from '@aws-lambda-powertools/testing-utils/context';
import { describe, expect, it, vi } from 'vitest';
import {
  cleanupMiddlewares,
  IDEMPOTENCY_KEY,
  LOGGER_KEY,
  METRICS_KEY,
  TRACER_KEY,
} from '../../src/index.js';

describe('Function: cleanupMiddlewares', () => {
  it('calls the cleanup function that are present', async () => {
    // Prepare
    const mockCleanupFunction1 = vi.fn();
    const mockCleanupFunction2 = vi.fn();
    const mockCleanupFunction3 = vi.fn();
    const mockCleanupFunction4 = vi.fn();
    const mockRequest = {
      event: {},
      context: context,
      response: null,
      error: null,
      internal: {
        [TRACER_KEY]: mockCleanupFunction1,
        [METRICS_KEY]: mockCleanupFunction2,
        [LOGGER_KEY]: mockCleanupFunction3,
        [IDEMPOTENCY_KEY]: mockCleanupFunction4,
      },
    };

    // Act
    await cleanupMiddlewares(mockRequest);

    // Assess
    expect(mockCleanupFunction1).toHaveBeenCalledTimes(1);
    expect(mockCleanupFunction1).toHaveBeenCalledWith(mockRequest);
    expect(mockCleanupFunction2).toHaveBeenCalledTimes(1);
    expect(mockCleanupFunction2).toHaveBeenCalledWith(mockRequest);
    expect(mockCleanupFunction3).toHaveBeenCalledTimes(1);
    expect(mockCleanupFunction3).toHaveBeenCalledWith(mockRequest);
    expect(mockCleanupFunction4).toHaveBeenCalledTimes(1);
    expect(mockCleanupFunction4).toHaveBeenCalledWith(mockRequest);
  });
  it('resolves successfully if no cleanup function is present', async () => {
    // Prepare
    const mockRequest = {
      event: {},
      context: context,
      response: null,
      error: null,
      internal: {},
    };

    // Act & Assess
    await expect(cleanupMiddlewares(mockRequest)).resolves.toBeUndefined();
  });
  it('resolves successfully if cleanup function is not a function', async () => {
    // Prepare
    const mockRequest = {
      event: {},
      context: context,
      response: null,
      error: null,
      internal: {
        [TRACER_KEY]: 'not a function',
      },
    };

    // Act & Assess
    await expect(cleanupMiddlewares(mockRequest)).resolves.toBeUndefined();
  });
});
