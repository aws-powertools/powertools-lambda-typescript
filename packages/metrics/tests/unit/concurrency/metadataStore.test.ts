import { sequence } from '@aws-lambda-powertools/testing-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MetadataStore } from '../../../src/MetadataStore.js';

describe('MetadataStore concurrent invocation isolation', () => {
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
    'handles storing metadata $description',
    async ({ useInvokeStore, expectedResult1, expectedResult2 }) => {
      // Prepare
      const store = new MetadataStore();

      // Act
      const [result1, result2] = await sequence(
        {
          sideEffects: [() => store.set('env', 'prod')],
          return: () => store.getAll(),
        },
        {
          sideEffects: [() => store.set('env', 'dev')],
          return: () => store.getAll(),
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
      expectedResult1: { service: 'web', version: '1.0', region: 'us-east-1' },
      expectedResult2: { service: 'web', version: '1.0', region: 'us-east-1' },
    },
    {
      description: 'with InvokeStore',
      useInvokeStore: true,
      expectedResult1: { service: 'api', version: '1.0' },
      expectedResult2: { service: 'web', region: 'us-east-1' },
    },
  ])(
    'handles storing multiple metadata keys $description',
    async ({ useInvokeStore, expectedResult1, expectedResult2 }) => {
      // Prepare
      const store = new MetadataStore();

      // Act
      const [result1, result2] = await sequence(
        {
          sideEffects: [
            () => {
              store.set('service', 'api');
              store.set('version', '1.0');
            },
          ],
          return: () => store.getAll(),
        },
        {
          sideEffects: [
            () => {
              store.set('service', 'web');
              store.set('region', 'us-east-1');
            },
          ],
          return: () => store.getAll(),
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
      expectedResult1: {},
      expectedResult2: {},
    },
    {
      description: 'with InvokeStore',
      useInvokeStore: true,
      expectedResult1: {},
      expectedResult2: { region: 'us-east-1', env: 'prod' },
    },
  ])(
    'handles clearing the store $description',
    async ({ useInvokeStore, expectedResult1, expectedResult2 }) => {
      // Prepare
      const store = new MetadataStore();

      // Act
      const [result1, result2] = await sequence(
        {
          sideEffects: [
            () => {
              store.set('service', 'api');
              store.set('version', '1.0');
            },
            () => {}, // Wait for inv2 to add
            () => store.clear(),
          ],
          return: () => store.getAll(),
        },
        {
          sideEffects: [
            () => {}, // Wait for inv1 to add
            () => {
              store.set('region', 'us-east-1');
              store.set('env', 'prod');
            },
            () => {}, // Wait for clear
          ],
          return: () => store.getAll(),
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
      expectedResult1: { key: 'value3' },
      expectedResult2: { key: 'value3' },
    },
    {
      description: 'with InvokeStore',
      useInvokeStore: true,
      expectedResult1: { key: 'value3' },
      expectedResult2: { key: 'value2' },
    },
  ])(
    'handles overwriting same key $description',
    async ({ useInvokeStore, expectedResult1, expectedResult2 }) => {
      // Prepare
      const store = new MetadataStore();

      // Act
      const [result1, result2] = await sequence(
        {
          sideEffects: [
            () => store.set('key', 'value1'),
            () => {}, // Wait for inv2
            () => store.set('key', 'value3'),
          ],
          return: () => store.getAll(),
        },
        {
          sideEffects: [
            () => {}, // Wait for inv1
            () => store.set('key', 'value2'),
            () => {}, // Wait for inv1's final write
          ],
          return: () => store.getAll(),
        },
        { useInvokeStore }
      );

      // Assess
      expect(result1).toEqual(expectedResult1);
      expect(result2).toEqual(expectedResult2);
    }
  );
});
