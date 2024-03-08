/**
 * Test built in schema envelopes for Kinesis Firehose
 *
 * @group unit/parser/envelopes
 */

import { TestEvents, TestSchema } from '../schema/utils.js';
import { generateMock } from '@anatine/zod-mock';
import { KinesisFirehoseSchema } from '../../../src/schemas/';
import { z } from 'zod';
import { kinesisFirehoseEnvelope } from '../../../src/envelopes/';

describe('Kinesis Firehose Envelope', () => {
  it('should parse records for PutEvent', () => {
    const mock = generateMock(TestSchema);
    const testEvent = TestEvents.kinesisFirehosePutEvent as z.infer<
      typeof KinesisFirehoseSchema
    >;

    testEvent.records.map((record) => {
      record.data = Buffer.from(JSON.stringify(mock)).toString('base64');
    });

    const resp = kinesisFirehoseEnvelope(testEvent, TestSchema);
    expect(resp).toEqual([mock, mock]);
  });

  it('should parse a single record for SQS event', () => {
    const mock = generateMock(TestSchema);
    const testEvent = TestEvents.kinesisFirehoseSQSEvent as z.infer<
      typeof KinesisFirehoseSchema
    >;

    testEvent.records.map((record) => {
      record.data = Buffer.from(JSON.stringify(mock)).toString('base64');
    });

    const resp = kinesisFirehoseEnvelope(testEvent, TestSchema);
    expect(resp).toEqual([mock]);
  });

  it('should parse records for kinesis event', () => {
    const mock = generateMock(TestSchema);
    const testEvent = TestEvents.kinesisFirehoseKinesisEvent as z.infer<
      typeof KinesisFirehoseSchema
    >;

    testEvent.records.map((record) => {
      record.data = Buffer.from(JSON.stringify(mock)).toString('base64');
    });

    const resp = kinesisFirehoseEnvelope(testEvent, TestSchema);
    expect(resp).toEqual([mock, mock]);
  });
});
