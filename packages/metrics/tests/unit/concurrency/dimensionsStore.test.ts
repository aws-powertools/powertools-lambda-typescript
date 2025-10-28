import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DimensionsStore } from '../../../src/DimensionsStore.js';
import { sequence } from '../helpers.js';

describe('DimensionsStore concurrent invocation isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    {
      description: 'without InvokeStore',
      useInvokeStore: false,
      expectedResult1: { env: 'dev' },
      expectedResult2: { env: 'dev' },
    },
    {
      description: 'with InvokeStore',
      useInvokeStore: true,
      expectedResult1: { env: 'prod' },
      expectedResult2: { env: 'dev' },
    },
  ])(
    'handles storing dimensions $description',
    async ({ useInvokeStore, expectedResult1, expectedResult2 }) => {
      // Prepare
      const store = new DimensionsStore();

      // Act
      const [result1, result2] = await sequence(
        {
          sideEffects: [() => store.addDimension('env', 'prod')],
          return: () => store.getDimensions(),
        },
        {
          sideEffects: [() => store.addDimension('env', 'dev')],
          return: () => store.getDimensions(),
        },
        { useInvokeStore }
      );

      // Assess
      expect(result1).toEqual(expectedResult1);
      expect(result2).toEqual(expectedResult2);
    }
  );

  it.each([
    {
      description: 'without InvokeStore',
      useInvokeStore: false,
      expectedResult1: [
        { service: 'api', version: '1.0' },
        { service: 'web', version: '2.0' },
      ],
      expectedResult2: [
        { service: 'api', version: '1.0' },
        { service: 'web', version: '2.0' },
      ],
    },
    {
      description: 'with InvokeStore',
      useInvokeStore: true,
      expectedResult1: [{ service: 'api', version: '1.0' }],
      expectedResult2: [{ service: 'web', version: '2.0' }],
    },
  ])(
    'handles storing dimension sets $description',
    async ({ useInvokeStore, expectedResult1, expectedResult2 }) => {
      // Prepare
      const store = new DimensionsStore();

      // Act
      const [result1, result2] = await sequence(
        {
          sideEffects: [
            () => store.addDimensionSet({ service: 'api', version: '1.0' }),
          ],
          return: () => store.getDimensionSets(),
        },
        {
          sideEffects: [
            () => store.addDimensionSet({ service: 'web', version: '2.0' }),
          ],
          return: () => store.getDimensionSets(),
        },
        { useInvokeStore }
      );

      // Assess
      expect(result1).toEqual(expectedResult1);
      expect(result2).toEqual(expectedResult2);
    }
  );

  it.each([
    {
      description: 'without InvokeStore',
      useInvokeStore: false,
      expectedResult1: { dims: {}, sets: [] },
      expectedResult2: { dims: {}, sets: [] },
    },
    {
      description: 'with InvokeStore',
      useInvokeStore: true,
      expectedResult1: { dims: {}, sets: [] },
      expectedResult2: {
        dims: { region: 'us-east-1' },
        sets: [{ version: '2.0' }],
      },
    },
  ])(
    'handles clearing the store $description',
    async ({ useInvokeStore, expectedResult1, expectedResult2 }) => {
      // Prepare
      const store = new DimensionsStore();

      // Act
      const [result1, result2] = await sequence(
        {
          sideEffects: [
            () => {
              store.addDimension('env', 'prod');
              store.addDimensionSet({ service: 'api' });
            },
            () => {}, // Wait for inv2 to add
            () => store.clearRequestDimensions(),
          ],
          return: () => ({
            dims: store.getDimensions(),
            sets: store.getDimensionSets(),
          }),
        },
        {
          sideEffects: [
            () => {}, // Wait for inv1 to add
            () => {
              store.addDimension('region', 'us-east-1');
              store.addDimensionSet({ version: '2.0' });
            },
            () => {}, // Wait for clear
          ],
          return: () => ({
            dims: store.getDimensions(),
            sets: store.getDimensionSets(),
          }),
        },
        { useInvokeStore }
      );

      // Assess
      expect(result1).toEqual(expectedResult1);
      expect(result2).toEqual(expectedResult2);
    }
  );
});
