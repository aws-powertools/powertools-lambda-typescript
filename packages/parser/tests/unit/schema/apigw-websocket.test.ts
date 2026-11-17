import { describe, expect, it } from 'vitest';
import {
  APIGatewayProxyWebsocketEventSchema,
  APIGatewayWebSocketConnectEventSchema,
  APIGatewayWebSocketDisconnectEventSchema,
  APIGatewayWebSocketMessageEventSchema,
} from '../../../src/schemas/api-gateway-websocket.js';
import type {
  APIGatewayWebSocketConnectEvent,
  APIGatewayWebSocketDisconnectEvent,
  APIGatewayWebSocketMessageEvent,
} from '../../../src/types/schema.js';
import { getTestEvent, omit } from '../helpers/utils.js';

describe('Schema: APIGatewayWebSocket', () => {
  const eventsPath = 'apigw-websocket';
  const baseConnect = getTestEvent<APIGatewayWebSocketConnectEvent>({
    eventsPath,
    filename: 'connect',
  });
  const baseMessage = getTestEvent<APIGatewayWebSocketMessageEvent>({
    eventsPath,
    filename: 'message',
  });
  const baseDisconnect = getTestEvent<APIGatewayWebSocketDisconnectEvent>({
    eventsPath,
    filename: 'disconnect',
  });

  it('parses a $connect event', () => {
    // Prepare
    const event = structuredClone(baseConnect);

    // Act
    const result = APIGatewayWebSocketConnectEventSchema.parse(event);

    // Assess
    expect(result).toStrictEqual(event);
  });

  it('parses a $connect event without a query string', () => {
    // Prepare
    const event = omit(
      ['queryStringParameters', 'multiValueQueryStringParameters'],
      structuredClone(baseConnect)
    );

    // Act
    const result = APIGatewayWebSocketConnectEventSchema.parse(event);

    // Assess
    expect(result).toStrictEqual(event);
  });

  it('throws if the event is not a $connect event', () => {
    // Prepare
    const event = structuredClone(baseMessage);

    // Act & Assess
    expect(() => APIGatewayWebSocketConnectEventSchema.parse(event)).toThrow();
  });

  it('parses a message event', () => {
    // Prepare
    const event = structuredClone(baseMessage);

    // Act
    const result = APIGatewayWebSocketMessageEventSchema.parse(event);

    // Assess
    expect(result).toStrictEqual(event);
  });

  it('throws if a message event has no message ID', () => {
    // Prepare
    const event = {
      ...structuredClone(baseMessage),
      requestContext: omit(
        ['messageId'],
        structuredClone(baseMessage.requestContext)
      ),
    };

    // Act & Assess
    expect(() => APIGatewayWebSocketMessageEventSchema.parse(event)).toThrow();
  });

  it('parses a $disconnect event', () => {
    // Prepare
    const event = structuredClone(baseDisconnect);

    // Act
    const result = APIGatewayWebSocketDisconnectEventSchema.parse(event);

    // Assess
    expect(result).toStrictEqual(event);
  });

  it('throws if a $disconnect event has no status code', () => {
    // Prepare
    const event = {
      ...structuredClone(baseDisconnect),
      requestContext: omit(
        ['disconnectStatusCode'],
        structuredClone(baseDisconnect.requestContext)
      ),
    };

    // Act & Assess
    expect(() =>
      APIGatewayWebSocketDisconnectEventSchema.parse(event)
    ).toThrow();
  });

  it.each([
    { type: '$connect', event: baseConnect },
    { type: 'message', event: baseMessage },
    { type: '$disconnect', event: baseDisconnect },
  ])(
    'parses a $type event with the schema for all WebSocket events',
    ({ event }) => {
      // Prepare
      const input = structuredClone(event);

      // Act
      const result = APIGatewayProxyWebsocketEventSchema.parse(input);

      // Assess
      expect(result).toStrictEqual(input);
    }
  );

  it('throws if the event is not an API Gateway WebSocket event', () => {
    // Prepare
    const event = {
      type: 'REQUEST',
      methodArn:
        'arn:aws:execute-api:us-east-1:123456789012:abcdef123/default/$connect',
      headers: {},
      requestContext: {
        routeKey: '$connect',
        eventType: 'CONNECT',
      },
    };

    // Act & Assess
    expect(() => APIGatewayProxyWebsocketEventSchema.parse(event)).toThrow();
  });
});
