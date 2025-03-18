import { z } from 'zod';

/**
 * A zod schema for a Cognito Pre-Signup trigger event.
 *
 * @example
 * ```json
 * {
 *   "version": "1",
 *   "region": "us-east-1",
 *   "userPoolId": "us-east-1_ABC123",
 *   "userName": "johndoe",
 *   "callerContext": {
 *     "awsSdkVersion": "2.814.0",
 *     "clientId": "client123"
 *   },
 *   "triggerSource": "PreSignUp_SignUp",
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
 *     "autoConfirmUser": true,
 *     "autoVerifyEmail": false,
 *     "autoVerifyPhone": false
 *   }
 * }
 * ```
 * @see {@link https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-pre-sign-up.html}
 */
export const PreSignupTriggerSchema = z.object({
  version: z.string(),
  region: z.string(),
  userPoolId: z.string(),
  userName: z.string(),
  callerContext: z.object({
    awsSdkVersion: z.string(),
    clientId: z.string(),
  }),
  triggerSource: z.string(),
  request: z.object({
    userAttributes: z.record(z.string(), z.string()),
    validationData: z.record(z.string(), z.string()).nullable().optional(),
    clientMetadata: z.record(z.string(), z.string()).optional(),
    userNotFound: z.boolean().optional(),
  }),
  response: z
    .object({
      autoConfirmUser: z.boolean().optional(),
      autoVerifyEmail: z.boolean().optional(),
      autoVerifyPhone: z.boolean().optional(),
    })
    .optional(),
});

/**
 * A zod schema for a Cognito Post-Confirmation trigger event.
 *
 * @see {@link https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-post-confirmation.html}
 *
 * @example
 * ```json
 * {
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
 */
export const PostConfirmationTriggerSchema = z.object({
  request: z.object({
    userAttributes: z.record(z.string(), z.string()),
    clientMetadata: z.record(z.string(), z.string().optional()),
  }),
  response: z.object({}),
});

/**
 * A zod schema for a Cognito Pre-Authentication trigger event.
 *
 * @example
 * ```json
 * {
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
 *  * @see {@link https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-pre-authentication.html}
 */
export const PreAuthenticationTriggerSchema = z.object({
  request: z.object({
    userAttributes: z.record(z.string(), z.string()),
    validationData: z.record(z.string(), z.string()),
    userNotFound: z.boolean(),
  }),
  response: z.object({}),
});

/**
 * A zod schema for a Cognito Post-Authentication trigger event.
 *
 * @example
 * ```json
 * {
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
 * @see {@link https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-post-authentication.html}
 */
export const PostAuthenticationTriggerSchema = z.object({
  request: z.object({
    userAttributes: z.record(z.string(), z.string()),
    newDeviceUsed: z.boolean(),
    clientMetadata: z.record(z.string(), z.string()).optional(),
  }),
  response: z.object({}),
});

/**
 * A zod schema for a Cognito Pre-Token Generation trigger event (version 1).
 *
 * @example
 * ```json
 * {
 *   "request": {
 *     "userAttributes": { "string": "string" },
 *     "groupConfiguration": {
 *       "groupsToOverride": [ "string", "string" ],
 *       "iamRolesToOverride": [ "string", "string" ],
 *       "preferredRole": "string"
 *     },
 *     "clientMetadata": { "string": "string" }
 *   },
 *   "response": {
 *     "claimsOverrideDetails": {
 *       "claimsToAddOrOverride": { "string": "string" },
 *       "claimsToSuppress": [ "string", "string" ],
 *       "groupOverrideDetails": {
 *         "groupsToOverride": [ "string", "string" ],
 *         "iamRolesToOverride": [ "string", "string" ],
 *         "preferredRole": "string"
 *       }
 *     }
 *   }
 * }
 * ```
 * @see {@link https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-pre-token-generation.html}
 */
export const PreTokenGenerationTriggerSchemaV1 = z.object({
  request: z.object({
    userAttributes: z.record(z.string(), z.string()),
    groupConfiguration: z.object({
      groupsToOverride: z.array(z.string()),
      iamRolesToOverride: z.array(z.string()),
      preferredRole: z.string(),
    }),
    clientMetadata: z.record(z.string(), z.string()),
  }),
  response: z.object({
    claimsOverrideDetails: z.object({
      claimsToAddOrOverride: z.record(z.string(), z.string()),
      claimsToSuppress: z.array(z.string()),
      groupOverrideDetails: z.object({
        groupsToOverride: z.array(z.string()),
        iamRolesToOverride: z.array(z.string()),
        preferredRole: z.string(),
      }),
    }),
  }),
});

/**
 * A zod schema for a Cognito Pre-Token Generation trigger event (version 2).
 *
 * @example
 * ```json
 * {
 *   "request": {
 *     "userAttributes": { "string": "string" },
 *     "scopes": [ "string", "string" ],
 *     "groupConfiguration": {
 *       "groupsToOverride": [ "string", "string" ],
 *       "iamRolesToOverride": [ "string", "string" ],
 *       "preferredRole": "string"
 *     },
 *     "clientMetadata": { "string": "string" }
 *   },
 *   "response": {
 *     "claimsAndScopeOverrideDetails": {
 *       "idTokenGeneration": {
 *         "claimsToAddOrOverride": { "string": "string" },
 *         "claimsToSuppress": [ "string", "string" ]
 *       },
 *       "accessTokenGeneration": {
 *         "claimsToAddOrOverride": { "string": "string" },
 *         "claimsToSuppress": [ "string", "string" ],
 *         "scopesToAdd": [ "string", "string" ],
 *         "scopesToSuppress": [ "string", "string" ]
 *       },
 *       "groupOverrideDetails": {
 *         "groupsToOverride": [ "string", "string" ],
 *         "iamRolesToOverride": [ "string", "string" ],
 *         "preferredRole": "string"
 *       }
 *     }
 *   }
 * }
 * ```
 * @see {@link https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-pre-token-generation.html}
 */
export const PreTokenGenerationTriggerSchemaV2 = z.object({
  request: z.object({
    userAttributes: z.record(z.string(), z.string()),
    scopes: z.array(z.string()),
    groupConfiguration: z.object({
      groupsToOverride: z.array(z.string()),
      iamRolesToOverride: z.array(z.string()),
      preferredRole: z.string(),
    }),
    clientMetadata: z.record(z.string(), z.string()),
  }),
  response: z.object({
    claimsAndScopeOverrideDetails: z.object({
      idTokenGeneration: z.object({
        claimsToAddOrOverride: z.record(z.any()),
        claimsToSuppress: z.array(z.string()),
      }),
      accessTokenGeneration: z.object({
        claimsToAddOrOverride: z.record(z.any()),
        claimsToSuppress: z.array(z.string()),
        scopesToAdd: z.array(z.string()),
        scopesToSuppress: z.array(z.string()),
      }),
      groupOverrideDetails: z.object({
        groupsToOverride: z.array(z.string()),
        iamRolesToOverride: z.array(z.string()),
        preferredRole: z.string(),
      }),
    }),
  }),
});

/**
 * A zod schema for a Cognito Migrate User trigger event.
 *
 * @example
 * ```json
 * {
 *   "userName": "string",
 *   "request": {
 *     "password": "string",
 *     "validationData": { "key": "value" },
 *     "clientMetadata": { "key": "value" }
 *   },
 *   "response": {
 *     "userAttributes": { "key": "value" },
 *     "finalUserStatus": "string",
 *     "messageAction": "string",
 *     "desiredDeliveryMediums": [ "string" ],
 *     "forceAliasCreation": true,
 *     "enableSMSMFA": true
 *   }
 * }
 * ```
 * @see {@link https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-migrate-user.html}
 */
export const MigrateUserTriggerSchema = z.object({
  userName: z.string(),
  request: z.object({
    password: z.string(),
    validationData: z.record(z.string(), z.string()),
    clientMetadata: z.record(z.string(), z.string()),
  }),
  response: z.object({
    userAttributes: z.record(z.string(), z.string()),
    finalUserStatus: z.string(),
    messageAction: z.string(),
    desiredDeliveryMediums: z.array(z.string()),
    forceAliasCreation: z.boolean(),
    enableSMSMFA: z.boolean(),
  }),
});

/**
 * A zod schema for a Cognito Custom Message trigger event.
 *
 * @example
 * ```json
 * {
 *   "request": {
 *     "userAttributes": { "string": "string", ... },
 *     "codeParameter": "####",
 *     "usernameParameter": "string",
 *     "clientMetadata": { "string": "string", ... }
 *   },
 *   "response": {
 *     "smsMessage": "string",
 *     "emailMessage": "string",
 *     "emailSubject": "string"
 *   }
 * }
 * ```
 * @see {@link https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-custom-message.html}
 */
export const CustomMessageTriggerSchema = z.object({
  request: z.object({
    userAttributes: z.record(z.string(), z.string()),
    codeParameter: z.string(),
    usernameParameter: z.string(),
    clientMetadata: z.record(z.string(), z.string()).optional(),
  }),
  response: z.object({
    smsMessage: z.string(),
    emailMessage: z.string(),
    emailSubject: z.string(),
  }),
});

/**
 * A zod schema for a Cognito Custom Email Sender trigger event.
 *
 * @example
 * ```json
 * {
 *   "request": {
 *     "type": "customEmailSenderRequestV1",
 *     "code": "string",
 *     "clientMetadata": { "string": "string", ... },
 *     "userAttributes": { "string": "string", ... }
 *   },
 *   "response": {}
 * }
 * ```
 * @see {@link https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-custom-email-sender.html}
 */
export const CustomEmailSenderTriggerSchema = z.object({
  request: z.object({
    type: z.literal('customEmailSenderRequestV1'),
    code: z.string(),
    clientMetadata: z.record(z.string(), z.string()).optional(),
    userAttributes: z.record(z.string(), z.string()),
  }),
  response: z.object({}),
});

/**
 * A zod schema for a Cognito Custom SMS Sender trigger event.
 *
 * @example
 * ```json
 * {
 *   "request": {
 *     "type": "customSMSSenderRequestV1",
 *     "code": "string",
 *     "clientMetadata": { "string": "string", ... },
 *     "userAttributes": { "string": "string", ... }
 *   },
 *   "response": {}
 * }
 * ```
 * @see {@link https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-custom-sms-sender.html}
 */
export const CustomSMSSenderTriggerSchema = z.object({
  request: z.object({
    type: z.literal('customSMSSenderRequestV1'),
    code: z.string(),
    clientMetadata: z.record(z.string(), z.string()).optional(),
    userAttributes: z.record(z.string(), z.string()),
  }),
  response: z.object({}),
});

const ChallengeResultSchema = z.object({});

/**
 * A zod schema for a Cognito Define Auth Challenge trigger event.
 *
 * @example
 * ```json
 * {
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
 * @see {@link https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-define-auth-challenge.html}
 */
export const DefineAuthChallengeSchema = z.object({
  request: z.object({
    userAttributes: z.record(z.string(), z.string()),
    session: z.array(ChallengeResultSchema),
    clientMetadata: z.record(z.string(), z.string()).optional(),
    userNotFound: z.boolean(),
  }),
  response: z.object({
    challengeName: z.string(),
    issueTokens: z.boolean(),
    failAuthentication: z.boolean(),
  }),
});

/**
 * A zod schema for a Cognito Create Auth Challenge trigger event.
 *
 * @example
 * ```json
 * {
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
 * @see {@link https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-create-auth-challenge.html}
 */
export const CreateAuthChallengeSchema = z.object({
  request: z.object({
    userAttributes: z.record(z.string(), z.string()),
    challengeName: z.string(),
    session: z.array(ChallengeResultSchema),
    clientMetadata: z.record(z.string(), z.string()).optional(),
    userNotFound: z.boolean(),
  }),
  response: z.object({
    publicChallengeParameters: z.record(z.string()),
    privateChallengeParameters: z.record(z.string()),
    challengeMetadata: z.string(),
  }),
});

/**
 * A zod schema for a Cognito Verify Auth Challenge Response trigger event.
 *
 * @example
 * ```json
 * {
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
 * @see {@link https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-verify-auth-challenge-response.html}
 */
export const VerifyAuthChallengeSchema = z.object({
  request: z.object({
    userAttributes: z.record(z.string(), z.string()),
    privateChallengeParameters: z.record(z.string(), z.string()),
    challengeAnswer: z.string(),
    clientMetadata: z.record(z.string(), z.string()).optional(),
    userNotFound: z.boolean(),
  }),
  response: z.object({
    answerCorrect: z.boolean(),
  }),
});
