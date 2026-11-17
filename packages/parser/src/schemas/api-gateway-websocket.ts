import { z } from 'zod';
import type {
  APIGatewayProxyWebsocketEvent,
  APIGatewayWebSocketConnectEvent,
  APIGatewayWebSocketDisconnectEvent,
  APIGatewayWebSocketMessageEvent,
} from '../types/schema.js';
import { APIGatewayRecord, APIGatewayStringArray } from './apigw-proxy.js';

/**
 * Zod schema for the request context fields that every API Gateway WebSocket event has.
 */
const APIGatewayWebSocketRequestContextBaseSchema = z.object({
  extendedRequestId: z.string(),
  requestTime: z.string(),
  messageDirection: z.enum(['IN', 'OUT']),
  stage: z.string(),
  connectedAt: z.number(),
  requestTimeEpoch: z.number(),
  identity: z.object({
    sourceIp: z.string(),
    userAgent: z.string().optional(),
  }),
  requestId: z.string(),
  domainName: z.string(),
  connectionId: z.string(),
  apiId: z.string(),
});

/**
 * Zod schema for the API Gateway WebSocket event sent to the `$connect` route.
 *
 * @example
 * ```json
 * {
 *   "headers": {
 *     "Host": "abcdef123.execute-api.us-east-1.amazonaws.com",
 *     "Sec-WebSocket-Extensions": "permessage-deflate; client_max_window_bits",
 *     "Sec-WebSocket-Key": "+W5xw47OHh3OTFsWKjGu9Q==",
 *     "Sec-WebSocket-Version": "13",
 *     "X-Amzn-Trace-Id": "Root=1-6731ebfc-08e1e656421db73c5d2eef31",
 *     "X-Forwarded-For": "192.0.2.1",
 *     "X-Forwarded-Port": "443",
 *     "X-Forwarded-Proto": "https"
 *   },
 *   "multiValueHeaders": {
 *     "Host": ["abcdef123.execute-api.us-east-1.amazonaws.com"],
 *     "Sec-WebSocket-Extensions": ["permessage-deflate; client_max_window_bits"],
 *     "Sec-WebSocket-Key": ["+W5xw47OHh3OTFsWKjGu9Q=="],
 *     "Sec-WebSocket-Version": ["13"],
 *     "X-Amzn-Trace-Id": ["Root=1-6731ebfc-08e1e656421db73c5d2eef31"],
 *     "X-Forwarded-For": ["192.0.2.1"],
 *     "X-Forwarded-Port": ["443"],
 *     "X-Forwarded-Proto": ["https"]
 *   },
 *   "queryStringParameters": {
 *     "userId": "user123"
 *   },
 *   "multiValueQueryStringParameters": {
 *     "userId": ["user123"]
 *   },
 *   "requestContext": {
 *     "routeKey": "$connect",
 *     "eventType": "CONNECT",
 *     "extendedRequestId": "BFHPhFe3IAMF95g=",
 *     "requestTime": "11/Nov/2024:11:35:24 +0000",
 *     "messageDirection": "IN",
 *     "stage": "prod",
 *     "connectedAt": 1731324924553,
 *     "requestTimeEpoch": 1731324924561,
 *     "identity": {
 *       "sourceIp": "192.0.2.1"
 *     },
 *     "requestId": "BFHPhFe3IAMF95g=",
 *     "domainName": "abcdef123.execute-api.us-east-1.amazonaws.com",
 *     "connectionId": "BFHPhfCWIAMCKlQ=",
 *     "apiId": "abcdef123"
 *   },
 *   "isBase64Encoded": false
 * }
 * ```
 *
 * @see {@link APIGatewayWebSocketConnectEvent | `APIGatewayWebSocketConnectEvent`}
 * @see {@link https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-api-route-keys-connect-disconnect.html}
 */
const APIGatewayWebSocketConnectEventSchema = z.object({
  headers: APIGatewayRecord,
  multiValueHeaders: z.record(z.string(), APIGatewayStringArray),
  queryStringParameters: APIGatewayRecord.nullish(),
  multiValueQueryStringParameters: z
    .record(z.string(), APIGatewayStringArray)
    .nullish(),
  stageVariables: APIGatewayRecord.nullish(),
  requestContext: z.object({
    ...APIGatewayWebSocketRequestContextBaseSchema.shape,
    routeKey: z.literal('$connect'),
    eventType: z.literal('CONNECT'),
  }),
  isBase64Encoded: z.boolean(),
});

/**
 * Zod schema for the API Gateway WebSocket event sent to a custom route or the `$default` route when a client sends a message.
 *
 * @example
 * ```json
 * {
 *   "requestContext": {
 *     "routeKey": "chat",
 *     "messageId": "BFaVtfGSIAMCKug=",
 *     "eventType": "MESSAGE",
 *     "extendedRequestId": "BFaVtH2HoAMFZEQ=",
 *     "requestTime": "11/Nov/2024:13:45:46 +0000",
 *     "messageDirection": "IN",
 *     "stage": "prod",
 *     "connectedAt": 1731332735513,
 *     "requestTimeEpoch": 1731332746514,
 *     "identity": {
 *       "sourceIp": "192.0.2.1"
 *     },
 *     "requestId": "BFaVtH2HoAMFZEQ=",
 *     "domainName": "abcdef123.execute-api.us-east-1.amazonaws.com",
 *     "connectionId": "BFaT_fALIAMCKug=",
 *     "apiId": "abcdef123"
 *   },
 *   "body": "{\"action\": \"chat\", \"message\": \"Hello from client\"}",
 *   "isBase64Encoded": false
 * }
 * ```
 *
 * @see {@link APIGatewayWebSocketMessageEvent | `APIGatewayWebSocketMessageEvent`}
 * @see {@link https://docs.aws.amazon.com/apigateway/latest/developerguide/websocket-api-develop-routes.html}
 */
const APIGatewayWebSocketMessageEventSchema = z.object({
  stageVariables: APIGatewayRecord.nullish(),
  requestContext: z.object({
    ...APIGatewayWebSocketRequestContextBaseSchema.shape,
    routeKey: z.string(),
    messageId: z.string(),
    eventType: z.literal('MESSAGE'),
  }),
  body: z.string().nullish(),
  isBase64Encoded: z.boolean(),
});

/**
 * Zod schema for the API Gateway WebSocket event sent to the `$disconnect` route.
 *
 * @example
 * ```json
 * {
 *   "headers": {
 *     "Host": "abcdef123.execute-api.us-east-1.amazonaws.com",
 *     "x-api-key": "",
 *     "X-Forwarded-For": "",
 *     "x-restapi": ""
 *   },
 *   "multiValueHeaders": {
 *     "Host": ["abcdef123.execute-api.us-east-1.amazonaws.com"],
 *     "x-api-key": [""],
 *     "X-Forwarded-For": [""],
 *     "x-restapi": [""]
 *   },
 *   "requestContext": {
 *     "routeKey": "$disconnect",
 *     "disconnectStatusCode": 1005,
 *     "eventType": "DISCONNECT",
 *     "extendedRequestId": "BFbOeE87IAMF31w=",
 *     "requestTime": "11/Nov/2024:13:51:49 +0000",
 *     "messageDirection": "IN",
 *     "disconnectReason": "Client-side close frame status not set",
 *     "stage": "prod",
 *     "connectedAt": 1731332735513,
 *     "requestTimeEpoch": 1731333109875,
 *     "identity": {
 *       "sourceIp": "192.0.2.1"
 *     },
 *     "requestId": "BFbOeE87IAMF31w=",
 *     "domainName": "abcdef123.execute-api.us-east-1.amazonaws.com",
 *     "connectionId": "BFaT_fALIAMCKug=",
 *     "apiId": "abcdef123"
 *   },
 *   "isBase64Encoded": false
 * }
 * ```
 *
 * @see {@link APIGatewayWebSocketDisconnectEvent | `APIGatewayWebSocketDisconnectEvent`}
 * @see {@link https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-api-route-keys-connect-disconnect.html}
 */
const APIGatewayWebSocketDisconnectEventSchema = z.object({
  headers: APIGatewayRecord,
  multiValueHeaders: z.record(z.string(), APIGatewayStringArray),
  stageVariables: APIGatewayRecord.nullish(),
  requestContext: z.object({
    ...APIGatewayWebSocketRequestContextBaseSchema.shape,
    routeKey: z.literal('$disconnect'),
    eventType: z.literal('DISCONNECT'),
    disconnectStatusCode: z.number(),
    disconnectReason: z.string(),
  }),
  isBase64Encoded: z.boolean(),
});

/**
 * Zod schema for any API Gateway WebSocket event sent to a Lambda proxy integration.
 *
 * It accepts the `$connect`, `$disconnect` and message events, so use it when one function handles every route.
 * To parse the events of a single route, use {@link APIGatewayWebSocketConnectEventSchema | `APIGatewayWebSocketConnectEventSchema`},
 * {@link APIGatewayWebSocketMessageEventSchema | `APIGatewayWebSocketMessageEventSchema`} or
 * {@link APIGatewayWebSocketDisconnectEventSchema | `APIGatewayWebSocketDisconnectEventSchema`} instead.
 *
 * @see {@link APIGatewayProxyWebsocketEvent | `APIGatewayProxyWebsocketEvent`}
 * @see {@link https://docs.aws.amazon.com/apigateway/latest/developerguide/websocket-api-develop-integrations.html}
 */
const APIGatewayProxyWebsocketEventSchema = z.union([
  APIGatewayWebSocketConnectEventSchema,
  APIGatewayWebSocketMessageEventSchema,
  APIGatewayWebSocketDisconnectEventSchema,
]);

export {
  APIGatewayProxyWebsocketEventSchema,
  APIGatewayWebSocketConnectEventSchema,
  APIGatewayWebSocketDisconnectEventSchema,
  APIGatewayWebSocketMessageEventSchema,
};
