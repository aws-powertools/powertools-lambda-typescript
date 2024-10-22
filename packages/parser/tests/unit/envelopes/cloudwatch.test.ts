import { gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { CloudWatchEnvelope } from '../../../src/envelopes';
import { ParseError } from '../../../src/errors.js';
import {
  CloudWatchLogEventSchema,
  CloudWatchLogsDecodeSchema,
} from '../../../src/schemas/';
import type { CloudWatchLogsEvent } from '../../../src/types/index.js';
import { getTestEvent } from '../helpers/utils.js';

describe('Envelope: CloudWatchEnvelope', () => {
  const baseEvent = getTestEvent<CloudWatchLogsEvent>({
    eventsPath: 'cloudwatch',
    filename: 'base',
  });
  const expectedData = [
    {
      id: 'eventId1',
      message: '[ERROR] First test message',
      timestamp: 1440442987000,
    },
    {
      id: 'eventId2',
      message: '[ERROR] Second test message',
      timestamp: 1440442987001,
    },
  ];

  describe('Method: parse', () => {
    it.fails('parses a CloudWatch logs event', () => {
      // Prepare
      const event = structuredClone(baseEvent);

      // Act
      const parsedEvent = CloudWatchEnvelope.parse(
        event,
        // z.record(z.unknown())
        z.string()
      );

      // Assess
      expect(parsedEvent).toEqual([
        expectedData[0].message,
        expectedData[1].message,
      ]);
    });

    it('');
    /* 

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
    }); */
  });

  /* describe('safeParse', () => {
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
  }); */
});
