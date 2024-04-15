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
import { CloudWatchEnvelope } from '../../../src/envelopes/index.js';
import { ParseError } from '../../../src';

describe('CloudWatch', () => {
  describe('parse', () => {
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

      expect(CloudWatchEnvelope.parse(testEvent, TestSchema)).toEqual([data]);
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

      expect(() => CloudWatchEnvelope.parse(testEvent, TestSchema)).toThrow();
    });
  });

  describe('safeParse', () => {
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

      const actual = CloudWatchEnvelope.safeParse(testEvent, TestSchema);
      expect(actual).toEqual({
        success: true,
        data: [data],
      });
    });

    it('should return success false when schema does not match', () => {
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

      expect(CloudWatchEnvelope.safeParse(testEvent, TestSchema)).toEqual({
        success: false,
        error: expect.any(Error),
        originalEvent: testEvent,
      });
    });

    it('should return success false when envelope does not match', () => {
      expect(CloudWatchEnvelope.safeParse({ foo: 'bar' }, TestSchema)).toEqual({
        success: false,
        error: expect.any(ParseError),
        originalEvent: { foo: 'bar' },
      });
    });
  });
});
