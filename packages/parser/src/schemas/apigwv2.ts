import { z } from 'zod';
import {
  APIGatewayCert,
  APIGatewayHttpMethod,
  APIGatewayRecord,
  APIGatewayStringArray,
} from './apigw-proxy.js';

/**
 * A zod schema for an API Gateway HTTP API Request Authorizer
 *
 * If Lambda authorizer is used, the `lambda` property will be set to an object
 * containing the `context` object returned by the Lambda authorizer function.
 * If no `context` object is returned, the `lambda` property will be set to `null`.
 *
 * If JWT authorizer is used, the `jwt` property will be set to an object
 * containing the `claims` object returned by the JWT authorizer function. Optionally,
 * the `scopes` property will be set to an array of scopes returned by the JWT authorizer.
 *
 * @example
 * ```json
 * {
 *   "jwt": {
 *     "claims": {
 *       "claim1": "value1",
 *       "claim2": "value2"
 *     },
 *     "scopes": [
 *       "scope1",
 *       "scope2"
 *     ]
 *   }
 * }
 * ```
 *
 * If IAM authorizer is used, the `iam` property will be set to an object
 * containing the details of the IAM user making the request.
 *
 * @see {@link https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-access-control.html}
 */
const APIGatewayRequestAuthorizerV2Schema = z.object({
  jwt: z
    .object({
      claims: z.record(z.string(), z.any()),
      scopes: APIGatewayStringArray.nullable(),
    })
    .optional(),
  iam: z
    .object({
      accessKey: z.string().optional(),
      accountId: z.string().optional(),
      callerId: z.string().optional(),
      principalOrgId: z.string().nullish(),
      userArn: z.string().optional(),
      userId: z.string().optional(),
      cognitoIdentity: z
        .object({
          amr: APIGatewayStringArray,
          identityId: z.string(),
          identityPoolId: z.string(),
        })
        .nullish(),
    })
    .optional(),
  lambda: z.record(z.string(), z.any()).nullish(),
});

/**
 * A zod schema for an API Gateway HTTP API Request Context
 *
 * @example
 * ```json
 * {
 *   "accountId": "123456789012",
 *   "apiId": "api-id",
 *   "authentication": {}
 *   "domainName": "id.execute-api.us-east-1.amazonaws.com",
 *   "domainPrefix": "id",
 *   "http": {
 *     "method": "POST",
 *     "path": "/my/path",
 *     "protocol": "HTTP/1.1",
 *     "sourceIp": "...",
 *     "userAgent": "..."
 *   },
 *   "requestId": "...",
 *   "routeKey": "$default",
 *   "stage": "$default",
 *   "time": "12/Mar/2020:19:03:58 +0000",
 *   "timeEpoch": 1583348638390
 * }
 * ```
 */
const APIGatewayRequestContextV2Schema = z.object({
  accountId: z.string(),
  apiId: z.string(),
  authorizer: APIGatewayRequestAuthorizerV2Schema.optional(),
  authentication: z
    .object({
      clientCert: APIGatewayCert.optional(),
    })
    .nullish(),
  domainName: z.string(),
  domainPrefix: z.string(),
  http: z.object({
    method: APIGatewayHttpMethod,
    path: z.string(),
    protocol: z.string(),
    sourceIp: z.string().ip(),
    userAgent: z.string(),
  }),
  requestId: z.string(),
  routeKey: z.string(),
  stage: z.string(),
  time: z.string(),
  timeEpoch: z.number(),
});

/**
 * A zod schema for an API Gateway HTTP API Proxy event
 *
 * @example
 * ```json
 * {
 *   "version": "2.0",
 *   "routeKey": "$default",
 *   "rawPath": "/my/path",
 *   "rawQueryString": "parameter1=value1&parameter1=value2&parameter2=value",
 *   "cookies": ["cookie1", "cookie2"],
 *   "headers": {
 *     "header1": "value1",
 *     "header2": "value1,value2"
 *   },
 *   "queryStringParameters": {
 *     "parameter1": "value1,value2",
 *     "parameter2": "value"
 *   },
 *   "requestContext": {
 *     "accountId": "123456789012",
 *     "apiId": "api-id",
 *     "authentication": {}
 *     "domainName": "id.execute-api.us-east-1.amazonaws.com",
 *     "domainPrefix": "id",
 *     "http": {
 *       "method": "POST",
 *       "path": "/my/path",
 *       "protocol": "HTTP/1.1",
 *       "sourceIp": "...",
 *       "userAgent": "..."
 *     },
 *     "requestId": "...",
 *     "routeKey": "$default",
 *     "stage": "$default",
 *     "time": "12/Mar/2020:19:03:58 +0000",
 *     "timeEpoch": 1583348638390
 *   },
 *   "body": "Hello from Lambda",
 *   "pathParameters": {},
 *   "isBase64Encoded": false,
 *   "stageVariables": {}
 * }
 * ```
 *
 * @see {@link https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-develop-integrations-lambda.html}
 */
const APIGatewayProxyEventV2Schema = z.object({
  version: z.string(),
  routeKey: z.string(),
  rawPath: z.string(),
  rawQueryString: z.string(),
  cookies: APIGatewayStringArray.optional(),
  headers: APIGatewayRecord,
  queryStringParameters: APIGatewayRecord.optional(),
  requestContext: APIGatewayRequestContextV2Schema,
  body: z.string().optional(),
  pathParameters: APIGatewayRecord.nullish(),
  isBase64Encoded: z.boolean(),
  stageVariables: APIGatewayRecord.nullish(),
});

/**
 * A zod schema for an API Gateway HTTP API Request Authorizer event
 *
 * @example
 * ```json
 * {
 *   "version": "2.0",
 *   "type": "REQUEST",
 *   "routeArn": "arn:aws:execute-api:us-east-1:123456789012:api-id/stage-name/GET/mydemoresource",
 *   "identitySource": ["user1", "123"],
 *   "routeKey": "$default",
 *   "rawPath": "/mydemoresource",
 *   "rawQueryString": "parameter1=value1&parameter1=value2&parameter2=value",
 *   "cookies": ["cookie1", "cookie2"],
 *   "headers": {
 *     "header1": "value1",
 *     "header2": "value1,value2"
 *   },
 *   "queryStringParameters": {
 *     "parameter1": "value1,value2",
 *     "parameter2": "value"
 *   },
 *   "requestContext": {
 *     "accountId": "123456789012",
 *     "apiId": "api-id",
 *     "authentication": {}
 *     "domainName": "id.execute-api.us-east-1.amazonaws.com",
 *     "domainPrefix": "id",
 *     "http": {
 *       "method": "POST",
 *       "path": "/my/path",
 *       "protocol": "HTTP/1.1",
 *       "sourceIp": "...",
 *       "userAgent": "..."
 *     },
 *     "requestId": "...",
 *     "routeKey": "$default",
 *     "stage": "$default",
 *     "time": "12/Mar/2020:19:03:58 +0000",
 *     "timeEpoch": 1583348638390
 *   },
 *   "pathParameters": {},
 *   "stageVariables": {}
 * }
 * ```
 *
 * @see {@link https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-lambda-authorizer.html}
 */
const APIGatewayRequestAuthorizerEventV2Schema = z.object({
  version: z.literal('2.0'),
  type: z.literal('REQUEST'),
  routeArn: z.string(),
  identitySource: APIGatewayStringArray,
  routeKey: z.string(),
  rawPath: z.string(),
  rawQueryString: z.string(),
  cookies: APIGatewayStringArray.optional(),
  headers: APIGatewayRecord.optional(),
  queryStringParameters: APIGatewayRecord.optional(),
  requestContext: APIGatewayRequestContextV2Schema,
  pathParameters: APIGatewayRecord.nullish(),
  stageVariables: APIGatewayRecord.nullish(),
});

export {
  APIGatewayProxyEventV2Schema,
  APIGatewayRequestAuthorizerEventV2Schema,
  APIGatewayRequestAuthorizerV2Schema,
  APIGatewayRequestContextV2Schema,
};
