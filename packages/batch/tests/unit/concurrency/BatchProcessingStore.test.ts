import { sequence } from '@aws-lambda-powertools/testing-utils';
import type { SQSRecord } from 'aws-lambda';
import { beforeEach, describe, expect, it } from 'vitest';
import { BatchProcessingStore } from '../../../src/BatchProcessingStore.js';
import { sqsRecordFactory } from '../../helpers/factories.js';

describe('BatchProcessingStore concurrent invocation isolation', () => {
  beforeEach(() => {
    // No mocks needed
  });

  it.each([
    {
      description: 'without InvokeStore',
      useInvokeStore: false,
    },
    {
      description: 'with InvokeStore',
      useInvokeStore: true,
    },
  ])(
    'returns empty defaults when not initialized $description',
    async ({ useInvokeStore }) => {
      // Prepare
      const store = new BatchProcessingStore();

      // Act
      const [resultA, resultB] = await sequence(
        {
          sideEffects: [() => {}, () => {}],
          return: () => ({
            records: store.getRecords(),
            errors: store.getErrors(),
            failureMessages: store.getFailureMessages(),
            successMessages: store.getSuccessMessages(),
            batchResponse: store.getBatchResponse(),
            handler: store.getHandler(),
          }),
        },
        {
          sideEffects: [() => {}, () => {}],
          return: () => ({
            records: store.getRecords(),
            errors: store.getErrors(),
            failureMessages: store.getFailureMessages(),
            successMessages: store.getSuccessMessages(),
            batchResponse: store.getBatchResponse(),
            handler: store.getHandler(),
          }),
        },
        { useInvokeStore }
      );

      // Assess
      expect(resultA.records).toEqual([]);
      expect(resultA.errors).toEqual([]);
      expect(resultA.failureMessages).toEqual([]);
      expect(resultA.successMessages).toEqual([]);
      expect(resultA.batchResponse).toEqual({ batchItemFailures: [] });
      expect(resultA.handler()).toBeUndefined();
      expect(resultB.records).toEqual([]);
      expect(resultB.errors).toEqual([]);
      expect(resultB.failureMessages).toEqual([]);
      expect(resultB.successMessages).toEqual([]);
      expect(resultB.batchResponse).toEqual({ batchItemFailures: [] });
      expect(resultB.handler()).toBeUndefined();
    }
  );

  it.each([
    {
      description: 'without InvokeStore',
      useInvokeStore: false,
      expectedResultA: ['record-B'],
      expectedResultB: ['record-B'],
    },
    {
      description: 'with InvokeStore',
      useInvokeStore: true,
      expectedResultA: ['record-A'],
      expectedResultB: ['record-B'],
    },
  ])(
    'isolates records per invocation $description',
    async ({ useInvokeStore, expectedResultA, expectedResultB }) => {
      // Prepare
      const store = new BatchProcessingStore();
      const recordsA = [sqsRecordFactory('record-A')];
      const recordsB = [sqsRecordFactory('record-B')];

      // Act
      const [resultA, resultB] = await sequence(
        {
          sideEffects: [
            () => {
              store.setRecords(recordsA);
            },
            () => {},
          ],
          return: () => store.getRecords().map((r) => (r as SQSRecord).body),
        },
        {
          sideEffects: [
            () => {},
            () => {
              store.setRecords(recordsB);
            },
          ],
          return: () => store.getRecords().map((r) => (r as SQSRecord).body),
        },
        { useInvokeStore }
      );

      // Assess
      expect(resultA).toEqual(expectedResultA);
      expect(resultB).toEqual(expectedResultB);
    }
  );

  it.each([
    {
      description: 'without InvokeStore',
      useInvokeStore: false,
      expectedResultA: ['fail-B'],
      expectedResultB: ['fail-B'],
    },
    {
      description: 'with InvokeStore',
      useInvokeStore: true,
      expectedResultA: ['fail-A'],
      expectedResultB: ['fail-B'],
    },
  ])(
    'isolates failure messages per invocation $description',
    async ({ useInvokeStore, expectedResultA, expectedResultB }) => {
      // Prepare
      const store = new BatchProcessingStore();
      const recordA = sqsRecordFactory('fail-A');
      const recordB = sqsRecordFactory('fail-B');

      // Act
      const [resultA, resultB] = await sequence(
        {
          sideEffects: [
            () => {
              store.setFailureMessages([recordA]);
            },
            () => {},
          ],
          return: () =>
            store.getFailureMessages().map((r) => (r as SQSRecord).body),
        },
        {
          sideEffects: [
            () => {},
            () => {
              store.setFailureMessages([recordB]);
            },
          ],
          return: () =>
            store.getFailureMessages().map((r) => (r as SQSRecord).body),
        },
        { useInvokeStore }
      );

      // Assess
      expect(resultA).toEqual(expectedResultA);
      expect(resultB).toEqual(expectedResultB);
    }
  );

  it.each([
    {
      description: 'without InvokeStore',
      useInvokeStore: false,
      expectedResultA: ['error-B'],
      expectedResultB: ['error-B'],
    },
    {
      description: 'with InvokeStore',
      useInvokeStore: true,
      expectedResultA: ['error-A'],
      expectedResultB: ['error-B'],
    },
  ])(
    'isolates errors per invocation $description',
    async ({ useInvokeStore, expectedResultA, expectedResultB }) => {
      // Prepare
      const store = new BatchProcessingStore();
      const errorA = new Error('error-A');
      const errorB = new Error('error-B');

      // Act
      const [resultA, resultB] = await sequence(
        {
          sideEffects: [
            () => {
              store.setErrors([errorA]);
            },
            () => {},
          ],
          return: () => store.getErrors().map((e) => e.message),
        },
        {
          sideEffects: [
            () => {},
            () => {
              store.setErrors([errorB]);
            },
          ],
          return: () => store.getErrors().map((e) => e.message),
        },
        { useInvokeStore }
      );

      // Assess
      expect(resultA).toEqual(expectedResultA);
      expect(resultB).toEqual(expectedResultB);
    }
  );
});
