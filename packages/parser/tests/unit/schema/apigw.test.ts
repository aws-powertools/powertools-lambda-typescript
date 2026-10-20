import { describe, expect, it } from 'vitest';
import {
  APIGatewayProxyEventSchema,
  APIGatewayRequestAuthorizerEventSchema,
  APIGatewayTokenAuthorizerEventSchema,
} from '../../../src/schemas/index.js';
import type { APIGatewayProxyEvent } from '../../../src/types/schema.js';
import { getTestEvent } from '../helpers/utils.js';

describe('Schema: API Gateway REST', () => {
  const eventsPath = 'apigw-rest';

  describe('APIGatewayProxyEventSchema', () => {
    it('throws when the event is invalid', () => {
      // Prepare
      const event = getTestEvent({ eventsPath, filename: 'invalid' });

      // Act & Assess
      expect(() => APIGatewayProxyEventSchema.parse(event)).toThrow();
    });

    it('parses an event with no authorizer', () => {
      // Prepare
      const event = getTestEvent({ eventsPath, filename: 'no-auth' });

      // Act
      const parsedEvent = APIGatewayProxyEventSchema.parse(event);

      // Assess
      expect(parsedEvent).toEqual(event);
    });

    it('parses an event with a lambda authorizer', () => {
      // Prepare
      const event = getTestEvent({
        eventsPath,
        filename: 'lambda-authorizer-auth',
      });

      // Act
      const parsedEvent = APIGatewayProxyEventSchema.parse(event);

      // Assess
      expect(parsedEvent).toEqual(event);
    });

    it('parses an event with a JWT authorizer', () => {
      // Prepare
      const event = getTestEvent({
        eventsPath,
        filename: 'jwt-authorizer-auth',
      });

      // Act
      const parsedEvent = APIGatewayProxyEventSchema.parse(event);

      // Assess
      expect(parsedEvent).toEqual(event);
    });

    it('parses an event with an IAM authorizer', () => {
      // Prepare
      const event = getTestEvent({
        eventsPath,
        filename: 'iam-auth',
      });

      // Act
      const parsedEvent = APIGatewayProxyEventSchema.parse(event);

      // Assess
      expect(parsedEvent).toEqual(event);
    });

    it('parses an event sent by the AWS console test UI', () => {
      // Prepare
      const event = getTestEvent({
        eventsPath,
        filename: 'console-test-ui',
      });

      // Act
      const parsedEvent = APIGatewayProxyEventSchema.parse(event);

      // Assess
      expect(parsedEvent).toEqual(event);
    });

    it('parses an event sent as a part of a websocket API', () => {
      // Prepare
      const event = getTestEvent({
        eventsPath,
        filename: 'websocket',
      });

      // Act
      const parsedEvent = APIGatewayProxyEventSchema.parse(event);

      // Assess
      expect(parsedEvent).toEqual(event);
    });
    it('parses an event with IPv6 sourceIp', () => {
      // Prepare
      const event = getTestEvent<APIGatewayProxyEvent>({
        eventsPath,
        filename: 'no-auth',
      });
      // Add IPv6 address to the event
      event.requestContext.identity.sourceIp =
        '2001:0db8:85a3:0000:0000:8a2e:0370:7334';

      // Act
      const parsedEvent = APIGatewayProxyEventSchema.parse(event);

      // Assess
      expect(parsedEvent.requestContext.identity.sourceIp).toEqual(
        '2001:0db8:85a3:0000:0000:8a2e:0370:7334'
      );
    });

    it('parses an event with shortened IPv6 sourceIp', () => {
      // Prepare
      const event = getTestEvent<APIGatewayProxyEvent>({
        eventsPath,
        filename: 'no-auth',
      });
      // Add shortened IPv6 address to the event
      event.requestContext.identity.sourceIp = '::1';

      // Act
      const parsedEvent = APIGatewayProxyEventSchema.parse(event);

      // Assess
      expect(parsedEvent.requestContext.identity.sourceIp).toEqual('::1');
    });
  });

  describe('APIGatewayRequestAuthorizerEventSchema', () => {
    it('throws when the event is invalid', () => {
      // Prepare
      const event = getTestEvent({ eventsPath, filename: 'invalid' });

      // Act & Assess
      expect(() =>
        APIGatewayRequestAuthorizerEventSchema.parse(event)
      ).toThrow();
    });

    it('parses the authorizer event', () => {
      // Prepare
      const event = getTestEvent({
        eventsPath,
        filename: 'authorizer-request',
      });

      // Act
      const parsedEvent = APIGatewayRequestAuthorizerEventSchema.parse(event);

      // Assess
      expect(parsedEvent).toEqual(event);
    });
  });

  describe('APIGatewayTokenAuthorizerEventSchema', () => {
    it('throws when the event is invalid', () => {
      // Prepare
      const event = getTestEvent({ eventsPath, filename: 'invalid' });

      // Act & Assess
      expect(() => APIGatewayTokenAuthorizerEventSchema.parse(event)).toThrow();
    });

    it('parses the event', () => {
      // Prepare
      const event = getTestEvent({ eventsPath, filename: 'authorizer-token' });

      // Act
      const parsedEvent = APIGatewayTokenAuthorizerEventSchema.parse(event);

      // Assess
      expect(parsedEvent).toEqual(event);
    });
  });
});
