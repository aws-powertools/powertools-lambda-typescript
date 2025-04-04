import { describe, expect, it } from 'vitest';
import { APIGatewayProxyWebsocketEventSchema } from '../../../src/schemas/api-gateway-websocket';
import type { APIGatewayProxyWebsocketEvent } from '../../../src/types/schema';
import { getTestEvent } from '../helpers/utils';

describe('Schema: APIGatewayProxyWebsocketEvent', () => {
  const baseEvent = getTestEvent<APIGatewayProxyWebsocketEvent>({
    eventsPath: 'apigw-websocket',
    filename: 'connectEvent',
  });

  it('parses a valid API Gateway WebSocket event', () => {
    // Prepare
    const event = structuredClone(baseEvent);

    // Act
    const result = APIGatewayProxyWebsocketEventSchema.parse(event);

    // Assess
    expect(result).toStrictEqual(event);
  });

  it('throws if the event is missing required fields', () => {
    // Prepare
    const invalidEvent = {
      type: 'REQUEST',
      methodArn: 'arn:aws:execute-api:us-east-1:123456789012:abcdef123/default/$connect',
      headers: {},
      requestContext: {
        routeKey: '$connect',
        eventType: 'CONNECT',
      },
    };

    // Act & Assess
    expect(() => APIGatewayProxyWebsocketEventSchema.parse(invalidEvent)).toThrow();
  });
});