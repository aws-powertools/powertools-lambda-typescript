import { z } from 'zod';
import type { APIGatewayProxyWebsocketEvent } from '../types/schema.js';
import { APIGatewayRecord, APIGatewayStringArray } from './apigw-proxy.js';

/**
 * A zod schema for API Gateway Proxy WebSocket events.
 *
 * @example
 * ```json
 * {
 *   "type": "REQUEST",
 *   "methodArn": "arn:aws:execute-api:us-east-1:123456789012:abcdef123/default/$connect",
 *   "headers": {
 *     "Connection": "upgrade",
 *     "content-length": "0",
 *     "HeaderAuth1": "headerValue1",
 *     "Host": "abcdef123.execute-api.us-east-1.amazonaws.com",
 *     "Sec-WebSocket-Extensions": "permessage-deflate; client_max_window_bits",
 *     "Sec-WebSocket-Key": "...",
 *     "Sec-WebSocket-Version": "13",
 *     "Upgrade": "websocket",
 *     "X-Amzn-Trace-Id": "..."
 *   },
 *   "multiValueHeaders": {
 *     "Connection": [ "upgrade" ],
 *     "content-length": [ "0" ],
 *     "HeaderAuth1": [ "headerValue1" ],
 *     "Host": [ "abcdef123.execute-api.us-east-1.amazonaws.com" ],
 *     "Sec-WebSocket-Extensions": [ "permessage-deflate; client_max_window_bits" ],
 *     "Sec-WebSocket-Key": [ "..." ],
 *     "Sec-WebSocket-Version": [ "13" ],
 *     "Upgrade": [ "websocket" ],
 *     "X-Amzn-Trace-Id": [ "..." ]
 *   },
 *   "queryStringParameters": {
 *     "QueryString1": "queryValue1"
 *   },
 *   "multiValueQueryStringParameters": {
 *     "QueryString1": [ "queryValue1" ]
 *   },
 *   "stageVariables": {},
 *   "requestContext": {
 *     "routeKey": "$connect",
 *     "eventType": "CONNECT",
 *     "extendedRequestId": "...",
 *     "requestTime": "19/Jan/2023:21:13:26 +0000",
 *     "messageDirection": "IN",
 *     "stage": "default",
 *     "connectedAt": 1674162806344,
 *     "requestTimeEpoch": 1674162806345,
 *     "identity": {
 *       "sourceIp": "..."
 *     },
 *     "requestId": "...",
 *     "domainName": "abcdef123.execute-api.us-east-1.amazonaws.com",
 *     "connectionId": "...",
 *     "apiId": "abcdef123"
 *   },
 *   "isBase64Encoded": false,
 *   "body": null
 * }
 * ```
 *
 * @see {@link APIGatewayProxyWebsocketEvent | `APIGatewayProxyWebsocketEvent`}
 * @see {@link https://docs.aws.amazon.com/apigateway/latest/developerguide/websocket-api-develop-integrations.html}
 */
export const APIGatewayProxyWebsocketEventSchema = z.object({
  type: z.string(),
  methodArn: z.string(),
  headers: z.record(z.string(), z.string()).nullish(),
  multiValueHeaders: z.record(z.string(), APIGatewayStringArray),
  queryStringParameters: APIGatewayRecord.nullable(),
  multiValueQueryStringParameters: z
    .record(z.string(), APIGatewayStringArray)
    .nullable(),
  stageVariables: APIGatewayRecord.nullable().optional(),
  requestContext: z.object({
    routeKey: z.string(),
    eventType: z.enum(['CONNECT', 'DISCONNECT', 'MESSAGE']),
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
  }),
  isBase64Encoded: z.boolean(),
  body: z.string().optional().nullable(),
});
