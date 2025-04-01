import { z } from 'zod';

/**
 * Base schema including the common parameters for all Cognito trigger events.
 *
 * @see {@link https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-working-with-lambda-triggers.html#cognito-user-pools-lambda-trigger-syntax-shared | Amazon Cognito Developer Guide}
 */
const CognitoTriggerBaseSchema = z.object({
  version: z.string(),
  triggerSource: z.string(),
  region: z.string(),
  userPoolId: z.string(),
  userName: z.string().optional(),
  callerContext: z.object({
    awsSdkVersion: z.string(),
    clientId: z.string(),
  }),
  request: z.object({}),
  response: z.object({}),
});

/**
 * A zod schema for a Cognito Pre-Signup trigger event.
 *
 * @example
 * ```json
 * {
 *   "version": "1",
 *   "triggerSource": "PreSignUp_SignUp",
 *   "region": "us-east-1",
 *   "userPoolId": "us-east-1_ABC123",
 *   "userName": "johndoe",
 *   "callerContext": {
 *     "awsSdkVersion": "2.814.0",
 *     "clientId": "client123"
 *   },
 *   "request": {
 *     "userAttributes": {
 *       "email": "johndoe@example.com",
 *       "name": "John Doe"
 *     },
 *     "validationData": null,
 *     "clientMetadata": {
 *       "someKey": "someValue"
 *     }
 *   },
 *   "response": {
 *     "autoConfirmUser": false,
 *     "autoVerifyEmail": false,
 *     "autoVerifyPhone": false
 *   }
 * }
 * ```
 *
 * @see {@link https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-pre-sign-up.html | Amazon Cognito Developer Guide}
 */
const PreSignupTriggerSchema = CognitoTriggerBaseSchema.extend({
  triggerSource: z.literal('PreSignUp_SignUp'),
  request: z.object({
    userAttributes: z.record(z.string(), z.string()),
    validationData: z.record(z.string(), z.string()).nullable(),
    clientMetadata: z.record(z.string(), z.string()).optional(),
    userNotFound: z.boolean().optional(),
  }),
  response: z.object({
    autoConfirmUser: z.literal(false),
    autoVerifyEmail: z.literal(false),
    autoVerifyPhone: z.literal(false),
  }),
});

/**
 * A zod schema for a Cognito Post-Confirmation trigger event.
 *
 * @example
 * ```json
 * {
 *   "version": "1",
 *   "triggerSource": "PostConfirmation_ConfirmSignUp",
 *   "region": "us-east-1",
 *   "userPoolId": "us-east-1_ABC123",
 *   "userName": "johndoe",
 *   "callerContext": {
 *     "awsSdkVersion": "2.814.0",
 *     "clientId": "client123"
 *   },
 *   "request": {
 *     "userAttributes": {
 *       "email": "user@example.com",
 *       "name": "John Doe"
 *     },
 *     "clientMetadata": {
 *       "customKey": "customValue"
 *     }
 *   },
 *   "response": {}
 * }
 * ```
 *
 * @see {@link https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-post-confirmation.html | Amazon Cognito Developer Guide}
 */
const PostConfirmationTriggerSchema = CognitoTriggerBaseSchema.extend({
  triggerSource: z.literal('PostConfirmation_ConfirmSignUp'),
  request: z.object({
    userAttributes: z.record(z.string(), z.string()),
    clientMetadata: z.record(z.string(), z.string()).optional(),
  }),
  response: z.object({}),
});

/**
 * A zod schema for a Cognito Pre-Authentication trigger event.
 *
 * @example
 * ```json
 * {
 *   "version": "1",
 *   "triggerSource": "PreAuthentication_Authentication",
 *   "region": "us-east-1",
 *   "userPoolId": "us-east-1_ABC123",
 *   "request": {
 *     "userAttributes": {
 *       "email": "user@example.com",
 *       "name": "John Doe"
 *     },
 *     "validationData": {
 *       "someKey": "someValue"
 *     },
 *     "userNotFound": false
 *   },
 *   "response": {}
 * }
 * ```
 *
 *  * @see {@link https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-pre-authentication.html | Amazon Cognito Developer Guide}
 */
const PreAuthenticationTriggerSchema = CognitoTriggerBaseSchema.extend({
  triggerSource: z.literal('PreAuthentication_Authentication'),
  request: z.object({
    userAttributes: z.record(z.string(), z.string()),
    validationData: z.record(z.string(), z.string()).optional(),
    userNotFound: z.boolean().optional(),
  }),
  response: z.object({}),
});

/**
 * A zod schema for a Cognito Post-Authentication trigger event.
 *
 * @example
 * ```json
 * {
 *   "version": "1",
 *   "triggerSource": "PostAuthentication_Authentication",
 *   "region": "us-east-1",
 *   "userPoolId": "us-east-1_ABC123",
 *   "userName": "johndoe",
 *   "callerContext": {
 *     "awsSdkVersion": "2.814.0",
 *     "clientId": "client123"
 *   },
 *   "request": {
 *     "userAttributes": {
 *       "email": "user@example.com",
 *       "name": "John Doe"
 *     },
 *     "newDeviceUsed": true,
 *     "clientMetadata": {
 *       "customKey": "customValue"
 *     }
 *   },
 *   "response": {}
 * }
 * ```
 *
 * @see {@link https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-post-authentication.html | Amazon Cognito Developer Guide}
 */
const PostAuthenticationTriggerSchema = CognitoTriggerBaseSchema.extend({
  triggerSource: z.literal('PostAuthentication_Authentication'),
  request: z.object({
    userAttributes: z.record(z.string(), z.string()),
    newDeviceUsed: z.boolean().optional(),
    clientMetadata: z.record(z.string(), z.string()).optional(),
  }),
});

/**
 * A zod schema for a Cognito Pre-Token Generation trigger event group configuration.
 *
 * Use this schema to extend the {@link PreTokenGenerationTriggerRequestSchema} for the `groupConfiguration` property.
 */
const PreTokenGenerationTriggerGroupConfigurationSchema = z.object({
  groupsToOverride: z.array(z.string()),
  iamRolesToOverride: z.array(z.string()),
  preferredRole: z.string().optional(),
});

/**
 * A zod schema for a Cognito Pre-Token Generation trigger event request.
 *
 * Use this schema to extend the {@link PreTokenGenerationTriggerSchemaV1} and {@link PreTokenGenerationTriggerSchemaV2AndV3} for the `request` property.
 */
const PreTokenGenerationTriggerRequestSchema = z.object({
  userAttributes: z.record(z.string(), z.string()),
  groupConfiguration: PreTokenGenerationTriggerGroupConfigurationSchema,
  clientMetadata: z.record(z.string(), z.string()).optional(),
});

/**
 * A zod schema for a Cognito Pre-Token Generation trigger event (version 1).
 *
 * @example
 * ```json
 * {
 *   "version": "1",
 *   "triggerSource": "TokenGeneration_Authentication",
 *   "region": "us-east-1",
 *   "userPoolId": "us-east-1_ABC123",
 *   "userName": "johndoe",
 *   "callerContext": {
 *     "awsSdkVersion": "2.814.0",
 *     "clientId": "client123"
 *   },
 *   "request": {
 *     "userAttributes": { "string": "string" },
 *     "groupConfiguration": {
 *       "groupsToOverride": [ "string", "string" ],
 *       "iamRolesToOverride": [ "string", "string" ],
 *       "preferredRole": "string"
 *     },
 *     "clientMetadata": { "string": "string" }
 *   },
 *   "response": {}
 * }
 * ```
 *
 * @see {@link https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-pre-token-generation.html | Amazon Cognito Developer Guide}
 */
const PreTokenGenerationTriggerSchemaV1 = CognitoTriggerBaseSchema.extend({
  request: PreTokenGenerationTriggerRequestSchema,
});

/**
 * A zod schema for a Cognito Pre-Token Generation trigger event (version 2 and 3).
 *
 * @example
 * ```json
 * {
 *   "version": "2",
 *   "triggerSource": "TokenGeneration_Authentication",
 *   "region": "us-east-1",
 *   "userPoolId": "us-east-1_ABC123",
 *   "userName": "johndoe",
 *   "callerContext": {
 *     "awsSdkVersion": "2.814.0",
 *     "clientId": "client123"
 *   },
 *   "request": {
 *     "userAttributes": { "string": "string" },
 *     "groupConfiguration": {
 *       "groupsToOverride": [ "string", "string" ],
 *       "iamRolesToOverride": [ "string", "string" ],
 *       "preferredRole": "string"
 *     },
 *     "scopes": [ "string", "string" ],
 *     "clientMetadata": { "string": "string" }
 *  },
 *  "response": {}
 * }
 * ```
 *
 * @see {@link https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-pre-token-generation.html | Amazon Cognito Developer Guide}
 */
const PreTokenGenerationTriggerSchemaV2AndV3 = CognitoTriggerBaseSchema.extend({
  request: PreTokenGenerationTriggerRequestSchema.extend({
    scopes: z.array(z.string()).optional(),
  }),
});

/**
 * A zod schema for a Cognito Migrate User trigger event.
 *
 * @example
 * ```json
 * {
 *   "version": "1",
 *   "triggerSource": "UserMigration_Authentication",
 *   "region": "us-east-1",
 *   "userPoolId": "us-east-1_ABC123",
 *   "userName": "johndoe",
 *   "callerContext": {
 *     "awsSdkVersion": "2.814.0",
 *     "clientId": "client123"
 *   },
 *   "request": {
 *     "password": "string",
 *     "validationData": { "key": "value" },
 *     "clientMetadata": { "key": "value" }
 *   },
 *   "response": {
 *     "userAttributes": null,
 *     "finalUserStatus": null,
 *     "messageAction": null,
 *     "desiredDeliveryMediums": null,
 *     "forceAliasCreation": null,
 *     "enableSMSMFA": null
 *   }
 * }
 * ```
 *
 * @see {@link https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-migrate-user.html | Amazon Cognito Developer Guide}
 */
const MigrateUserTriggerSchema = CognitoTriggerBaseSchema.extend({
  userName: z.string(),
  request: z.object({
    password: z.string(),
    validationData: z.record(z.string(), z.string()).optional(),
    clientMetadata: z.record(z.string(), z.string()).optional(),
  }),
  response: z.object({
    userAttributes: z.record(z.string(), z.string()).nullable(),
    finalUserStatus: z.string().nullable(),
    messageAction: z.string().nullable(),
    desiredDeliveryMediums: z.array(z.string()).nullable(),
    forceAliasCreation: z.boolean().nullable(),
    enableSMSMFA: z.boolean().nullable(),
  }),
});

/**
 * A zod schema for a Cognito Custom Message trigger event.
 *
 * @example
 * ```json
 * {
 *   "version": "1",
 *   "triggerSource": "CustomMessage_SignUp",
 *   "region": "us-east-1",
 *   "userPoolId": "us-east-1_ABC123",
 *   "userName": "johndoe",
 *   "callerContext": {
 *     "awsSdkVersion": "2.814.0",
 *     "clientId": "client123"
 *   },
 *   "request": {
 *     "userAttributes": {
 *       "email": "user@example.com",
 *       "name": "John Doe"
 *     },
 *     "codeParameter": "{####}",
 *     "usernameParameter": "string",
 *     "linkParameter": "string",
 *     "usernameParameter": null
 *   },
 *   "response": {
 *     "smsMessage": null,
 *     "emailMessage": null,
 *     "emailSubject": null,
 *   }
 * }
 * ```
 *
 * @see {@link https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-custom-message.html | Amazon Cognito Developer Guide}
 */
const CustomMessageTriggerSchema = CognitoTriggerBaseSchema.extend({
  request: z.object({
    userAttributes: z.record(z.string(), z.string()),
    codeParameter: z.string(),
    linkParameter: z.string().nullable(),
    usernameParameter: z.string().nullable(),
    clientMetadata: z.record(z.string(), z.string()).optional(),
  }),
  response: z.object({
    smsMessage: z.string().nullable(),
    emailMessage: z.string().nullable(),
    emailSubject: z.string().nullable(),
  }),
});

/**
 * A zod schema for a Cognito Custom Email Sender trigger event.
 *
 * @example
 * ```json
 * {
 *   "version": "1",
 *   "triggerSource": "CustomEmailSender_SignUp",
 *   "region": "us-east-1",
 *   "userPoolId": "us-east-1_ABC123",
 *   "userName": "johndoe",
 *   "callerContext": {
 *     "awsSdkVersion": "2.814.0",
 *     "clientId": "client123"
 *   },
 *   "request": {
 *     "type": "customEmailSenderRequestV1",
 *     "code": "string",
 *     "clientMetadata": { "string": "string" },
 *     "userAttributes": { "string": "string" }
 *   },
 *   "response": {}
 * }
 * ```
 *
 * @see {@link https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-custom-email-sender.html | Amazon Cognito Developer Guide}
 */
const CustomEmailSenderTriggerSchema = CognitoTriggerBaseSchema.extend({
  triggerSource: z.literal('CustomEmailSender_SignUp'),
  request: z.object({
    type: z.literal('customEmailSenderRequestV1'),
    code: z.string(),
    clientMetadata: z.record(z.string(), z.string()).optional(),
    userAttributes: z.record(z.string(), z.string()),
  }),
});

/**
 * A zod schema for a Cognito Custom SMS Sender trigger event.
 *
 * @example
 * ```json
 * {
 *   "version": "1",
 *   "triggerSource": "CustomSMSSender_SignUp",
 *   "region": "us-east-1",
 *   "userPoolId": "us-east-1_ABC123",
 *   "userName": "johndoe",
 *   "callerContext": {
 *     "awsSdkVersion": "2.814.0",
 *     "clientId": "client123"
 *   },
 *   "request": {
 *     "type": "customSMSSenderRequestV1",
 *     "code": "string",
 *     "clientMetadata": {
 *       "string": "string"
 *     },
 *     "userAttributes": { "string": "string" }
 *   },
 *   "response": {}
 * }
 * ```
 *
 * @see {@link https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-custom-sms-sender.html | Amazon Cognito Developer Guide}
 */
const CustomSMSSenderTriggerSchema = CognitoTriggerBaseSchema.extend({
  triggerSource: z.literal('CustomSMSSender_SignUp'),
  request: z.object({
    type: z.literal('customSMSSenderRequestV1'),
    code: z.string(),
    clientMetadata: z.record(z.string(), z.string()).optional(),
    userAttributes: z.record(z.string(), z.string()),
  }),
});

/**
 * A zod schema for a Cognito Challenge Result.
 */
const ChallengeResultSchema = z.object({
  challengeName: z.union([
    z.literal('CUSTOM_CHALLENGE'),
    z.literal('SRP_A'),
    z.literal('PASSWORD_VERIFIER'),
    z.literal('SMS_MFA'),
    z.literal('EMAIL_OTP'),
    z.literal('SOFTWARE_TOKEN_MFA'),
    z.literal('DEVICE_SRP_AUTH'),
    z.literal('DEVICE_PASSWORD_VERIFIER'),
    z.literal('ADMIN_NO_SRP_AUTH'),
  ]),
  challengeResult: z.boolean(),
  challengeMetadata: z.string().optional(),
});

/**
 * A zod schema for a Cognito Define Auth Challenge trigger event.
 *
 * @example
 * ```json
 * {
 *   "version": "1",
 *   "triggerSource": "DefineAuthChallenge_Authentication",
 *   "region": "us-east-1",
 *   "userPoolId": "us-east-1_ABC123",
 *   "userName": "johndoe",
 *   "callerContext": {
 *     "awsSdkVersion": "2.814.0",
 *     "clientId": "client123"
 *   },
 *   "request": {
 *     "userAttributes": { "email": "user@example.com", "name": "John Doe" },
 *     "session": [
 *       {
 *         "challengeName": "SRP_A",
 *         "challengeResult": true,
 *         "challengeMetadata": "metadata"
 *       }
 *     ],
 *     "clientMetadata": { "key": "value" },
 *     "userNotFound": false
 *   },
 *   "response": {
 *     "challengeName": "PASSWORD_VERIFIER",
 *     "issueTokens": false,
 *     "failAuthentication": false
 *   }
 * }
 * ```
 *
 * @see {@link https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-define-auth-challenge.html | Amazon Cognito Developer Guide}
 */
const DefineAuthChallengeTriggerSchema = CognitoTriggerBaseSchema.extend({
  triggerSource: z.literal('DefineAuthChallenge_Authentication'),
  request: z.object({
    userAttributes: z.record(z.string(), z.string()),
    session: z.array(ChallengeResultSchema).min(1),
    clientMetadata: z.record(z.string(), z.string()).optional(),
    userNotFound: z.boolean().optional(),
  }),
  response: z.object({
    challengeName: z.string().nullish(),
    issueTokens: z.boolean().nullish(),
    failAuthentication: z.boolean().nullish(),
  }),
});

/**
 * A zod schema for a Cognito Create Auth Challenge trigger event.
 *
 * @example
 * ```json
 * {
 *   "version": "1",
 *   "triggerSource": "CreateAuthChallenge_Authentication",
 *   "region": "us-east-1",
 *   "userPoolId": "us-east-1_ABC123",
 *   "userName": "johndoe",
 *   "callerContext": {
 *     "awsSdkVersion": "2.814.0",
 *     "clientId": "client123"
 *   },
 *   "request": {
 *     "userAttributes": { "email": "user@example.com", "name": "John Doe" },
 *     "challengeName": "CUSTOM_CHALLENGE",
 *     "session": [
 *       { "challengeName": "SRP_A", "challengeResult": true, "challengeMetadata": "metadata" }
 *     ],
 *     "clientMetadata": { "key": "value" },
 *     "userNotFound": false
 *   },
 *   "response": {
 *     "publicChallengeParameters": { "captchaUrl": "url/123.jpg" },
 *     "privateChallengeParameters": { "answer": "5" },
 *     "challengeMetadata": "custom metadata"
 *   }
 * }
 * ```
 *
 * @see {@link https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-create-auth-challenge.html | Amazon Cognito Developer Guide}
 */
const CreateAuthChallengeTriggerSchema = CognitoTriggerBaseSchema.extend({
  triggerSource: z.literal('CreateAuthChallenge_Authentication'),
  request: z.object({
    userAttributes: z.record(z.string(), z.string()),
    challengeName: z.string(),
    session: z.array(ChallengeResultSchema).min(1),
    clientMetadata: z.record(z.string(), z.string()).optional(),
    userNotFound: z.boolean().optional(),
  }),
  response: z.object({
    publicChallengeParameters: z.record(z.string()).nullish(),
    privateChallengeParameters: z.record(z.string()).nullish(),
    challengeMetadata: z.string().nullish(),
  }),
});

/**
 * A zod schema for a Cognito Verify Auth Challenge Response trigger event.
 *
 * @example
 * ```json
 * {
 *   "version": "1",
 *   "triggerSource": "VerifyAuthChallengeResponse_Authentication",
 *   "region": "us-east-1",
 *   "userPoolId": "us-east-1_ABC123",
 *   "userName": "johndoe",
 *   "callerContext": {
 *     "awsSdkVersion": "2.814.0",
 *     "clientId": "client123"
 *   },
 *   "request": {
 *     "userAttributes": { "email": "user@example.com", "name": "John Doe" },
 *     "privateChallengeParameters": { "answer": "expectedAnswer" },
 *     "challengeAnswer": "userAnswer",
 *     "clientMetadata": { "key": "value" },
 *     "userNotFound": false
 *   },
 *   "response": {
 *     "answerCorrect": true
 *   }
 * }
 * ```
 *
 * @see {@link https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-verify-auth-challenge-response.html | Amazon Cognito Developer Guide}
 */
const VerifyAuthChallengeTriggerSchema = CognitoTriggerBaseSchema.extend({
  triggerSource: z.literal('VerifyAuthChallengeResponse_Authentication'),
  request: z.object({
    userAttributes: z.record(z.string(), z.string()),
    privateChallengeParameters: z.record(z.string(), z.string()),
    challengeAnswer: z.string(),
    clientMetadata: z.record(z.string(), z.string()).optional(),
    userNotFound: z.boolean().optional(),
  }),
  response: z.object({
    answerCorrect: z.boolean(),
  }),
});

export {
  CognitoTriggerBaseSchema,
  PreSignupTriggerSchema,
  PostConfirmationTriggerSchema,
  PreAuthenticationTriggerSchema,
  PostAuthenticationTriggerSchema,
  MigrateUserTriggerSchema,
  CustomMessageTriggerSchema,
  CustomEmailSenderTriggerSchema,
  CustomSMSSenderTriggerSchema,
  ChallengeResultSchema,
  DefineAuthChallengeTriggerSchema,
  CreateAuthChallengeTriggerSchema,
  VerifyAuthChallengeTriggerSchema,
  PreTokenGenerationTriggerSchemaV1,
  PreTokenGenerationTriggerSchemaV2AndV3,
  PreTokenGenerationTriggerGroupConfigurationSchema,
  PreTokenGenerationTriggerRequestSchema,
};
