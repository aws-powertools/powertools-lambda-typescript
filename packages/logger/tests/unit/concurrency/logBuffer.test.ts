import { InvokeStore } from '@aws/lambda-invoke-store';
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
    const store = await InvokeStore.getInstanceAsync();
    const aBuffered = Promise.withResolvers<void>();
    const bBuffered = Promise.withResolvers<void>();

    // Act
    // Invocation A buffers a debug log, yields (simulating I/O), invocation B
    // starts concurrently and buffers its first debug log under a different
    // trace id, then A errors and flushes its buffer
    const invocationA = store.run(
      { [XRAY_TRACE_ID_KEY]: '1-aaaaaaaa-111111111111111111111111' },
      async () => {
        logger.debug('A buffered debug log');
        aBuffered.resolve();
        await bBuffered.promise;
        logger.flushBuffer();
      }
    );
    const invocationB = (async () => {
      await aBuffered.promise;
      await store.run(
        { [XRAY_TRACE_ID_KEY]: '1-bbbbbbbb-222222222222222222222222' },
        async () => {
          logger.debug('B buffered debug log');
        }
      );
      bBuffered.resolve();
    })();
    await Promise.all([invocationA, invocationB]);

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
    const store = await InvokeStore.getInstanceAsync();
    const aBuffered = Promise.withResolvers<void>();
    const aFlushed = Promise.withResolvers<void>();

    // Act
    // Invocation A buffers and flushes while invocation B is mid-flight with
    // its own buffered log, then B flushes its own buffer
    const invocationB = store.run(
      { [XRAY_TRACE_ID_KEY]: '1-bbbbbbbb-222222222222222222222222' },
      async () => {
        logger.debug('B buffered debug log');
        await aFlushed.promise;
        logger.flushBuffer();
      }
    );
    const invocationA = store.run(
      { [XRAY_TRACE_ID_KEY]: '1-aaaaaaaa-111111111111111111111111' },
      async () => {
        logger.debug('A buffered debug log');
        aBuffered.resolve();
        logger.flushBuffer();
        aFlushed.resolve();
      }
    );
    await Promise.all([invocationA, invocationB]);

    // Assess
    expect(console.debug).toHaveLogged(
      expect.objectContaining({ message: 'A buffered debug log' })
    );
    expect(console.debug).toHaveLogged(
      expect.objectContaining({ message: 'B buffered debug log' })
    );
  });
});
