import { describe, expect, it } from 'vitest';
import { SqsRecordSchema, SqsSchema } from '../../../src/schemas/';
import type { SqsEvent } from '../../../src/types';
import type { SqsRecord } from '../../../src/types/schema';
import { TestEvents } from './utils.js';

describe('SQS', () => {
  it('should parse sqs event', () => {
    const sqsEvent = TestEvents.sqsEvent;
    expect(SqsSchema.parse(sqsEvent)).toEqual(sqsEvent);
  });
  it('should parse record from sqs event', () => {
    const sqsEvent: SqsEvent = TestEvents.sqsEvent as SqsEvent;
    const parsed: SqsRecord = SqsRecordSchema.parse(sqsEvent.Records[0]);
    expect(parsed.body).toEqual('Test message.');
  });
});
