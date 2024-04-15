/**
 * Test built in schema envelopes for api gateway v2
 *
 * @group unit/parser/envelopes
 */

import { TestEvents, TestSchema } from '../schema/utils.js';
import { generateMock } from '@anatine/zod-mock';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { ApiGatewayV2Envelope } from '../../../src/envelopes/index.js';

describe('ApiGwV2Envelope ', () => {
  describe('parse', () => {
    it('should parse custom schema in envelope', () => {
      const testEvent =
        TestEvents.apiGatewayProxyV2Event as APIGatewayProxyEventV2;
      const data = generateMock(TestSchema);

      testEvent.body = JSON.stringify(data);

      expect(ApiGatewayV2Envelope.parse(testEvent, TestSchema)).toEqual(data);
    });

    it('should throw when no body provided', () => {
      const testEvent =
        TestEvents.apiGatewayProxyV2Event as APIGatewayProxyEventV2;
      testEvent.body = undefined;

      expect(() => ApiGatewayV2Envelope.parse(testEvent, TestSchema)).toThrow();
    });

    it('should throw when invalid body provided', () => {
      const testEvent =
        TestEvents.apiGatewayProxyV2Event as APIGatewayProxyEventV2;
      testEvent.body = 'invalid';

      expect(() => ApiGatewayV2Envelope.parse(testEvent, TestSchema)).toThrow();
    });
    it('should throw when invalid event provided', () => {
      expect(() =>
        ApiGatewayV2Envelope.parse({ foo: 'bar' }, TestSchema)
      ).toThrow();
    });
  });

  describe('safeParse', () => {
    it('should parse custom schema in envelope', () => {
      const testEvent =
        TestEvents.apiGatewayProxyV2Event as APIGatewayProxyEventV2;
      const data = generateMock(TestSchema);

      testEvent.body = JSON.stringify(data);

      expect(ApiGatewayV2Envelope.safeParse(testEvent, TestSchema)).toEqual({
        success: true,
        data,
      });
    });

    it('should return success false with original body if no body provided', () => {
      const testEvent =
        TestEvents.apiGatewayProxyV2Event as APIGatewayProxyEventV2;
      testEvent.body = undefined;

      expect(ApiGatewayV2Envelope.safeParse(testEvent, TestSchema)).toEqual({
        success: false,
        error: expect.any(Error),
        originalEvent: testEvent,
      });
    });

    it('should return success false with original body if invalid body provided', () => {
      const testEvent =
        TestEvents.apiGatewayProxyV2Event as APIGatewayProxyEventV2;
      testEvent.body = 'invalid';

      expect(ApiGatewayV2Envelope.safeParse(testEvent, TestSchema)).toEqual({
        success: false,
        error: expect.any(Error),
        originalEvent: testEvent,
      });
    });

    it('should return success false with original event if invalid event provided', () => {
      expect(
        ApiGatewayV2Envelope.safeParse({ foo: 'bar' }, TestSchema)
      ).toEqual({
        success: false,
        error: expect.any(Error),
        originalEvent: { foo: 'bar' },
      });
    });
  });
});
