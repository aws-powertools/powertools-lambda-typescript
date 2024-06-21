import { z } from 'zod';

const APIGatewayCert = z.object({
  clientCertPem: z.string(),
  subjectDN: z.string(),
  issuerDN: z.string(),
  serialNumber: z.string(),
  validity: z.object({
    notBefore: z.string(),
    notAfter: z.string(),
  }),
});

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

const APIGatewayEventRequestContext = z
  .object({
    accountId: z.string(),
    apiId: z.string(),
    authorizer: z
      .object({
        claims: z.record(z.string(), z.any()).nullish(),
        scopes: z.array(z.string()).nullish(),
      })
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
 * Zod schema for an API Gateway Proxy event
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
 * @see {@link types.APIGatewayProxyEvent | APIGatewayProxyEvent}
 * @see {@link https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html}
 */
const APIGatewayProxyEventSchema = z.object({
  version: z.string().optional(),
  authorizationToken: z.string().optional(),
  identitySource: z.string().optional(),
  methodArn: z.string().optional(),
  type: z.enum(['TOKEN', 'REQUEST']).optional(),
  resource: z.string(),
  path: z.string(),
  httpMethod: z.enum([
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'HEAD',
    'OPTIONS',
  ]),
  headers: z.record(z.string()).optional(),
  queryStringParameters: z.record(z.string()).nullable(),
  multiValueHeaders: z.record(z.array(z.string())).optional(),
  multiValueQueryStringParameters: z.record(z.array(z.string())).nullable(),
  requestContext: APIGatewayEventRequestContext,
  pathParameters: z.record(z.string()).optional().nullish(),
  stageVariables: z.record(z.string()).optional().nullish(),
  isBase64Encoded: z.boolean().optional(),
  body: z.string().nullable(),
});
export const foo = APIGatewayProxyEventSchema;
export { APIGatewayProxyEventSchema, APIGatewayCert };
