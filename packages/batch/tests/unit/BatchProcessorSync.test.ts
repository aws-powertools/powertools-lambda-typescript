import context from '@aws-lambda-powertools/testing-utils/context';
import type { SQSRecord } from 'aws-lambda';
import { describe, expect, it } from 'vitest';
import {
  AsyncHandlerNotSupportedError,
  BatchProcessorSync,
  EventType,
  processPartialResponseSync,
  SqsFifoPartialProcessor,
} from '../../src/index.js';
import { sqsRecordFactory } from '../helpers/factories.js';

describe('Class: BatchProcessorSync', () => {
  const asyncRecordHandler = async (record: SQSRecord): Promise<string> =>
    record.body;

  const rejectingRecordHandler = async (
    _record: SQSRecord
  ): Promise<string> => {
    throw new Error('failed');
  };

  it('throws when the record handler returns a promise', () => {
    // Prepare
    const records = [sqsRecordFactory('success'), sqsRecordFactory('success')];
    const batch = { Records: records };
    const processor = new BatchProcessorSync(EventType.SQS);

    // Act & Assess
    expect(() =>
      processPartialResponseSync(batch, asyncRecordHandler, processor, {
        context,
      })
    ).toThrow(AsyncHandlerNotSupportedError);
    expect(processor.successMessages).toHaveLength(0);
  });

  it('leaves no unhandled rejection behind when the promise rejects', () => {
    // Prepare
    const records = [sqsRecordFactory('success'), sqsRecordFactory('success')];
    const batch = { Records: records };
    const processor = new BatchProcessorSync(EventType.SQS);

    // Act & Assess
    // The abandoned promise rejects after the throw, and vitest fails this file
    // if nothing has taken ownership of that rejection.
    expect(() =>
      processPartialResponseSync(batch, rejectingRecordHandler, processor, {
        context,
      })
    ).toThrow(AsyncHandlerNotSupportedError);
  });

  it('throws when a SqsFifoPartialProcessor record handler returns a promise', () => {
    // Prepare
    const records = [sqsRecordFactory('success'), sqsRecordFactory('success')];
    const batch = { Records: records };
    const processor = new SqsFifoPartialProcessor();

    // Act & Assess
    expect(() =>
      processPartialResponseSync(batch, asyncRecordHandler, processor, {
        context,
      })
    ).toThrow(AsyncHandlerNotSupportedError);
  });
});
