/**
 * Test built-in API Gateway REST schemas
 *
 * @group unit/parser/schema/apigw
 */
import {
  APIGatewayProxyEventSchema,
  APIGatewayRequestAuthorizerEventSchema,
  APIGatewayTokenAuthorizerEventSchema,
} from '../../../src/schemas/index.js';
import { getTestEvent, makeSchemaStrictForTesting } from './utils.js';

describe('API Gateway REST Schemas', () => {
  const eventsPath = 'apigw-rest';

  describe('APIGatewayProxyEventSchema', () => {
    it('should throw when the event is invalid', () => {
      // Prepare
      const event = getTestEvent({ eventsPath, filename: 'invalid' });

      // Act & Assess
      expect(() => APIGatewayProxyEventSchema.parse(event)).toThrow();
    });

    it('should parse an event with no authorizer', () => {
      // Prepare
      const event = getTestEvent({ eventsPath, filename: 'no-auth' });

      // Act
      const parsedEvent = APIGatewayProxyEventSchema.parse(event);

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
      const parsedEvent = APIGatewayProxyEventSchema.parse(event);

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
      const parsedEvent = APIGatewayProxyEventSchema.parse(event);

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
      const parsedEvent = APIGatewayProxyEventSchema.parse(event);

      // Assess
      expect(parsedEvent).toEqual(event);
    });

    it('should parse an event sent by the AWS console test UI', () => {
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

    it('should parse an event sent as a part of a websocket API', () => {
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
  });

  describe('APIGatewayRequestAuthorizerEventSchema', () => {
    it('should throw when the event is invalid', () => {
      // Prepare
      const event = getTestEvent({ eventsPath, filename: 'invalid' });

      // Act & Assess
      expect(() =>
        APIGatewayRequestAuthorizerEventSchema.parse(event)
      ).toThrow();
    });

    it('should parse the authorizer event', () => {
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
    it('should throw when the event is invalid', () => {
      // Prepare
      const event = getTestEvent({ eventsPath, filename: 'invalid' });

      // Act & Assess
      expect(() => APIGatewayTokenAuthorizerEventSchema.parse(event)).toThrow();
    });

    it('should parse the event', () => {
      // Prepare
      const event = getTestEvent({ eventsPath, filename: 'authorizer-token' });

      // Act
      const parsedEvent = APIGatewayTokenAuthorizerEventSchema.parse(event);

      // Assess
      expect(parsedEvent).toEqual(event);
    });
  });

  describe('should detect missing properties in schema for ', () => {
    it.each([
      'console-test-ui',
      'iam-auth',
      'jwt-authorizer-auth',
      'lambda-authorizer-auth',
      'no-auth',
      'websocket',
    ])(' %p example event', (filename) => {
      // Prepare
      const event = getTestEvent({ eventsPath, filename: filename });

      const strictSchema = makeSchemaStrictForTesting(
        APIGatewayProxyEventSchema
      );

      // Act & Assess
      expect(() => strictSchema.parse(event)).not.toThrow();
    });

    it('authorizer-request example event', () => {
      // Prepare
      const event = getTestEvent({
        eventsPath,
        filename: 'authorizer-request',
      });

      const strictSchema = makeSchemaStrictForTesting(
        APIGatewayRequestAuthorizerEventSchema
      );

      // Act & Assess
      expect(() => strictSchema.parse(event)).not.toThrow();
    });

    it('authorizer-token example event', () => {
      // Prepare
      const event = getTestEvent({
        eventsPath,
        filename: 'authorizer-token',
      });

      const strictSchema = makeSchemaStrictForTesting(
        APIGatewayTokenAuthorizerEventSchema
      );

      // Act & Assess
      expect(() => strictSchema.parse(event)).not.toThrow();
    });
  });
});
