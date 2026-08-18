import { InvokeStore } from '@aws/lambda-invoke-store';
import { sequence } from '@aws-lambda-powertools/testing-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Logger } from '../../../src/index.js';

const XRAY_TRACE_ID_KEY = Symbol.for('_AWS_LAMBDA_X_RAY_TRACE_ID');

describe('Log buffer concurrent invocation isolation', () => {
  beforeEach(() => {
    InvokeStore._testing?.reset();
    vi.stubEnv('POWERTOOLS_DEV', 'true');
    vi.stubEnv('AWS_LAMBDA_MAX_CONCURRENCY', '10');
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('InvokeStore error handling', () => {
    beforeEach(() => {
      vi.stubGlobal('awslambda', undefined);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('throws when clearing the buffer with InvokeStore unavailable', () => {
      // Prepare
      const logger = new Logger({
        logLevel: 'INFO',
        logBufferOptions: { enabled: true },
      });

      // Act & Assess
      expect(() => {
        logger.clearBuffer();
      }).toThrow('InvokeStore is not available');
    });
  });

  it('keeps each invocation buffered logs when a concurrent invocation starts buffering', async () => {
    // Prepare
    const logger = new Logger({
      logLevel: 'INFO',
      logBufferOptions: { enabled: true },
    });

    // Act
    // Invocation A buffers a debug log, invocation B starts concurrently and
    // buffers its own debug log under a different trace id, then A flushes
    await sequence(
      {
        sideEffects: [
          () => {
            logger.debug('A buffered debug log');
          },
          () => {}, // Wait for inv2 to buffer
          () => {
            logger.flushBuffer();
          },
        ],
        return: () => {},
        context: {
          [XRAY_TRACE_ID_KEY]: '1-aaaaaaaa-111111111111111111111111',
        },
      },
      {
        sideEffects: [
          () => {}, // Wait for inv1 to buffer
          () => {
            logger.debug('B buffered debug log');
          },
          () => {},
        ],
        return: () => {},
        context: {
          [XRAY_TRACE_ID_KEY]: '1-bbbbbbbb-222222222222222222222222',
        },
      },
      { useInvokeStore: true }
    );

    // Assess
    expect(console.debug).toHaveLogged(
      expect.objectContaining({ message: 'A buffered debug log' })
    );
    expect(console.debug).not.toHaveLogged(
      expect.objectContaining({ message: 'B buffered debug log' })
    );
  });

  it('flushes each invocation buffer independently', async () => {
    // Prepare
    const logger = new Logger({
      logLevel: 'INFO',
      logBufferOptions: { enabled: true },
    });

    // Act
    // Each invocation buffers its own debug log, then each flushes its own
    await sequence(
      {
        sideEffects: [
          () => {
            logger.debug('A buffered debug log');
          },
          () => {
            logger.flushBuffer();
          },
        ],
        return: () => {},
        context: {
          [XRAY_TRACE_ID_KEY]: '1-aaaaaaaa-111111111111111111111111',
        },
      },
      {
        sideEffects: [
          () => {
            logger.debug('B buffered debug log');
          },
          () => {
            logger.flushBuffer();
          },
        ],
        return: () => {},
        context: {
          [XRAY_TRACE_ID_KEY]: '1-bbbbbbbb-222222222222222222222222',
        },
      },
      { useInvokeStore: true }
    );

    // Assess
    expect(console.debug).toHaveLogged(
      expect.objectContaining({ message: 'A buffered debug log' })
    );
    expect(console.debug).toHaveLogged(
      expect.objectContaining({ message: 'B buffered debug log' })
    );
  });
});
