import { sequence } from '@aws-lambda-powertools/testing-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Logger } from '../../../src/index.js';

describe('Logger concurrent invocation isolation', () => {
  beforeEach(() => {
    vi.stubEnv('POWERTOOLS_DEV', 'true');
    vi.clearAllMocks();
  });

  it.each([
    {
      description: 'without InvokeStore',
      useInvokeStore: false,
      expectedKeys: [{ env: 'dev', requestId: 'req-2' }],
    },
    {
      description: 'with InvokeStore',
      useInvokeStore: true,
      expectedKeys: [
        { env: 'prod', requestId: 'req-1' },
        { env: 'dev', requestId: 'req-2' },
      ],
    },
  ])(
    'handles temporary attributes $description',
    async ({ useInvokeStore, expectedKeys }) => {
      // Prepare
      const logger = new Logger({ serviceName: 'test' });

      // Act
      await sequence(
        {
          sideEffects: [
            () => {
              logger.appendKeys({ env: 'prod', requestId: 'req-1' });
              logger.info('Test message');
            },
          ],
          return: () => {},
        },
        {
          sideEffects: [
            () => {
              logger.appendKeys({ env: 'dev', requestId: 'req-2' });
              logger.info('Test message');
            },
          ],
          return: () => {},
        },
        { useInvokeStore }
      );

      // Assess
      for (const expectedOutput of expectedKeys) {
        expect(console.info).toHaveLogged(
          expect.objectContaining(expectedOutput)
        );
      }
    }
  );

  it.each([
    {
      description: 'without InvokeStore',
      useInvokeStore: false,
      expectedKeys: [{ region: 'us-east-1', version: '2.0' }],
    },
    {
      description: 'with InvokeStore',
      useInvokeStore: true,
      expectedKeys: [
        { region: 'us-west-2', version: '1.0' },
        { region: 'us-east-1', version: '2.0' },
      ],
    },
  ])(
    'handles persistent attributes $description',
    async ({ useInvokeStore, expectedKeys }) => {
      // Prepare
      const logger = new Logger({
        serviceName: 'test',
        persistentKeys: { app: 'test' },
      });

      // Act
      await sequence(
        {
          sideEffects: [
            () => {
              logger.appendPersistentKeys({
                region: 'us-west-2',
                version: '1.0',
              });
              logger.info('Test message');
            },
          ],
          return: () => {},
        },
        {
          sideEffects: [
            () => {
              logger.appendPersistentKeys({
                region: 'us-east-1',
                version: '2.0',
              });
              logger.info('Test message');
            },
          ],
          return: () => {},
        },
        { useInvokeStore }
      );

      // Assess
      for (const expectedOutput of expectedKeys) {
        expect(console.info).toHaveLogged(
          expect.objectContaining(expectedOutput)
        );
      }
    }
  );

  it.each([
    {
      description: 'without InvokeStore',
      useInvokeStore: false,
      expectedKeys: [{ env: 'dev', requestId: 'req-2' }],
    },
    {
      description: 'with InvokeStore',
      useInvokeStore: true,
      expectedKeys: [
        { env: 'prod', requestId: 'req-1' },
        { env: 'dev', requestId: 'req-2' },
      ],
    },
  ])(
    'handles mixed temporary and persistent attributes $description',
    async ({ useInvokeStore, expectedKeys }) => {
      // Prepare
      const logger = new Logger({
        serviceName: 'test',
        persistentKeys: { app: 'test' },
      });

      // Act
      await sequence(
        {
          sideEffects: [
            () => {
              logger.appendPersistentKeys({ env: 'prod' });
              logger.appendKeys({ requestId: 'req-1' });
              logger.info('Test message');
            },
          ],
          return: () => {},
        },
        {
          sideEffects: [
            () => {
              logger.appendPersistentKeys({ env: 'dev' });
              logger.appendKeys({ requestId: 'req-2' });
              logger.info('Test message');
            },
          ],
          return: () => {},
        },
        { useInvokeStore }
      );

      // Assess
      for (const expectedOutput of expectedKeys) {
        expect(console.info).toHaveLogged(
          expect.objectContaining(expectedOutput)
        );
      }
    }
  );

  it.each([
    {
      description: 'without InvokeStore',
      useInvokeStore: false,
      shouldContain: [],
    },
    {
      description: 'with InvokeStore',
      useInvokeStore: true,
      shouldContain: [{ requestId: 'req-2' }],
    },
  ])(
    'handles clearing temporary attributes $description',
    async ({ useInvokeStore, shouldContain }) => {
      // Prepare
      const logger = new Logger({ serviceName: 'test' });

      // Act
      await sequence(
        {
          sideEffects: [
            () => {
              logger.appendKeys({ requestId: 'req-1', env: 'prod' });
            },
            () => {}, // Wait for inv2 to add
            () => {
              logger.resetKeys();
              logger.info('Test message');
            },
          ],
          return: () => {},
        },
        {
          sideEffects: [
            () => {}, // Wait for inv1 to add
            () => {
              logger.appendKeys({ requestId: 'req-2' });
            },
            () => {
              logger.info('Test message');
            },
          ],
          return: () => {},
        },
        { useInvokeStore }
      );

      // Assess
      for (const expectedOutput of shouldContain) {
        expect(console.info).toHaveLogged(
          expect.objectContaining(expectedOutput)
        );
      }
    }
  );

  it.each([
    {
      description: 'without InvokeStore',
      useInvokeStore: false,
      expectedKeys: [{ requestId: 'req-2' }],
    },
    {
      description: 'with InvokeStore',
      useInvokeStore: true,
      expectedKeys: [{ requestId: 'req-1' }, { requestId: 'req-2' }],
    },
  ])(
    'handles removing specific temporary keys $description',
    async ({ useInvokeStore, expectedKeys }) => {
      // Prepare
      const logger = new Logger({ serviceName: 'test' });

      // Act
      await sequence(
        {
          sideEffects: [
            () => {
              logger.appendKeys({ requestId: 'req-1', env: 'prod' });
              logger.removeKeys(['env']);
              logger.info('Test message');
            },
          ],
          return: () => {},
        },
        {
          sideEffects: [
            () => {
              logger.appendKeys({ requestId: 'req-2', env: 'dev' });
              logger.removeKeys(['env']);
              logger.info('Test message');
            },
          ],
          return: () => {},
        },
        { useInvokeStore }
      );

      // Assess
      for (const expectedOutput of expectedKeys) {
        expect(console.info).toHaveLogged(
          expect.objectContaining(expectedOutput)
        );
      }
    }
  );

  it.each([
    {
      description: 'without InvokeStore',
      useInvokeStore: false,
      expectedKeys: [{ correlation_id: 'corr-2' }],
    },
    {
      description: 'with InvokeStore',
      useInvokeStore: true,
      expectedKeys: [
        { correlation_id: 'corr-1' },
        { correlation_id: 'corr-2' },
      ],
    },
  ])(
    'handles correlation IDs $description',
    async ({ useInvokeStore, expectedKeys }) => {
      // Prepare
      const logger = new Logger({ serviceName: 'test' });

      // Act
      await sequence(
        {
          sideEffects: [
            () => {
              logger.setCorrelationId('corr-1');
              logger.info('Test message');
            },
          ],
          return: () => {},
        },
        {
          sideEffects: [
            () => {
              logger.setCorrelationId('corr-2');
              logger.info('Test message');
            },
          ],
          return: () => {},
        },
        { useInvokeStore }
      );

      // Assess
      for (const expectedOutput of expectedKeys) {
        expect(console.info).toHaveLogged(
          expect.objectContaining(expectedOutput)
        );
      }
    }
  );
});
