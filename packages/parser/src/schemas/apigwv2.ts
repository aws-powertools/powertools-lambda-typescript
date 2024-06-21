import { z } from 'zod';
import { APIGatewayCert } from './apigw.js';

const RequestContextV2Authorizer = z.object({
  jwt: z
    .object({
      claims: z.record(z.string(), z.any()),
      scopes: z.array(z.string()).optional(),
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
          amr: z.array(z.string()),
          identityId: z.string(),
          identityPoolId: z.string(),
        })
        .nullish(),
    })
    .optional(),
  lambda: z.record(z.string(), z.any()).optional(),
});

const RequestContextV2Http = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']),
  path: z.string(),
  protocol: z.string(),
  sourceIp: z.string().ip(),
  userAgent: z.string(),
});

const RequestContextV2 = z.object({
  accountId: z.string(),
  apiId: z.string(),
  authorizer: RequestContextV2Authorizer.optional(),
  authentication: z
    .object({
      clientCert: APIGatewayCert.optional(),
    })
    .nullish(),
  domainName: z.string(),
  domainPrefix: z.string(),
  http: RequestContextV2Http,
  requestId: z.string(),
  routeKey: z.string(),
  stage: z.string(),
  time: z.string(),
  timeEpoch: z.number(),
});

/**
 * Zod schema for an API Gateway V2 Proxy event
 *
 * @example
 * ```json
 * {
 *   "version": "2.0",
 *   "routeKey": "$default",
 *   "rawPath": "/my/path",
 *   "rawQueryString": "parameter1=value1&parameter1=value2&parameter2=value",
 *   "cookies": [
 *     "cookie1",
 *     "cookie2"
 *   ],
 *   "headers": {
 *     "Header1": "value1",
 *     "Header2": "value1,value2"
 *   },
 *   "queryStringParameters": {
 *     "parameter1": "value1,value2",
 *     "parameter2": "value"
 *   },
 *   "requestContext": {
 *     "accountId": "123456789012",
 *     "apiId": "api-id",
 *     "authentication": {
 *       "clientCert": {
 *         "clientCertPem": "CERT_CONTENT",
 *         "subjectDN": "www.example.com",
 *         "issuerDN": "Example issuer",
 *         "serialNumber": "a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1",
 *         "validity": {
 *           "notBefore": "May 28 12:30:02 2019 GMT",
 *           "notAfter": "Aug  5 09:36:04 2021 GMT"
 *         }
 *       }
 *     },
 *     "authorizer": {
 *       "jwt": {
 *         "claims": {
 *           "claim1": "value1",
 *           "claim2": "value2"
 *         },
 *         "scopes": [
 *           "scope1",
 *           "scope2"
 *         ]
 *       }
 *     },
 *     "domainName": "id.execute-api.us-east-1.amazonaws.com",
 *     "domainPrefix": "id",
 *     "http": {
 *       "method": "POST",
 *       "path": "/my/path",
 *       "protocol": "HTTP/1.1",
 *       "sourceIp": "192.168.0.1",
 *       "userAgent": "agent"
 *     },
 *     "requestId": "id",
 *     "routeKey": "$default",
 *     "stage": "$default",
 *     "time": "12/Mar/2020:19:03:58 +0000",
 *     "timeEpoch": 1583348638390
 *   },
 *   "body": "{\"message\": \"hello world\", \"username\": \"tom\"}",
 *   "pathParameters": {
 *     "parameter1": "value1"
 *   },
 *   "isBase64Encoded": false,
 *   "stageVariables": {
 *     "stageVariable1": "value1",
 *     "stageVariable2": "value2"
 *   }
 * }
 * ```
 *
 * @see {@link types.APIGatewayProxyEventV2 | APIGatewayProxyEventV2}
 * @see {@link https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-develop-integrations-lambda.html}
 */
const APIGatewayProxyEventV2Schema = z.object({
  version: z.string(),
  routeKey: z.string(),
  rawPath: z.string(),
  rawQueryString: z.string(),
  cookies: z.array(z.string()).optional(),
  headers: z.record(z.string()),
  queryStringParameters: z.record(z.string()).optional(),
  pathParameters: z.record(z.string()).optional().nullish(),
  stageVariables: z.record(z.string()).optional().nullish(),
  requestContext: RequestContextV2,
  body: z.string().optional(),
  isBase64Encoded: z.boolean(),
});

export { APIGatewayProxyEventV2Schema };
