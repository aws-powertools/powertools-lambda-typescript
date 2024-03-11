/**
 * Test built in schema envelopes for Kinesis
 *
 * @group unit/parser/envelopes
 */

import { generateMock } from '@anatine/zod-mock';
import { KinesisStreamEvent } from 'aws-lambda';
import { TestEvents, TestSchema } from '../schema/utils.js';
import { kinesisEnvelope } from '../../../src/envelopes/';

describe('Kinesis', () => {
  it('should parse Kinesis Stream event', () => {
    const mock = generateMock(TestSchema);
    const testEvent = TestEvents.kinesisStreamEvent as KinesisStreamEvent;

    testEvent.Records.map((record) => {
      record.kinesis.data = Buffer.from(JSON.stringify(mock)).toString(
        'base64'
      );
    });

    const resp = kinesisEnvelope(testEvent, TestSchema);
    expect(resp).toEqual([mock, mock]);
  });
});
