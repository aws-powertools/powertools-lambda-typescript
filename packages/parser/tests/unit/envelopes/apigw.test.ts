/**
 * Test built-in API Gateway REST envelope
 *
 * @group unit/parser/envelopes/apigw
 */

import { ZodError } from 'zod';
import { ApiGatewayEnvelope } from '../../../src/envelopes/index.js';
import { ParseError } from '../../../src/errors.js';
import type { APIGatewayProxyEvent } from '../../../src/types/schema.js';
import { TestSchema, getTestEvent } from '../schema/utils.js';

describe('API Gateway REST Envelope', () => {
  const eventsPath = 'apigw-rest';
  const eventPrototype = getTestEvent<APIGatewayProxyEvent>({
    eventsPath,
    filename: 'no-auth',
  });

  describe('Method: parse', () => {
    it('should throw if the payload does not match the schema', () => {
      // Prepare
      const event = { ...eventPrototype };
      event.body = JSON.stringify({ name: 'foo' });

      // Act & Assess
      expect(() => ApiGatewayEnvelope.parse(event, TestSchema)).toThrow(
        ParseError
      );
    });

    it('should throw if the body is null', () => {
      // Prepare
      const event = { ...eventPrototype };
      event.body = null;

      // Act & Assess
      expect(() => ApiGatewayEnvelope.parse(event, TestSchema)).toThrow(
        ParseError
      );
    });

    it('should parse and return the inner schema in an envelope', () => {
      // Prepare
      const event = { ...eventPrototype };
      const payload = { name: 'foo', age: 42 };
      event.body = JSON.stringify(payload);

      // Act
      const parsedEvent = ApiGatewayEnvelope.parse(event, TestSchema);

      // Assess
      expect(parsedEvent).toEqual(payload);
    });
  });

  describe('Method: safeParse', () => {
    it('should not throw if the payload does not match the schema', () => {
      // Prepare
      const event = { ...eventPrototype };
      event.body = JSON.stringify({ name: 'foo' });

      // Act
      const parseResult = ApiGatewayEnvelope.safeParse(event, TestSchema);

      // Assess
      expect(parseResult).toEqual({
        success: false,
        error: expect.any(ParseError),
        originalEvent: event,
      });

      if (!parseResult.success && parseResult.error) {
        expect(parseResult.error.cause).toBeInstanceOf(ZodError);
      }
    });

    it('should not throw if the body is null', () => {
      // Prepare
      const event = { ...eventPrototype };
      event.body = null;

      // Act
      const parseResult = ApiGatewayEnvelope.safeParse(event, TestSchema);

      // Assess
      expect(parseResult).toEqual({
        success: false,
        error: expect.any(ParseError),
        originalEvent: event,
      });

      if (!parseResult.success && parseResult.error) {
        expect(parseResult.error.cause).toBeInstanceOf(ZodError);
      }
    });

    it('should not throw if the event is invalid', () => {
      // Prepare
      const event = getTestEvent({ eventsPath, filename: 'invalid' });

      // Act
      const parseResult = ApiGatewayEnvelope.safeParse(event, TestSchema);

      // Assess
      expect(parseResult).toEqual({
        success: false,
        error: expect.any(ParseError),
        originalEvent: event,
      });
    });

    it('should parse and return the inner schema in an envelope', () => {
      // Prepare
      const event = { ...eventPrototype };
      const payload = { name: 'foo', age: 42 };
      event.body = JSON.stringify(payload);

      // Act
      const parsedEvent = ApiGatewayEnvelope.safeParse(event, TestSchema);

      // Assess
      expect(parsedEvent).toEqual({
        success: true,
        data: payload,
      });
    });
  });
});
