/**
 * Test built-in API Gateway HTTP API (v2) envelope
 *
 * @group unit/parser/envelopes/apigwv2
 */

import { ApiGatewayV2Envelope } from '../../../src/envelopes/index.js';
import { ParseError } from '../../../src/errors.js';
import type { APIGatewayProxyEventV2 } from '../../../src/types/schema.js';
import { TestSchema, getTestEvent } from '../schema/utils.js';

describe('API Gateway HTTP Envelope', () => {
  const eventsPath = 'apigw-http';
  const eventPrototype = getTestEvent<APIGatewayProxyEventV2>({
    eventsPath,
    filename: 'no-auth',
  });

  describe('Method: parse', () => {
    it('should throw if the payload does not match the schema', () => {
      // Prepare
      const event = { ...eventPrototype };
      event.body = JSON.stringify({ name: 'foo' });

      // Act & Assess
      expect(() => ApiGatewayV2Envelope.parse(event, TestSchema)).toThrow(
        ParseError
      );
    });

    it('should throw if the body is undefined', () => {
      // Prepare
      const event = { ...eventPrototype };
      event.body = undefined;

      // Act & Assess
      expect(() => ApiGatewayV2Envelope.parse(event, TestSchema)).toThrow(
        ParseError
      );
    });

    it('should parse and return the inner schema in an envelope', () => {
      // Prepare
      const event = { ...eventPrototype };
      const payload = { name: 'foo', age: 42 };
      event.body = JSON.stringify(payload);

      // Act
      const parsedEvent = ApiGatewayV2Envelope.parse(event, TestSchema);

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
      const parseResult = ApiGatewayV2Envelope.safeParse(event, TestSchema);

      // Assess
      expect(parseResult).toEqual({
        success: false,
        error: expect.any(ParseError),
        originalEvent: event,
      });
    });

    it('should not throw if the body is undefined', () => {
      // Prepare
      const event = { ...eventPrototype };
      event.body = undefined;

      // Act
      const parseResult = ApiGatewayV2Envelope.safeParse(event, TestSchema);

      // Assess
      expect(parseResult).toEqual({
        success: false,
        error: expect.any(ParseError),
        originalEvent: event,
      });
    });

    it('should not throw if the event is invalid', () => {
      // Prepare
      const event = getTestEvent({ eventsPath, filename: 'invalid' });

      // Act
      const parseResult = ApiGatewayV2Envelope.safeParse(event, TestSchema);

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
      const parsedEvent = ApiGatewayV2Envelope.safeParse(event, TestSchema);

      // Assess
      expect(parsedEvent).toEqual({
        success: true,
        data: payload,
      });
    });
  });
});
