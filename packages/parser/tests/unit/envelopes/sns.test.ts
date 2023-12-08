/**
 * Test built in schema envelopes for SNS
 *
 * @group unit/parser/envelopes
 */

import { z } from 'zod';
import { generateMock } from '@anatine/zod-mock';
import { SNSEvent, SQSEvent } from 'aws-lambda';
import { Envelopes } from '../../../src/envelopes/Envelopes.js';
import { TestEvents, TestSchema } from '../schema/utils.js';

describe('SNS Envelope', () => {
  it('should parse custom schema in envelope', () => {
    const testEvent = TestEvents.snsEvent as SNSEvent;
    const envelope = Envelopes.SNS_ENVELOPE;

    const testRecords = [] as z.infer<typeof TestSchema>[];

    testEvent.Records.map((record) => {
      const value = generateMock(TestSchema);
      testRecords.push(value);
      record.Sns.Message = JSON.stringify(value);
    });

    expect(envelope.parse(testEvent, TestSchema)).toEqual(testRecords);
  });

  it('should throw if message does not macht schema', () => {
    const testEvent = TestEvents.snsEvent as SNSEvent;
    const envelope = Envelopes.SNS_ENVELOPE;

    testEvent.Records.map((record) => {
      record.Sns.Message = JSON.stringify({
        foo: 'bar',
      });
    });

    expect(() => envelope.parse(testEvent, TestSchema)).toThrowError();
  });

  it('should parse sqs inside sns envelope', () => {
    const snsSqsTestEvent = TestEvents.snsSqsEvent as SQSEvent;

    const data = generateMock(TestSchema);
    const snsEvent = JSON.parse(snsSqsTestEvent.Records[0].body);
    snsEvent.Message = JSON.stringify(data);

    snsSqsTestEvent.Records[0].body = JSON.stringify(snsEvent);

    expect(
      Envelopes.SNS_SQS_ENVELOPE.parse(snsSqsTestEvent, TestSchema)
    ).toEqual([data]);
  });
});
