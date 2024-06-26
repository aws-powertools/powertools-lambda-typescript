import { z } from 'zod';
import {
  APIGatewayCert,
  APIGatewayRecord,
  APIGatewayStringArray,
  APIGatewayHttpMethod,
} from './apigw-proxy.js';

/**
 * A zod schema for an API Gateway Event Identity
 *
 * @see {@link https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html}
 */
const APIGatewayEventIdentity = z.object({
  accessKey: z.string().nullish(),
  accountId: z.string().nullish(),
  apiKey: z.string().nullish(),
  apiKeyId: z.string().nullish(),
  caller: z.string().nullish(),
  cognitoAuthenticationProvider: z.string().nullish(),
  cognitoAuthenticationType: z.string().nullish(),
  cognitoIdentityId: z.string().nullish(),
  cognitoIdentityPoolId: z.string().nullish(),
  principalOrgId: z.string().nullish(),
  /**
   * When invoking the API Gateway REST API using the Test Invoke feature,
   * the sourceIp is hardcoded to `test-invoke-source-ip`. This is a stopgap
   * solution to allow customers to test their API and have successful parsing.
   *
   * See aws-powertools/powertools-lambda-python#1562 for more information.
   */
  sourceIp: z
    .union([z.string().ip(), z.literal('test-invoke-source-ip')])
    .optional(),
  user: z.string().nullish(),
  userAgent: z.string().nullish(),
  userArn: z.string().nullish(),
  clientCert: APIGatewayCert.nullish(),
});

/**
 * A zod schema for an API Gateway Event Request Context
 *
 * @see {@link https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-mapping-template-reference.html#context-variable-reference}
 */
const APIGatewayEventRequestContext = z
  .object({
    accountId: z.string(),
    apiId: z.string(),
    deploymentId: z.string().nullish(),
    authorizer: z
      .union([
        z.object({
          integrationLatency: z.number(),
          principalId: z.string(),
        }),
        z.object({
          claims: z.record(z.string(), z.any()),
          scopes: APIGatewayStringArray.optional(),
        }),
      ])
      .nullish(),
    stage: z.string(),
    protocol: z.string(),
    identity: APIGatewayEventIdentity,
    requestId: z.string(),
    requestTime: z.string(),
    requestTimeEpoch: z.number(),
    resourceId: z.string().nullish(),
    resourcePath: z.string(),
    domainName: z.string().nullish(),
    domainPrefix: z.string().nullish(),
    extendedRequestId: z.string().nullish(),
    httpMethod: z.enum([
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'HEAD',
      'OPTIONS',
    ]),
    path: z.string(),
    connectedAt: z.number().nullish(),
    connectionId: z.string().nullish(),
    eventType: z.enum(['CONNECT', 'MESSAGE', 'DISCONNECT']).nullish(),
    messageDirection: z.string().nullish(),
    messageId: z.string().nullish(),
    routeKey: z.string().nullish(),
    operationName: z.string().nullish(),
  })
  .refine(
    (input) => {
      return (
        !input.messageId || (input.messageId && input.eventType === 'MESSAGE')
      );
    },
    {
      message: 'messageId is available only when `eventType` is MESSAGE',
    }
  );

/**
 * A zod schema for an API Gateway Proxy event
 *
 * @example
 * ```json
 * {
 *   "type": "REQUEST",
 *   "methodArn": "arn:aws:execute-api:us-east-1:123456789012:abcdef123/test/GET/request",
 *   "resource": "/request",
 *   "path": "/request",
 *   "httpMethod": "GET",
 *   "headers": {
 *     "X-AMZ-Date": "20170718T062915Z",
 *     "Accept": "application/json",
 *     "HeaderAuth1": "headerValue1"
 *   },
 *   "queryStringParameters": {
 *     "QueryString1": "queryValue1"
 *   },
 *   "pathParameters": {},
 *   "stageVariables": null,
 *   "requestContext": {
 *     "path": "/request",
 *     "accountId": "123456789012",
 *     "resourceId": "05c7jb",
 *     "stage": "test",
 *     "requestId": "...",
 *     "identity": {
 *       "cognitoIdentityPoolId": null,
 *       "accountId": null,
 *       "cognitoIdentityId": null,
 *       "caller": null,
 *       "sourceIp": "192.168.1.1",
 *       "principalOrgId": null,
 *       "accessKey": null,
 *       "cognitoAuthenticationType": null,
 *       "cognitoAuthenticationProvider": null,
 *       "userArn": null,
 *       "userAgent": "HTTPie/3.2.2",
 *       "user": null
 *     }
 *   },
 *   "resourcePath": "/request",
 *   "httpMethod": "GET",
 *   "apiId": "abcdef123"
 * }
 * ```
 *
 * @see {@link https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html}
 */
const APIGatewayProxyEventSchema = z.object({
  resource: z.string(),
  path: z.string(),
  httpMethod: APIGatewayHttpMethod,
  headers: APIGatewayRecord.nullish(),
  multiValueHeaders: z.record(APIGatewayStringArray).nullish(),
  queryStringParameters: APIGatewayRecord.nullable(),
  multiValueQueryStringParameters: z.record(APIGatewayStringArray).nullable(),
  pathParameters: APIGatewayRecord.nullish(),
  stageVariables: APIGatewayRecord.nullish(),
  requestContext: APIGatewayEventRequestContext,
  body: z.string().nullable(),
  isBase64Encoded: z.boolean(),
});

/**
 * A zod schema for an API Gateway Request Authorizer event
 *
 * @example
 * ```json
 * {
 *   "type": "REQUEST",
 *   "methodArn": "arn:aws:execute-api:us-west-2:123456789012:ymy8tbxw7b/prod/GET/",
 *   "resource": "/{proxy+}",
 *   "path": "/hello/world",
 *   "httpMethod": "GET",
 *   "headers": {
 *     "X-AMZ-Date": "20170718T062915Z",
 *     "Accept": "application/json",
 *     "HeaderAuth1": "headerValue1"
 *   },
 *   "multiValueHeaders": {
 *     "X-AMZ-Date": ["20170718T062915Z"],
 *     "Accept": ["application/json"],
 *     "HeaderAuth1": ["headerValue1"]
 *   },
 *   "queryStringParameters": {},
 *   "multiValueQueryStringParameters": {},
 *   "pathParameters": {},
 *   "stageVariables": {},
 *   "requestContext": {
 *     "path": "/request",
 *     "accountId": "123456789012",
 *     "resourceId": "05c7jb",
 *     "stage": "test",
 *     "requestId": "...",
 *     "identity": {
 *       "cognitoIdentityPoolId": null,
 *       "accountId": null,
 *       "cognitoIdentityId": null,
 *       "caller": null,
 *       "sourceIp": "192.168.1.1",
 *       "principalOrgId": null,
 *       "accessKey": null,
 *       "cognitoAuthenticationType": null,
 *       "cognitoAuthenticationProvider": null,
 *       "userArn": null,
 *       "userAgent": "HTTPie/3.2.2",
 *       "user": null
 *     }
 *   },
 *   "domainName": "id.execute-api.us-west-2.amazonaws.com",
 *   "deploymentId": "lle82z",
 *   "apiId": "ymy8tbxw7b"
 * }
 * ```
 *
 * @see {@link https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-lambda-authorizer-input.html#w76aac15b9c21c25c21b5}
 */
const APIGatewayRequestAuthorizerEventSchema = z.object({
  type: z.literal('REQUEST'),
  methodArn: z.string(),
  resource: z.string(),
  path: z.string(),
  httpMethod: APIGatewayHttpMethod,
  headers: APIGatewayRecord,
  multiValueHeaders: z.record(APIGatewayStringArray),
  queryStringParameters: APIGatewayRecord,
  multiValueQueryStringParameters: z.record(APIGatewayStringArray),
  pathParameters: APIGatewayRecord,
  stageVariables: APIGatewayRecord,
  requestContext: APIGatewayEventRequestContext,
  domainName: z.string().optional(),
  deploymentId: z.string().optional(),
  apiId: z.string().optional(),
});

/**
 * A zod schema for an API Gateway Token Authorizer event
 *
 * @example
 * ```json
 * {
 *   "type": "TOKEN",
 *   "authorizationToken": "Bearer abcd1234",
 *   "methodArn": "arn:aws:execute-api:us-west-2:123456789012:ymy8tbxw7b/prod/GET/"
 * }
 * ```
 *
 * @see {@link https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-lambda-authorizer-input.html#w76aac15b9c21c25c21b3}
 */
const APIGatewayTokenAuthorizerEventSchema = z.object({
  type: z.literal('TOKEN'),
  authorizationToken: z.string(),
  methodArn: z.string(),
});

export {
  APIGatewayProxyEventSchema,
  APIGatewayRequestAuthorizerEventSchema,
  APIGatewayTokenAuthorizerEventSchema,
};
