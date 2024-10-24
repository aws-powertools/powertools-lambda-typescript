/**
 * Test built in schema envelopes for CloudWatch
 *
 * @group unit/parser/envelopes
 */

import { gzipSync } from 'node:zlib';
import { generateMock } from '@anatine/zod-mock';
import { ZodError } from 'zod';
import { ParseError } from '../../../src';
import { CloudWatchEnvelope } from '../../../src/envelopes/index.js';
import {
  CloudWatchLogEventSchema,
  CloudWatchLogsDecodeSchema,
} from '../../../src/schemas/';
import { TestSchema } from '../schema/utils.js';

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

      const parseResult = CloudWatchEnvelope.safeParse(testEvent, TestSchema);
      expect(parseResult).toEqual({
        success: false,
        error: expect.any(ParseError),
        originalEvent: testEvent,
      });

      if (!parseResult.success && parseResult.error) {
        expect(parseResult.error.cause).toBeInstanceOf(ZodError);
      }
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
