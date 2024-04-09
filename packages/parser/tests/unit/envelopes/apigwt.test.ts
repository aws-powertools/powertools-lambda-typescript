/**
 * Test built in schema envelopes for api gateway
 *
 * @group unit/parser/envelopes
 */

import { generateMock } from '@anatine/zod-mock';
import { TestEvents, TestSchema } from '../schema/utils.js';
import { APIGatewayProxyEvent } from '../../../src/types/';
import { ApiGatewayEnvelope } from '../../../src/envelopes/index.js';
import { ParseError } from '../../../src/errors.js';

describe('ApigwEnvelope ', () => {
  describe('parse', () => {
    it('should parse custom schema in envelope', () => {
      const testCustomSchemaObject = generateMock(TestSchema);
      const testEvent = TestEvents.apiGatewayProxyEvent as APIGatewayProxyEvent;

      testEvent.body = JSON.stringify(testCustomSchemaObject);

      const resp = ApiGatewayEnvelope.parse(testEvent, TestSchema);
      expect(resp).toEqual(testCustomSchemaObject);
    });

    it('should throw no body provided', () => {
      const testEvent = TestEvents.apiGatewayProxyEvent as APIGatewayProxyEvent;
      testEvent.body = undefined;

      expect(() => ApiGatewayEnvelope.parse(testEvent, TestSchema)).toThrow(
        ParseError
      );
    });
    it('should throw invalid event provided', () => {
      const testEvent = TestEvents.apiGatewayProxyEvent as APIGatewayProxyEvent;
      testEvent.body = 'invalid';

      expect(() => ApiGatewayEnvelope.parse(testEvent, TestSchema)).toThrow(
        ParseError
      );
    });
  });

  describe('safeParse', () => {
    it('should parse custom schema in envelope', () => {
      const testCustomSchemaObject = generateMock(TestSchema);
      const testEvent = TestEvents.apiGatewayProxyEvent as APIGatewayProxyEvent;

      testEvent.body = JSON.stringify(testCustomSchemaObject);

      const resp = ApiGatewayEnvelope.safeParse(testEvent, TestSchema);
      expect(resp).toEqual({
        success: true,
        data: testCustomSchemaObject,
      });
    });

    it('should return success false with original body if no body provided', () => {
      const testEvent = TestEvents.apiGatewayProxyEvent as APIGatewayProxyEvent;
      testEvent.body = undefined;

      const resp = ApiGatewayEnvelope.safeParse(testEvent, TestSchema);
      expect(resp).toEqual({
        success: false,
        error: expect.any(Error),
        originalEvent: testEvent,
      });
    });

    it('should return success false with original body if invalid body provided', () => {
      const testEvent = TestEvents.apiGatewayProxyEvent as APIGatewayProxyEvent;
      testEvent.body = 'invalid';

      const resp = ApiGatewayEnvelope.safeParse(testEvent, TestSchema);
      expect(resp).toEqual({
        success: false,
        error: expect.any(ParseError),
        originalEvent: testEvent,
      });
    });
    it('should return success false if event is invalid', () => {
      const resp = ApiGatewayEnvelope.safeParse(
        'invalid' as unknown,
        TestSchema
      );
      expect(resp).toEqual({
        success: false,
        error: expect.any(ParseError),
        originalEvent: 'invalid',
      });
    });
  });
});
