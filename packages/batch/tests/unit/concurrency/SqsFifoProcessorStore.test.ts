import { sequence } from '@aws-lambda-powertools/testing-utils';
import { beforeEach, describe, expect, it } from 'vitest';
import { SqsFifoProcessorStore } from '../../../src/SqsFifoProcessorStore.js';

describe('SqsFifoProcessorStore concurrent invocation isolation', () => {
  beforeEach(() => {
    // No mocks needed
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
  ])(
    'lazily initializes failedGroupIds independently $description',
    async ({ useInvokeStore, expectedResultA, expectedResultB }) => {
      // Prepare
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
    }
  );

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
  ])(
    'isolates currentGroupId per invocation $description',
    async ({ useInvokeStore, expectedResultA, expectedResultB }) => {
      // Prepare
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
    }
  );

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
  ])(
    'clears failedGroupIds independently per invocation $description',
    async ({ useInvokeStore, expectedResultA, expectedResultB }) => {
      // Prepare
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
    }
  );
});
