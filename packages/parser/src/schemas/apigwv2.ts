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
      principalOrgId: z.string().nullable(),
      userArn: z.string().optional(),
      userId: z.string().optional(),
      cognitoIdentity: z
        .object({
          amr: z.array(z.string()),
          identityId: z.string(),
          identityPoolId: z.string(),
        })
        .nullable(),
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
    .nullable(),
  domainName: z.string(),
  domainPrefix: z.string(),
  http: RequestContextV2Http,
  requestId: z.string(),
  routeKey: z.string(),
  stage: z.string(),
  time: z.string(),
  timeEpoch: z.number(),
});

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
