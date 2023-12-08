/**
 * Test built in schema envelopes for CloudWatch
 *
 * @group unit/parser/envelopes
 */

import { Envelopes } from '../../../src/envelopes/Envelopes.js';
import { generateMock } from '@anatine/zod-mock';
import { gzipSync } from 'node:zlib';
import {
  CloudWatchLogEventSchema,
  CloudWatchLogsDecodeSchema,
} from '../../../src/schemas/cloudwatch.js';
import { TestSchema } from '../schema/utils.js';

describe('CloudWatch', () => {
  it('should parse custom schema in envelope', () => {
    const testEvent = {
      awslogs: {
        data: '',
      },
    };
    const envelope = Envelopes.CLOUDWATCH_ENVELOPE;

    const data = generateMock(TestSchema);
    const eventMock = generateMock(CloudWatchLogEventSchema, {
      stringMap: {
        message: () => JSON.stringify(data),
      },
    });

    const logMock = generateMock(CloudWatchLogsDecodeSchema);
    logMock.logEvents = [eventMock];

    testEvent.awslogs.data = gzipSync(
      Buffer.from(JSON.stringify(logMock), 'utf8')
    ).toString('base64');

    expect(envelope.parse(testEvent, TestSchema)).toEqual([data]);
  });

  it('should throw when schema does not match', () => {
    const testEvent = {
      awslogs: {
        data: '',
      },
    };
    const envelope = Envelopes.CLOUDWATCH_ENVELOPE;

    const eventMock = generateMock(CloudWatchLogEventSchema, {
      stringMap: {
        message: () => JSON.stringify({ foo: 'bar' }),
      },
    });

    const logMock = generateMock(CloudWatchLogsDecodeSchema);
    logMock.logEvents = [eventMock];

    testEvent.awslogs.data = gzipSync(
      Buffer.from(JSON.stringify(logMock), 'utf8')
    ).toString('base64');

    expect(() => envelope.parse(testEvent, TestSchema)).toThrow();
  });
});
