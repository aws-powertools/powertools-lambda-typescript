/**
 * Test built in schema envelopes for Kinesis
 *
 * @group unit/parser/envelopes
 */

import { generateMock } from '@anatine/zod-mock';
import { KinesisStreamEvent } from 'aws-lambda';
import { Envelopes } from '../../../src/envelopes/Envelopes.js';
import { TestEvents, TestSchema } from '../schema/utils.js';

describe('Kinesis', () => {
  const envelope = Envelopes.KINESIS_ENVELOPE;
  it('should parse Kinesis Stream event', () => {
    const mock = generateMock(TestSchema);
    const testEvent = TestEvents.kinesisStreamEvent as KinesisStreamEvent;

    testEvent.Records.map((record) => {
      record.kinesis.data = Buffer.from(JSON.stringify(mock)).toString(
        'base64'
      );
    });

    const resp = envelope.parse(testEvent, TestSchema);
    expect(resp).toEqual([mock, mock]);
  });
});
