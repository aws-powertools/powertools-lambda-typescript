import context from '@aws-lambda-powertools/testing-utils/context';
import type { SQSRecord } from 'aws-lambda';
import { describe, expect, it } from 'vitest';
import {
  BatchProcessingError,
  BatchProcessorSync,
  EventType,
  processPartialResponseSync,
  SqsFifoPartialProcessor,
} from '../../src/index.js';
import { sqsRecordFactory } from '../helpers/factories.js';

describe('Class: BatchProcessorSync', () => {
  const asyncRecordHandler = async (record: SQSRecord): Promise<string> =>
    record.body;

  it('throws when the record handler returns a Promise', () => {
    // Prepare
    const records = [sqsRecordFactory('success'), sqsRecordFactory('success')];
    const batch = { Records: records };
    const processor = new BatchProcessorSync(EventType.SQS);

    // Act & Assess
    expect(() =>
      processPartialResponseSync(batch, asyncRecordHandler, processor, {
        context,
      })
    ).toThrow(BatchProcessingError);
  });

  it('does not report records as processed when the handler returns a Promise', () => {
    // Prepare
    const records = [sqsRecordFactory('success'), sqsRecordFactory('success')];
    const batch = { Records: records };
    const processor = new BatchProcessorSync(EventType.SQS);

    // Act
    try {
      processPartialResponseSync(batch, asyncRecordHandler, processor, {
        context,
      });
    } catch {
      // the throw itself is asserted in the test above
    }

    // Assess
    expect(processor.successMessages).toHaveLength(0);
  });

  it('throws when a SqsFifoPartialProcessor record handler returns a Promise', () => {
    // Prepare
    const records = [sqsRecordFactory('success'), sqsRecordFactory('success')];
    const batch = { Records: records };
    const processor = new SqsFifoPartialProcessor();

    // Act & Assess
    expect(() =>
      processPartialResponseSync(batch, asyncRecordHandler, processor, {
        context,
      })
    ).toThrow(BatchProcessingError);
  });
});
