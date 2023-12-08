/**
 * Test built in schema envelopes for sqs
 *
 * @group unit/parser/envelopes
 */

import { generateMock } from '@anatine/zod-mock';
import { Envelopes } from '../../../src/envelopes/Envelopes.js';
import { TestEvents, TestSchema } from '../schema/utils.js';
import { SQSEvent } from 'aws-lambda';

describe('SqsEnvelope ', () => {
  const envelope = Envelopes.SQS_ENVELOPE;

  it('should parse custom schema in envelope', () => {
    const mock = generateMock(TestSchema);

    const sqsEvent = TestEvents.sqsEvent as SQSEvent;
    sqsEvent.Records[0].body = JSON.stringify(mock);
    sqsEvent.Records[1].body = JSON.stringify(mock);

    const resp = envelope.parse(sqsEvent, TestSchema);
    expect(resp).toEqual([mock, mock]);
  });

  it('should throw error if invalid keys for a schema', () => {
    expect(() => {
      envelope.parse({ Records: [{ foo: 'bar' }] }, TestSchema);
    }).toThrow();
  });

  it('should throw error if invalid values for a schema', () => {
    expect(() => {
      envelope.parse(
        {
          Records: [
            {
              name: 'foo',
              age: 17,
            },
          ],
        },
        TestSchema
      );
    }).toThrow();
  });
});
