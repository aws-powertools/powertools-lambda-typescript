import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { ApiGatewayEnvelope } from '../../../src/envelopes/index.js';
import { ParseError } from '../../../src/errors.js';
import type { APIGatewayProxyEvent } from '../../../src/types/schema.js';
import { getTestEvent } from '../helpers/utils.js';

describe('Envelope: API Gateway REST', () => {
  const testSchema = z.object({
    name: z.string(),
    age: z.number(),
  });
  const mockBody = {
    name: 'John',
    age: 18,
  };
  const mockJSONStringifiedBody = JSON.stringify(mockBody);
  const eventsPath = 'apigw-rest';
  const baseEvent = getTestEvent<APIGatewayProxyEvent>({
    eventsPath,
    filename: 'no-auth',
  });

  describe('Method: parse', () => {
    it('throws if the payload does not match the schema', () => {
      // Prepare
      const event = structuredClone(baseEvent);
      event.body = JSON.stringify({ name: 'foo' });

      // Act & Assess
      expect(() => ApiGatewayEnvelope.parse(event, testSchema)).toThrow(
        ParseError
      );
    });

    it('throws if the body is null', () => {
      // Prepare
      const event = structuredClone(baseEvent);
      event.body = null;

      // Act & Assess
      expect(() => ApiGatewayEnvelope.parse(event, z.string())).toThrow(
        ParseError
      );
    });

    it('parses an API Gateway event', () => {
      // Prepare
      const event = structuredClone(baseEvent);
      event.body = mockJSONStringifiedBody;

      // Act
      const parsedEvent = ApiGatewayEnvelope.parse(event, testSchema);

      // Assess
      expect(parsedEvent).toEqual(mockBody);
    });
  });

  describe('Method: safeParse', () => {
    it('parses a SQS event', () => {
      // Prepare
      const event = structuredClone(baseEvent);
      event.body = mockJSONStringifiedBody;

      // Act
      const result = ApiGatewayEnvelope.safeParse(event, testSchema);

      // Assess
      expect(result).toEqual({
        success: true,
        data: mockBody,
      });
    });

    it('returns error if event is not a SQS event', () => {
      // Prepare
      const event = { foo: 'bar' };

      // Act
      const result = ApiGatewayEnvelope.safeParse(event, testSchema);

      // Assess
      expect(result).toEqual({
        success: false,
        error: expect.any(ParseError),
        originalEvent: event,
      });
    });

    it('returns error if body does not match schema', () => {
      // Prepare
      const event = structuredClone(baseEvent);
      event.body = JSON.stringify({ name: 'foo' });

      // Act
      const parseResult = ApiGatewayEnvelope.safeParse(event, testSchema);

      // Assess
      expect(parseResult).toEqual({
        success: false,
        error: expect.any(ParseError),
        originalEvent: event,
      });
    });
  });
});
