/**
 * Test built-in API Gateway HTTP API (v2) schemas
 *
 * @group unit/parser/schema/apigwv2
 */
import {
  APIGatewayProxyEventV2Schema,
  APIGatewayRequestAuthorizerEventV2Schema,
} from '../../../src/schemas/index.js';
import { getTestEvent, makeSchemaStrictForTesting } from './utils.js';

describe('API Gateway HTTP (v2) Schemas', () => {
  const eventsPath = 'apigw-http';

  describe('APIGatewayProxyEventV2Schema', () => {
    it('should throw when the event is invalid', () => {
      // Prepare
      const event = getTestEvent({ eventsPath, filename: 'invalid' });

      // Act & Assess
      expect(() => APIGatewayProxyEventV2Schema.parse(event)).toThrow();
    });

    it('should parse an event with no authorizer', () => {
      // Prepare
      const event = getTestEvent({ eventsPath, filename: 'no-auth' });

      // Act
      const parsedEvent = APIGatewayProxyEventV2Schema.parse(event);

      // Assess
      expect(parsedEvent).toEqual(event);
    });

    it('should parse an event with a lambda authorizer', () => {
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

    it('should parse an event with a JWT authorizer', () => {
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

    it('should parse an event with an IAM authorizer', () => {
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
    it('should throw when the event is invalid', () => {
      // Prepare
      const event = getTestEvent({ eventsPath, filename: 'invalid' });

      // Act & Assess
      expect(() =>
        APIGatewayRequestAuthorizerEventV2Schema.parse(event)
      ).toThrow();
    });

    it('should parse the authorizer event', () => {
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
  });

  describe('should detect missing properties in schema for ', () => {
    it.each([
      'iam-auth',
      'jwt-authorizer-auth',
      'lambda-authorizer-auth',
      'no-auth',
    ])('event %s', (filename) => {
      // Prepare
      const event = getTestEvent({ eventsPath, filename });
      const strictSchema = makeSchemaStrictForTesting(
        APIGatewayProxyEventV2Schema
      );
      // Act & Assess
      expect(() => strictSchema.parse(event)).not.toThrow();
    });

    it('authorizer-request event', () => {
      // Prepare
      const event = getTestEvent({
        eventsPath,
        filename: 'authorizer-request',
      });
      const strictSchema = makeSchemaStrictForTesting(
        APIGatewayRequestAuthorizerEventV2Schema
      );
      // Act & Assess
      expect(() => strictSchema.parse(event)).not.toThrow();
    });
  });
});
