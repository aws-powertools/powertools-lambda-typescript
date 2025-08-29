import { describe, expect, it } from 'vitest';
import {
  APIGatewayProxyEventV2Schema,
  APIGatewayRequestAuthorizerEventV2Schema,
  APIGatewayRequestAuthorizerV2Schema,
  APIGatewayRequestContextV2Schema,
} from '../../../src/schemas/index.js';
import type { APIGatewayProxyEventV2 } from '../../../src/types/schema.js';
import { getTestEvent } from '../helpers/utils.js';

describe('Schema: API Gateway HTTP (v2)', () => {
  const eventsPath = 'apigw-http';

  describe('APIGatewayProxyEventV2Schema', () => {
    it('throws when the event is invalid', () => {
      // Prepare
      const event = getTestEvent({ eventsPath, filename: 'invalid' });

      // Act & Assess
      expect(() => APIGatewayProxyEventV2Schema.parse(event)).toThrow();
    });

    it('parses an event with no authorizer', () => {
      // Prepare
      const event = getTestEvent({ eventsPath, filename: 'no-auth' });

      // Act
      const parsedEvent = APIGatewayProxyEventV2Schema.parse(event);

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
      const parsedEvent = APIGatewayProxyEventV2Schema.parse(event);

      // Assess
      expect(parsedEvent).toEqual(event);
    });

    it('parses an event with IPv6 sourceIp', () => {
      // Prepare
      const event = getTestEvent<APIGatewayProxyEventV2>({
        eventsPath,
        filename: 'no-auth',
      });
      // Add IPv6 address to the event
      event.requestContext.http.sourceIp =
        '2001:0db8:85a3:0000:0000:8a2e:0370:7334';

      // Act
      const parsedEvent = APIGatewayProxyEventV2Schema.parse(event);

      // Assess
      expect(parsedEvent.requestContext.http.sourceIp).toEqual(
        '2001:0db8:85a3:0000:0000:8a2e:0370:7334'
      );
    });

    it('parses an event with shortened IPv6 sourceIp', () => {
      // Prepare
      const event = getTestEvent<APIGatewayProxyEventV2>({
        eventsPath,
        filename: 'no-auth',
      });
      // Add shortened IPv6 address to the event
      event.requestContext.http.sourceIp = '::1';

      // Act
      const parsedEvent = APIGatewayProxyEventV2Schema.parse(event);

      // Assess
      expect(parsedEvent.requestContext.http.sourceIp).toEqual('::1');
    });

    it('parses an event with a JWT authorizer', () => {
      // Prepare
      const event = getTestEvent({
        eventsPath,
        filename: 'jwt-authorizer-auth',
      });

      // Act
      const parsedEvent = APIGatewayProxyEventV2Schema.parse(event);

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
      const parsedEvent = APIGatewayProxyEventV2Schema.parse(event);

      // Assess
      expect(parsedEvent).toEqual(event);
    });
  });

  describe('APIGatewayRequestAuthorizerEventV2Schema', () => {
    it('throws when the event is invalid', () => {
      // Prepare
      const event = getTestEvent({ eventsPath, filename: 'invalid' });

      // Act & Assess
      expect(() =>
        APIGatewayRequestAuthorizerEventV2Schema.parse(event)
      ).toThrow();
    });

    it('parses the authorizer event', () => {
      // Prepare
      const event = getTestEvent({
        eventsPath,
        filename: 'authorizer-request',
      });

      // Act
      const parsedEvent = APIGatewayRequestAuthorizerEventV2Schema.parse(event);

      // Assess
      expect(parsedEvent).toEqual(event);
    });

    it('parses the authorizer event with null identitySource', () => {
      // Prepare
      const event = getTestEvent({
        eventsPath,
        filename: 'authorizer-request',
      });
      event.identitySource = null;

      // Act
      const parsedEvent = APIGatewayRequestAuthorizerEventV2Schema.parse(event);

      // Assess
      expect(parsedEvent).toEqual(event);
    });
  });

  describe('APIGatewayRequestContextV2Schema', () => {
    it('parses the request context', () => {
      // Prepare
      const payload = getTestEvent<APIGatewayProxyEventV2>({
        eventsPath,
        filename: 'iam-auth',
      }).requestContext;

      // Act
      const parsedPayload = APIGatewayRequestContextV2Schema.parse(payload);

      // Assess
      expect(parsedPayload).toEqual(payload);
    });
  });

  describe('APIGatewayRequestAuthorizerV2Schema', () => {
    it('parses the authorizer', () => {
      // Prepare
      const payload = getTestEvent<APIGatewayProxyEventV2>({
        eventsPath,
        filename: 'iam-auth',
      }).requestContext.authorizer;

      // Act
      const parsedPayload = APIGatewayRequestAuthorizerV2Schema.parse(payload);

      // Assess
      expect(parsedPayload).toEqual(payload);
    });
  });
});
