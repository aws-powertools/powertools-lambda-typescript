/**
 * Test built in schema envelopes for CloudWatch
 *
 * @group unit/parser/envelopes
 */

import { generateMock } from '@anatine/zod-mock';
import { gzipSync } from 'node:zlib';
import {
  CloudWatchLogEventSchema,
  CloudWatchLogsDecodeSchema,
} from '../../../src/schemas/';
import { TestSchema } from '../schema/utils.js';
import { cloudWatchEnvelope } from '../../../src/envelopes/';

describe('CloudWatch', () => {
  it('should parse custom schema in envelope', () => {
    const testEvent = {
      awslogs: {
        data: '',
      },
    };

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

    expect(cloudWatchEnvelope(testEvent, TestSchema)).toEqual([data]);
  });

  it('should throw when schema does not match', () => {
    const testEvent = {
      awslogs: {
        data: '',
      },
    };

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

    expect(() => cloudWatchEnvelope(testEvent, TestSchema)).toThrow();
  });
});
