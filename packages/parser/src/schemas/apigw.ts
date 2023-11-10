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

const APIGatewayEventRequestContext = z.object({
  accessKey: z.string().optional(),
  accountId: z.string().optional(),
  apiKey: z.string().optional(),
  apiKeyId: z.string().optional(),
  caller: z.string().optional(),
  cognitoAuthenticationProvider: z.string().optional(),
  cognitoAuthenticationType: z.string().optional(),
  cognitoIdentityId: z.string().optional(),
  cognitoIdentityPoolId: z.string().optional(),
  principalOrgId: z.string().optional(),
  sourceIp: z.string().ip().optional(),
  user: z.string().optional(),
  userAgent: z.string().optional(),
  userArn: z.string().optional(),
  clientCert: APIGatewayCert.optional(),
});

const APIGatewayProxyEventSchema = z.object({
  version: z.string().optional(),
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
  headers: z.record(z.string()),
  multiValueHeaders: z.record(z.array(z.string())),
  queryStringParameters: z.record(z.string()).optional(),
  multiValueQueryStringParameters: z.record(z.array(z.string())).optional(),
  requestContext: APIGatewayEventRequestContext,
  pathParameters: z.record(z.string()).optional().nullish(),
  stageVariables: z.record(z.string()).optional().nullish(),
  body: z.string().optional(),
});

export { APIGatewayProxyEventSchema };
