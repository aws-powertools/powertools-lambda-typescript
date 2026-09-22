import context from '@aws-lambda-powertools/testing-utils/context';
import { describe, expect, it, vi } from 'vitest';
import {
  AsyncHandlerNotSupportedError,
  BatchProcessorSync,
  EventType,
  processPartialResponseSync,
  SqsFifoPartialProcessor,
} from '../../src/index.js';
import { sqsRecordFactory } from '../helpers/factories.js';
import { asyncSqsRecordHandler } from '../helpers/handlers.js';

describe('Class: BatchProcessorSync', () => {
  it('throws when the record handler returns a promise', () => {
    // Prepare
    const records = [sqsRecordFactory('success'), sqsRecordFactory('success')];
    const batch = { Records: records };
    const processor = new BatchProcessorSync(EventType.SQS);

    // Act & Assess
    expect(() =>
      processPartialResponseSync(batch, asyncSqsRecordHandler, processor, {
        context,
      })
    ).toThrow(AsyncHandlerNotSupportedError);
    expect(processor.successMessages).toHaveLength(0);
  });

  it('logs the rejection reason instead of leaving an unhandled rejection when the promise rejects', async () => {
    // Prepare
    const records = [sqsRecordFactory('fail'), sqsRecordFactory('success')];
    const batch = { Records: records };
    const processor = new BatchProcessorSync(EventType.SQS);

    // Act
    // The abandoned promise rejects after the throw, and vitest fails this file
    // if nothing has taken ownership of that rejection.
    expect(() =>
      processPartialResponseSync(batch, asyncSqsRecordHandler, processor, {
        context,
      })
    ).toThrow(AsyncHandlerNotSupportedError);

    // Assess
    await vi.waitFor(() =>
      expect(console.error).toHaveBeenCalledWith(
        'The record handler returned a promise to a synchronous batch processor and the promise later rejected',
        new Error('Failed to process record.')
      )
    );
  });

  it('throws when a SqsFifoPartialProcessor record handler returns a promise', () => {
    // Prepare
    const records = [sqsRecordFactory('success'), sqsRecordFactory('success')];
    const batch = { Records: records };
    const processor = new SqsFifoPartialProcessor();

    // Act & Assess
    expect(() =>
      processPartialResponseSync(batch, asyncSqsRecordHandler, processor, {
        context,
      })
    ).toThrow(AsyncHandlerNotSupportedError);
  });
});
