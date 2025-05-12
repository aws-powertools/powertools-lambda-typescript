import { z } from 'zod';

const AppSyncIamIdentity = z.object({
  accountId: z.string(),
  cognitoIdentityPoolId: z.string().nullable(),
  cognitoIdentityId: z.string().nullable(),
  sourceIp: z.array(z.string()),
  username: z.string(),
  userArn: z.string(),
  cognitoIdentityAuthType: z.string().nullable(),
  cognitoIdentityAuthProvider: z.string().nullable(),
});

const AppSyncCognitoIdentity = z.object({
  sub: z.string(),
  issuer: z.string(),
  username: z.string(),
  claims: z.record(z.string(), z.unknown()),
  sourceIp: z.array(z.string().ip()),
  defaultAuthStrategy: z.string().nullable(),
  groups: z.array(z.string()).nullable(),
});

const AppSyncOidcIdentity = z.object({
  claims: z.any(),
  issuer: z.string(),
  sub: z.string(),
});

export { AppSyncCognitoIdentity, AppSyncIamIdentity, AppSyncOidcIdentity };
