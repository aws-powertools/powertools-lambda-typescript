import { randomInt } from 'node:crypto';
import { InvokeStore } from '@aws/lambda-invoke-store';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Logger } from '../../../src/index.js';

vi.mock('node:crypto', async (importOriginal) => {
  const mod = await importOriginal<typeof import('node:crypto')>();
  return { ...mod, randomInt: vi.fn(mod.randomInt) };
});

const XRAY_TRACE_ID_KEY = Symbol.for('_AWS_LAMBDA_X_RAY_TRACE_ID');

describe('Debug sampling concurrent invocation isolation', () => {
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

    it('throws when reading the log level with InvokeStore unavailable', () => {
      // Prepare
      const logger = new Logger({ logLevel: 'INFO' });

      // Act & Assess
      expect(() => logger.level).toThrow('InvokeStore is not available');
    });

    it('throws when setting the log level with InvokeStore unavailable', () => {
      // Prepare
      const logger = new Logger({ logLevel: 'INFO' });

      // Act & Assess
      expect(() => {
        logger.setLogLevel('DEBUG');
      }).toThrow('InvokeStore is not available');
    });
  });

  it('sets the instance log level when called outside an invocation context', async () => {
    // Prepare
    await InvokeStore.getInstanceAsync();
    const logger = new Logger({ logLevel: 'INFO' });

    // Act
    logger.setLogLevel('WARN');

    // Assess
    expect(logger.getLevelName()).toBe('WARN');
  });

  it('applies the debug sampling decision only to the invocation that was sampled', async () => {
    // Prepare
    // Rolls: constructor -> not sampled (INFO); invocation A's refresh ->
    // sampled in (DEBUG); invocation B's refresh -> not sampled (INFO)
    vi.mocked(randomInt)
      .mockReturnValueOnce(99 as never)
      .mockReturnValueOnce(0 as never)
      .mockReturnValueOnce(99 as never);
    const store = await InvokeStore.getInstanceAsync();
    const logger = new Logger({ logLevel: 'INFO', sampleRateValue: 0.5 });
    // Cold-start invocation: the first refresh keeps the constructor decision
    logger.refreshSampleRateCalculation();
    const aStarted = Promise.withResolvers<void>();
    const bRefreshed = Promise.withResolvers<void>();

    // Act
    // Warm invocation A is sampled in by its refresh, emits a debug log,
    // yields, invocation B's refresh re-rolls and is NOT sampled, then A
    // emits another debug log
    const invocationA = store.run(
      { [XRAY_TRACE_ID_KEY]: '1-aaaaaaaa-111111111111111111111111' },
      async () => {
        logger.refreshSampleRateCalculation();
        logger.debug('A sampled debug log 1');
        aStarted.resolve();
        await bRefreshed.promise;
        logger.debug('A sampled debug log 2');
      }
    );
    const invocationB = (async () => {
      await aStarted.promise;
      await store.run(
        { [XRAY_TRACE_ID_KEY]: '1-bbbbbbbb-222222222222222222222222' },
        async () => {
          logger.refreshSampleRateCalculation();
          logger.debug('B unsampled debug log');
        }
      );
      bRefreshed.resolve();
    })();
    await Promise.all([invocationA, invocationB]);

    // Assess
    expect(console.debug).toHaveLogged(
      expect.objectContaining({ message: 'A sampled debug log 1' })
    );
    expect(console.debug).toHaveLogged(
      expect.objectContaining({ message: 'A sampled debug log 2' })
    );
    expect(console.debug).not.toHaveLogged(
      expect.objectContaining({ message: 'B unsampled debug log' })
    );
  });

  it('keeps the invocation-scoped log level from leaking into later invocations', async () => {
    // Prepare
    const store = await InvokeStore.getInstanceAsync();
    const logger = new Logger({ logLevel: 'INFO' });

    // Act
    // An invocation raises its own verbosity, then a later invocation logs
    await store.run(
      { [XRAY_TRACE_ID_KEY]: '1-aaaaaaaa-111111111111111111111111' },
      async () => {
        logger.setLogLevel('DEBUG');
        logger.debug('debug log from the invocation that opted in');
      }
    );
    await store.run(
      { [XRAY_TRACE_ID_KEY]: '1-bbbbbbbb-222222222222222222222222' },
      async () => {
        logger.debug('debug log from a later invocation');
      }
    );

    // Assess
    expect(console.debug).toHaveLogged(
      expect.objectContaining({
        message: 'debug log from the invocation that opted in',
      })
    );
    expect(console.debug).not.toHaveLogged(
      expect.objectContaining({ message: 'debug log from a later invocation' })
    );
  });

  it('keeps each invocation log level isolated when two invocations overlap', async () => {
    // Prepare
    const store = await InvokeStore.getInstanceAsync();
    const logger = new Logger({ logLevel: 'INFO' });
    const aSetLevel = Promise.withResolvers<void>();
    const bSetLevel = Promise.withResolvers<void>();

    // Act
    // Invocation A raises its level to DEBUG and yields, invocation B enters
    // concurrently and sets its own level to ERROR, then A resumes and logs
    const invocationA = store.run(
      { [XRAY_TRACE_ID_KEY]: '1-aaaaaaaa-111111111111111111111111' },
      async () => {
        logger.setLogLevel('DEBUG');
        aSetLevel.resolve();
        await bSetLevel.promise;
        logger.debug('A debug after B changed its own level');
      }
    );
    const invocationB = (async () => {
      await aSetLevel.promise;
      await store.run(
        { [XRAY_TRACE_ID_KEY]: '1-bbbbbbbb-222222222222222222222222' },
        async () => {
          logger.setLogLevel('ERROR');
          logger.debug('B debug that should be suppressed');
        }
      );
      bSetLevel.resolve();
    })();
    await Promise.all([invocationA, invocationB]);

    // Assess
    // A stays at DEBUG even though B set ERROR in between...
    expect(console.debug).toHaveLogged(
      expect.objectContaining({
        message: 'A debug after B changed its own level',
      })
    );
    // ...and B's debug is suppressed by its own ERROR level
    expect(console.debug).not.toHaveLogged(
      expect.objectContaining({ message: 'B debug that should be suppressed' })
    );
  });
});
