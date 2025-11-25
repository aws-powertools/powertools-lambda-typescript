import { InvokeStore } from '@aws/lambda-invoke-store';
import { sequence } from '@aws-lambda-powertools/testing-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SqsFifoProcessorStore } from '../../../src/SqsFifoProcessorStore.js';

describe('SqsFifoProcessorStore concurrent invocation isolation', () => {
  beforeEach(() => {
    InvokeStore._testing?.reset();
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

    it('throws error when AWS_LAMBDA_MAX_CONCURRENCY is set but InvokeStore is not available', () => {
      // Prepare
      vi.stubEnv('AWS_LAMBDA_MAX_CONCURRENCY', '10');
      const store = new SqsFifoProcessorStore();

      // Act & Assess
      expect(() => {
        store.addFailedGroupId('group-A');
      }).toThrow('InvokeStore is not available');
    });

    it('throws error when getting current group id with InvokeStore unavailable', () => {
      // Prepare
      vi.stubEnv('AWS_LAMBDA_MAX_CONCURRENCY', '10');
      const store = new SqsFifoProcessorStore();

      // Act & Assess
      expect(() => {
        store.getCurrentGroupId();
      }).toThrow('InvokeStore is not available');
    });

    it('throws error when setting current group id with InvokeStore unavailable', () => {
      // Prepare
      vi.stubEnv('AWS_LAMBDA_MAX_CONCURRENCY', '10');
      const store = new SqsFifoProcessorStore();

      // Act & Assess
      expect(() => {
        store.setCurrentGroupId('group-A');
      }).toThrow('InvokeStore is not available');
    });

    it('throws error when clearing failed group ids with InvokeStore unavailable', () => {
      // Prepare
      vi.stubEnv('AWS_LAMBDA_MAX_CONCURRENCY', '10');
      const store = new SqsFifoProcessorStore();

      // Act & Assess
      expect(() => {
        store.clearFailedGroupIds();
      }).toThrow('InvokeStore is not available');
    });
  });

  it.each([
    {
      description: 'without InvokeStore',
      useInvokeStore: false,
      expectedResultA: ['group-A', 'group-B'],
      expectedResultB: ['group-A', 'group-B'],
    },
    {
      description: 'with InvokeStore',
      useInvokeStore: true,
      expectedResultA: ['group-A'],
      expectedResultB: ['group-B'],
    },
  ])('lazily initializes failedGroupIds independently $description', async ({
    useInvokeStore,
    expectedResultA,
    expectedResultB,
  }) => {
    // Prepare
    if (useInvokeStore) {
      vi.stubEnv('AWS_LAMBDA_MAX_CONCURRENCY', '10');
    }
    const store = new SqsFifoProcessorStore();

    // Act
    const [resultA, resultB] = await sequence(
      {
        sideEffects: [
          () => {
            store.addFailedGroupId('group-A');
          },
          () => {},
        ],
        return: () => Array.from(store.getFailedGroupIds()),
      },
      {
        sideEffects: [
          () => {},
          () => {
            store.addFailedGroupId('group-B');
          },
        ],
        return: () => Array.from(store.getFailedGroupIds()),
      },
      { useInvokeStore }
    );

    // Assess
    expect(resultA.sort()).toEqual(expectedResultA.sort());
    expect(resultB.sort()).toEqual(expectedResultB.sort());
  });

  it.each([
    {
      description: 'without InvokeStore',
      useInvokeStore: false,
      expectedResultA: 'group-B',
      expectedResultB: 'group-B',
    },
    {
      description: 'with InvokeStore',
      useInvokeStore: true,
      expectedResultA: 'group-A',
      expectedResultB: 'group-B',
    },
  ])('isolates currentGroupId per invocation $description', async ({
    useInvokeStore,
    expectedResultA,
    expectedResultB,
  }) => {
    // Prepare
    if (useInvokeStore) {
      vi.stubEnv('AWS_LAMBDA_MAX_CONCURRENCY', '10');
    }
    const store = new SqsFifoProcessorStore();

    // Act
    const [resultA, resultB] = await sequence(
      {
        sideEffects: [
          () => {
            store.setCurrentGroupId('group-A');
          },
          () => {},
        ],
        return: () => store.getCurrentGroupId(),
      },
      {
        sideEffects: [
          () => {},
          () => {
            store.setCurrentGroupId('group-B');
          },
        ],
        return: () => store.getCurrentGroupId(),
      },
      { useInvokeStore }
    );

    // Assess
    expect(resultA).toBe(expectedResultA);
    expect(resultB).toBe(expectedResultB);
  });

  it.each([
    {
      description: 'without InvokeStore',
      useInvokeStore: false,
      expectedResultA: ['group-B'],
      expectedResultB: ['group-B'],
    },
    {
      description: 'with InvokeStore',
      useInvokeStore: true,
      expectedResultA: [],
      expectedResultB: ['group-B'],
    },
  ])('clears failedGroupIds independently per invocation $description', async ({
    useInvokeStore,
    expectedResultA,
    expectedResultB,
  }) => {
    // Prepare
    if (useInvokeStore) {
      vi.stubEnv('AWS_LAMBDA_MAX_CONCURRENCY', '10');
    }
    const store = new SqsFifoProcessorStore();

    // Act
    const [resultA, resultB] = await sequence(
      {
        sideEffects: [
          () => {
            store.addFailedGroupId('group-A');
          },
          () => {
            store.clearFailedGroupIds();
          },
        ],
        return: () => Array.from(store.getFailedGroupIds()),
      },
      {
        sideEffects: [
          () => {},
          () => {
            store.addFailedGroupId('group-B');
          },
        ],
        return: () => Array.from(store.getFailedGroupIds()),
      },
      { useInvokeStore }
    );

    // Assess
    expect(resultA.sort()).toEqual(expectedResultA.sort());
    expect(resultB.sort()).toEqual(expectedResultB.sort());
  });
});
