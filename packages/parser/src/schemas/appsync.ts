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
  claims: z.any(),
  sourceIp: z.array(z.string()),
  defaultAuthStrategy: z.string(),
  groups: z.array(z.string()).nullable(),
});

const AppSyncOidcIdentity = z.object({
  claims: z.any(),
  issuer: z.string(),
  sub: z.string(),
});

const AppSyncLambdaIdentity = z.object({
  resolverContext: z.any(),
});

const AppSyncIdentity = z.union([
  AppSyncCognitoIdentity,
  AppSyncIamIdentity,
  AppSyncOidcIdentity,
  AppSyncLambdaIdentity,
]);

/**
 * A zod schema for an AppSync resolver event
 *
 * @example
 * ```json
 * {
 *   "arguments": {
 *     "id": "1973493"
 *   },
 *   "source": null,
 *   "identity": {
 *     "accountId": "012345678901",
 *     "cognitoIdentityAuthProvider": null,
 *     "cognitoIdentityAuthType": null,
 *     "cognitoIdentityId": null,
 *     "cognitoIdentityPoolId": null,
 *     "sourceIp": ["10.10.10.10"],
 *     "userArn": "arn:aws:sts::012345678901:assumed-role/role",
 *     "username": "AROAXYKJUOW6FHGUSK5FA:username"
 *   },
 *   "request": {
 *     "headers": {
 *       "x-forwarded-for": "1.1.1.1, 2.2.2.2",
 *       "cloudfront-viewer-country": "US",
 *       "cloudfront-is-tablet-viewer": "false",
 *       "via": "2.0 xxxxxxxxxxxxxxxx.cloudfront.net (CloudFront)",
 *       "cloudfront-forwarded-proto": "https",
 *       "origin": "https://us-west-1.console.aws.amazon.com",
 *       "content-length": "217",
 *       "accept-language": "en-US,en;q=0.9",
 *       "host": "xxxxxxxxxxxxxxxx.appsync-api.us-west-1.amazonaws.com",
 *       "x-forwarded-proto": "https",
 *       "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36",
 *       "accept": "*!/!*",
 *       "cloudfront-is-mobile-viewer": "false",
 *       "cloudfront-is-smarttv-viewer": "false",
 *       "accept-encoding": "gzip, deflate, br",
 *       "referer": "https://us-west-1.console.aws.amazon.com/appsync/home?region=us-west-1",
 *       "content-type": "application/json",
 *       "sec-fetch-mode": "cors",
 *       "x-amz-cf-id": "3aykhqlUwQeANU-HGY7E_guV5EkNeMMtwyOgiA==",
 *       "x-amzn-trace-id": "Root=1-5f512f51-fac632066c5e848ae714",
 *       "authorization": "eyJraWQiOiJScWFCSlJqYVJlM0hrSnBTUFpIcVRXazNOW...",
 *       "sec-fetch-dest": "empty",
 *       "x-amz-user-agent": "AWS-Console-AppSync/",
 *       "cloudfront-is-desktop-viewer": "true",
 *       "sec-fetch-site": "cross-site",
 *       "x-forwarded-port": "443"
 *     }
 *   },
 *   "prev": {
 *     "result": {}
 *   },
 *   "info": {
 *     "selectionSetList": ["id", "field1", "field2"],
 *     "selectionSetGraphQL": "{\n  id\n  field1\n  field2\n}",
 *     "parentTypeName": "Mutation",
 *     "fieldName": "createSomething",
 *     "variables": {}
 *   },
 *   "stash": {}
 * }
 * ```
 *
 * @see {@link https://docs.aws.amazon.com/appsync/latest/devguide/resolver-context-reference-js.html}
 */

const AppSyncResolverSchema = z.object({
  arguments: z.record(z.any()),
  identity: z.optional(AppSyncIdentity),
  source: z.record(z.any()).nullable(),
  request: z.object({
    headers: z.record(z.string()),
  }),
  info: z.object({
    selectionSetList: z.array(z.string()),
    selectionSetGraphQL: z.string(),
    parentTypeName: z.string(),
    fieldName: z.string(),
    variables: z.record(z.any()),
  }),
  prev: z
    .object({
      result: z.record(z.any()),
    })
    .nullable(),
  stash: z.record(z.any()),
});

/**
 * A zod schema for a batch AppSync resolver event
 *
 * @example
 * /*
 * [{
 *   "arguments": {
 *     "id": "1973493"
 *   },
 *   "source": null,
 *   "identity": {
 *     "accountId": "012345678901",
 *     "cognitoIdentityAuthProvider": "cognitoIdentityAuthProvider",
 *     "cognitoIdentityAuthType": "cognitoIdentityAuthType",
 *     "cognitoIdentityId": "cognitoIdentityId",
 *     "cognitoIdentityPoolId": "cognitoIdentityPoolId",
 *     "sourceIp": ["10.10.10.10"],
 *     "userArn": "arn:aws:sts::012345678901:assumed-role/role",
 *     "username": "AROAXYKJUOW6FHGUSK5FA:username"
 *   },
 *   "request": {
 *     "headers": {
 *       "x-forwarded-for": "1.1.1.1, 2.2.2.2",
 *         "cloudfront-viewer-country": "US",
 *         "cloudfront-is-tablet-viewer": "false",
 *         "via": "2.0 xxxxxxxxxxxxxxxx.cloudfront.net (CloudFront)",
 *         "cloudfront-forwarded-proto": "https",
 *         "origin": "https://us-west-1.console.aws.amazon.com",
 *         "content-length": "217",
 *         "accept-language": "en-US,en;q=0.9",
 *         "host": "xxxxxxxxxxxxxxxx.appsync-api.us-west-1.amazonaws.com",
 *         "x-forwarded-proto": "https",
 *         "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36",
 *         "accept": "*!/!*",
 *         "cloudfront-is-mobile-viewer": "false",
 *         "cloudfront-is-smarttv-viewer": "false",
 *         "accept-encoding": "gzip, deflate, br",
 *         "referer": "https://us-west-1.console.aws.amazon.com/appsync/home?region=us-west-1",
 *         "content-type": "application/json",
 *         "sec-fetch-mode": "cors",
 *         "x-amz-cf-id": "3aykhqlUwQeANU-HGY7E_guV5EkNeMMtwyOgiA==",
 *         "x-amzn-trace-id": "Root=1-5f512f51-fac632066c5e848ae714",
 *         "authorization": "eyJraWQiOiJScWFCSlJqYVJlM0hrSnBTUFpIcVRXazNOW...",
 *         "sec-fetch-dest": "empty",
 *         "x-amz-user-agent": "AWS-Console-AppSync/",
 *         "cloudfront-is-desktop-viewer": "true",
 *         "sec-fetch-site": "cross-site",
 *         "x-forwarded-port": "443"
 *     }
 *   },
 *   "prev": {
 *     "result": {}
 *   },
 *   "info": {
 *     "selectionSetList": ["id", "field1", "field2"],
 *     "selectionSetGraphQL": "{\n  id\n  field1\n  field2\n}",
 *     "parentTypeName": "Mutation",
 *     "fieldName": "createSomething",
 *     "variables": {}
 *   },
 *   "stash": {}
 * },
 * {
 *   "arguments": {
 *     "id": "1987311"
 *   },
 *   "source": null,
 *   "identity": {
 *     "claims": {
 *       "sub": "sub"
 *     },
 *     "issuer": "issuer",
 *     "sub": "sub
 *   },
 *   "request": {
 *     "headers": {
 *       "x-forwarded-for": "1.1.1.1, 2.2.2.2",
 *         "cloudfront-viewer-country": "US",
 *         "cloudfront-is-tablet-viewer": "false",
 *         "via": "2.0 xxxxxxxxxxxxxxxx.cloudfront.net (CloudFront)",
 *         "cloudfront-forwarded-proto": "https",
 *         "origin": "https://us-west-1.console.aws.amazon.com",
 *         "content-length": "217",
 *         "accept-language": "en-US,en;q=0.9",
 *         "host": "xxxxxxxxxxxxxxxx.appsync-api.us-west-1.amazonaws.com",
 *         "x-forwarded-proto": "https",
 *         "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36",
 *         "accept": "*!/!*",
 *         "cloudfront-is-mobile-viewer": "false",
 *         "cloudfront-is-smarttv-viewer": "false",
 *         "accept-encoding": "gzip, deflate, br",
 *         "referer": "https://us-west-1.console.aws.amazon.com/appsync/home?region=us-west-1",
 *         "content-type": "application/json",
 *         "sec-fetch-mode": "cors",
 *         "x-amz-cf-id": "3aykhqlUwQeANU-HGY7E_guV5EkNeMMtwyOgiA==",
 *         "x-amzn-trace-id": "Root=1-5f512f51-fac632066c5e848ae714",
 *         "authorization": "eyJraWQiOiJScWFCSlJqYVJlM0hrSnBTUFpIcVRXazNOW...",
 *         "sec-fetch-dest": "empty",
 *         "x-amz-user-agent": "AWS-Console-AppSync/",
 *         "cloudfront-is-desktop-viewer": "true",
 *         "sec-fetch-site": "cross-site",
 *         "x-forwarded-port": "443"
 *     }
 *   },
 *   "prev": {
 *     "result": {}
 *   },
 *   "info": {
 *     "selectionSetList": ["id", "field1", "field2"],
 *     "selectionSetGraphQL": "{\n  id\n  field1\n  field2\n}",
 *     "parentTypeName": "Mutation",
 *     "fieldName": "createSomething",
 *     "variables": {}
 *   },
 *   "stash": {}
 * }]
 * ```
 *
 * @see {@link https://docs.aws.amazon.com/appsync/latest/devguide/tutorial-lambda-resolvers.html#advanced-use-case-batching}
 */

const AppSyncBatchResolverSchema = z.array(AppSyncResolverSchema);

export { AppSyncResolverSchema, AppSyncBatchResolverSchema };
