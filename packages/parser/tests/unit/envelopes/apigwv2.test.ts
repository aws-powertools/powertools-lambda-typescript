import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { ApiGatewayV2Envelope } from '../../../src/envelopes/index.js';
import { ParseError } from '../../../src/errors.js';
import type { APIGatewayProxyEventV2 } from '../../../src/types/schema.js';
import { getTestEvent } from '../helpers/utils.js';

describe('Envelope: API Gateway HTTP (v2)', () => {
  const testSchema = z.object({
    name: z.string(),
    age: z.number(),
  });
  const mockBody = {
    name: 'John',
    age: 18,
  };
  const mockJSONStringifiedBody = JSON.stringify(mockBody);
  const eventsPath = 'apigw-http';
  const baseEvent = getTestEvent<APIGatewayProxyEventV2>({
    eventsPath,
    filename: 'no-auth',
  });

  describe('Method: parse', () => {
    it('throws if the payload does not match the schema', () => {
      // Prepare
      const event = structuredClone(baseEvent);
      event.body = JSON.stringify({ name: 'foo' });

      // Act & Assess
      expect(() => ApiGatewayV2Envelope.parse(event, testSchema)).toThrow(
        ParseError
      );
    });

    it('should throw if the body is undefined', () => {
      // Prepare
      const event = structuredClone(baseEvent);
      event.body = undefined;

      // Act & Assess
      expect(() => ApiGatewayV2Envelope.parse(event, testSchema)).toThrow(
        ParseError
      );
    });

    it('should parse and return the inner schema in an envelope', () => {
      // Prepare
      const event = structuredClone(baseEvent);
      event.body = mockJSONStringifiedBody;

      // Act
      const parsedEvent = ApiGatewayV2Envelope.parse(event, testSchema);

      // Assess
      expect(parsedEvent).toEqual(mockBody);
    });
  });

  describe('Method: safeParse', () => {
    it('should not throw if the payload does not match the schema', () => {
      // Prepare
      const event = structuredClone(baseEvent);
      event.body = JSON.stringify({ name: 'foo' });

      // Act
      const parseResult = ApiGatewayV2Envelope.safeParse(event, testSchema);

      // Assess
      expect(parseResult).toEqual({
        success: false,
        error: expect.any(ParseError),
        originalEvent: event,
      });
    });

    it('should not throw if the event is invalid', () => {
      // Prepare
      const event = { foo: 'bar' };

      // Act
      const parseResult = ApiGatewayV2Envelope.safeParse(event, testSchema);

      // Assess
      expect(parseResult).toEqual({
        success: false,
        error: expect.any(ParseError),
        originalEvent: event,
      });
    });

    it('should parse and return the inner schema in an envelope', () => {
      // Prepare
      const event = structuredClone(baseEvent);
      event.body = mockJSONStringifiedBody;

      // Act
      const parsedEvent = ApiGatewayV2Envelope.safeParse(event, testSchema);

      // Assess
      expect(parsedEvent).toEqual({
        success: true,
        data: mockBody,
      });
    });
  });
});
