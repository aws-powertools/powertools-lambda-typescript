import { InvokeStore } from '@aws/lambda-invoke-store';
import { sequence } from '@aws-lambda-powertools/testing-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LogAttributesStore } from '../../../src/LogAttributesStore.js';

describe('LogAttributesStore concurrent invocation isolation', () => {
  beforeEach(() => {
    InvokeStore._testing?.reset();
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it.each([
    {
      description: 'without InvokeStore',
      useInvokeStore: false,
      expectedResult1: { key: 'value2' },
      expectedResult2: { key: 'value2' },
    },
    {
      description: 'with InvokeStore',
      useInvokeStore: true,
      expectedResult1: { key: 'value1' },
      expectedResult2: { key: 'value2' },
    },
  ])('handles storing temporary attributes $description', async ({
    useInvokeStore,
    expectedResult1,
    expectedResult2,
  }) => {
    // Prepare
    if (useInvokeStore) {
      vi.stubEnv('AWS_LAMBDA_MAX_CONCURRENCY', '10');
    }
    const store = new LogAttributesStore();

    // Act
    const [result1, result2] = await sequence(
      {
        sideEffects: [() => store.appendTemporaryKeys({ key: 'value1' })],
        return: () => store.getTemporaryAttributes(),
      },
      {
        sideEffects: [() => store.appendTemporaryKeys({ key: 'value2' })],
        return: () => store.getTemporaryAttributes(),
      },
      { useInvokeStore }
    );

    // Assess
    expect(result1).toEqual(expectedResult1);
    expect(result2).toEqual(expectedResult2);
  });

  it.each([
    {
      description: 'without InvokeStore',
      useInvokeStore: false,
      expectedResult1: {},
      expectedResult2: {},
    },
    {
      description: 'with InvokeStore',
      useInvokeStore: true,
      expectedResult1: {},
      expectedResult2: { region: 'us-east-1' },
    },
  ])('handles clearing temporary attributes $description', async ({
    useInvokeStore,
    expectedResult1,
    expectedResult2,
  }) => {
    // Prepare
    if (useInvokeStore) {
      vi.stubEnv('AWS_LAMBDA_MAX_CONCURRENCY', '10');
    }
    const store = new LogAttributesStore();

    // Act
    const [result1, result2] = await sequence(
      {
        sideEffects: [
          () => store.appendTemporaryKeys({ env: 'prod' }),
          () => {}, // Wait for inv2 to add
          () => store.clearTemporaryAttributes(),
        ],
        return: () => store.getTemporaryAttributes(),
      },
      {
        sideEffects: [
          () => {}, // Wait for inv1 to add
          () => store.appendTemporaryKeys({ region: 'us-east-1' }),
          () => {}, // Wait for clear
        ],
        return: () => store.getTemporaryAttributes(),
      },
      { useInvokeStore }
    );

    // Assess
    expect(result1).toEqual(expectedResult1);
    expect(result2).toEqual(expectedResult2);
  });

  it('persistent attributes are shared across invocations', async () => {
    // Prepare
    vi.stubEnv('AWS_LAMBDA_MAX_CONCURRENCY', '10');
    let store: LogAttributesStore;

    // Act
    const [result1, result2] = await sequence(
      {
        sideEffects: [
          () => {
            // Store must be created inside ALS context because reset() clears InvokeStore
            store = new LogAttributesStore();
            store.setPersistentAttributes({ service: 'my-service' });
            store.appendTemporaryKeys({ env: 'prod' });
          },
        ],
        return: () => store.getAllAttributes(),
      },
      {
        sideEffects: [() => store.appendTemporaryKeys({ env: 'dev' })],
        return: () => store.getAllAttributes(),
      },
      { useInvokeStore: true }
    );

    // Assess
    expect(result1).toEqual({ service: 'my-service', env: 'prod' });
    expect(result2).toEqual({ service: 'my-service', env: 'dev' });
  });

  it.each([
    {
      description: 'without InvokeStore',
      useInvokeStore: false,
      expectedResult1: { key1: 'value1' },
      expectedResult2: { key1: 'value1' },
    },
    {
      description: 'with InvokeStore',
      useInvokeStore: true,
      expectedResult1: { key1: 'value1' },
      expectedResult2: {},
    },
  ])('isolates temporary keys $description', async ({
    useInvokeStore,
    expectedResult1,
    expectedResult2,
  }) => {
    // Prepare
    if (useInvokeStore) {
      vi.stubEnv('AWS_LAMBDA_MAX_CONCURRENCY', '10');
    }
    const store = new LogAttributesStore();

    // Act
    const [result1, result2] = await sequence(
      {
        sideEffects: [() => store.appendTemporaryKeys({ key1: 'value1' })],
        return: () => store.getTemporaryAttributes(),
      },
      {
        sideEffects: [() => {}], // No-op
        return: () => store.getTemporaryAttributes(),
      },
      { useInvokeStore }
    );

    // Assess
    expect(result1).toEqual(expectedResult1);
    expect(result2).toEqual(expectedResult2);
  });
});
