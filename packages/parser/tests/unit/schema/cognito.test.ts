import { describe, expect, it } from 'vitest';
import {
  CreateAuthChallengeSchema,
  CustomEmailSenderTriggerSchema,
  CustomMessageTriggerSchema,
  CustomSMSSenderTriggerSchema,
  DefineAuthChallengeSchema,
  MigrateUserTriggerSchema,
  PostAuthenticationTriggerSchema,
  PostConfirmationTriggerSchema,
  PreAuthenticationTriggerSchema,
  PreSignupTriggerSchema,
  PreTokenGenerationTriggerSchemaV1,
  PreTokenGenerationTriggerSchemaV2,
  VerifyAuthChallengeSchema,
} from '../../../src/schemas/cognito.js';
import { omit } from '../helpers/utils.js';

describe('Schema: Cognito PreSignupTrigger', () => {
  // Prepare
  const basePreSignupEvent = {
    version: '1',
    region: 'us-east-1',
    userPoolId: 'us-east-1_ABC123',
    userName: 'johndoe',
    callerContext: {
      awsSdkVersion: '2.814.0',
      clientId: 'client123',
    },
    triggerSource: 'PreSignUp_SignUp',
    request: {
      userAttributes: {
        email: 'johndoe@example.com',
        name: 'John Doe',
      },
      validationData: null,
      clientMetadata: {
        someKey: 'someValue',
      },
    },
    response: {
      autoConfirmUser: true,
      autoVerifyEmail: false,
      autoVerifyPhone: false,
    },
  };

  it('parses a valid pre-signup event', () => {
    // Prepare
    const event = structuredClone(basePreSignupEvent);
    // Act
    const result = PreSignupTriggerSchema.safeParse(event);
    // Assess
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.userName).toEqual('johndoe');
    }
  });

  it('throws if the pre-signup event is missing a required field', () => {
    // Prepare
    const event = omit(['userName'], structuredClone(basePreSignupEvent));
    // Act & Assess
    expect(() => PreSignupTriggerSchema.parse(event)).toThrow();
  });
});

describe('Schema: Cognito PostConfirmationTrigger', () => {
  // Prepare
  const basePostConfirmationEvent = {
    request: {
      userAttributes: {
        email: 'user@example.com',
        name: 'John Doe',
      },
      clientMetadata: {
        customKey: 'customValue',
      },
    },
    response: {},
  };

  it('parses a valid post-confirmation event', () => {
    // Prepare
    const event = structuredClone(basePostConfirmationEvent);
    // Act
    const result = PostConfirmationTriggerSchema.safeParse(event);
    // Assess
    expect(result.success).toBe(true);
  });

  it('throws if the post-confirmation event is missing a required field', () => {
    // Prepare
    const event = {
      ...basePostConfirmationEvent,
      request: omit(
        ['userAttributes'],
        structuredClone(basePostConfirmationEvent.request)
      ),
    };
    // Act & Assess
    expect(() => PostConfirmationTriggerSchema.parse(event)).toThrow();
  });
});

describe('Schema: Cognito PreAuthenticationTrigger', () => {
  // Prepare
  const basePreAuthEvent = {
    request: {
      userAttributes: {
        email: 'user@example.com',
        name: 'John Doe',
      },
      validationData: {
        someKey: 'someValue',
      },
      userNotFound: false,
    },
    response: {},
  };

  it('parses a valid pre-authentication event', () => {
    // Prepare
    const event = structuredClone(basePreAuthEvent);
    // Act
    const result = PreAuthenticationTriggerSchema.safeParse(event);
    // Assess
    expect(result.success).toBe(true);
  });

  it('throws if the pre-authentication event is missing a required field', () => {
    // Prepare
    const event = {
      ...basePreAuthEvent,
      request: omit(
        ['userAttributes'],
        structuredClone(basePreAuthEvent.request)
      ),
    };
    // Act & Assess
    expect(() => PreAuthenticationTriggerSchema.parse(event)).toThrow();
  });
});

describe('Schema: Cognito PostAuthenticationTrigger', () => {
  // Prepare
  const basePostAuthEvent = {
    request: {
      userAttributes: {
        email: 'user@example.com',
        name: 'John Doe',
      },
      newDeviceUsed: true,
      clientMetadata: {
        customKey: 'customValue',
      },
    },
    response: {},
  };

  it('parses a valid post-authentication event', () => {
    // Prepare
    const event = structuredClone(basePostAuthEvent);
    // Act
    const result = PostAuthenticationTriggerSchema.safeParse(event);
    // Assess
    expect(result.success).toBe(true);
  });

  it('throws if the post-authentication event is missing a required field', () => {
    // Prepare
    const event = {
      ...basePostAuthEvent,
      request: omit(
        ['newDeviceUsed'],
        structuredClone(basePostAuthEvent.request)
      ),
    };
    // Act & Assess
    expect(() => PostAuthenticationTriggerSchema.parse(event)).toThrow();
  });
});

describe('Schema: Cognito PreTokenGenerationTrigger V1', () => {
  // Prepare
  const basePreTokenGenEventV1 = {
    request: {
      userAttributes: {
        email: 'user@example.com',
        name: 'John Doe',
      },
      groupConfiguration: {
        groupsToOverride: ['group1', 'group2'],
        iamRolesToOverride: ['role1', 'role2'],
        preferredRole: 'role1',
      },
      clientMetadata: {
        key1: 'value1',
      },
    },
    response: {
      claimsOverrideDetails: {
        claimsToAddOrOverride: {
          customClaim: 'customValue',
        },
        claimsToSuppress: ['email'],
        groupOverrideDetails: {
          groupsToOverride: ['newGroup1', 'newGroup2'],
          iamRolesToOverride: ['newRole1', 'newRole2'],
          preferredRole: 'newRole1',
        },
      },
    },
  };

  it('parses a valid pre-token generation V1 event', () => {
    // Prepare
    const event = structuredClone(basePreTokenGenEventV1);
    // Act
    const result = PreTokenGenerationTriggerSchemaV1.safeParse(event);
    // Assess
    expect(result.success).toBe(true);
  });

  it('throws if the pre-token generation V1 event is missing a required field', () => {
    // Prepare
    const event = {
      ...basePreTokenGenEventV1,
      request: omit(
        ['groupConfiguration'],
        structuredClone(basePreTokenGenEventV1.request)
      ),
    };
    // Act & Assess
    expect(() => PreTokenGenerationTriggerSchemaV1.parse(event)).toThrow();
  });
});

describe('Schema: Cognito PreTokenGenerationTrigger V2', () => {
  // Prepare
  const basePreTokenGenEventV2 = {
    request: {
      userAttributes: {
        email: 'user@example.com',
        name: 'John Doe',
      },
      scopes: ['openid', 'email'],
      groupConfiguration: {
        groupsToOverride: ['group1', 'group2'],
        iamRolesToOverride: ['role1', 'role2'],
        preferredRole: 'role1',
      },
      clientMetadata: {
        key1: 'value1',
      },
    },
    response: {
      claimsAndScopeOverrideDetails: {
        idTokenGeneration: {
          claimsToAddOrOverride: {
            customClaim: 'customValue',
          },
          claimsToSuppress: ['email'],
        },
        accessTokenGeneration: {
          claimsToAddOrOverride: {
            customClaim: 'customValue',
          },
          claimsToSuppress: ['email'],
          scopesToAdd: ['openid', 'profile'],
          scopesToSuppress: ['phone'],
        },
        groupOverrideDetails: {
          groupsToOverride: ['newGroup1', 'newGroup2'],
          iamRolesToOverride: ['newRole1', 'newRole2'],
          preferredRole: 'newRole1',
        },
      },
    },
  };

  it('parses a valid pre-token generation V2 event', () => {
    // Prepare
    const event = structuredClone(basePreTokenGenEventV2);
    // Act
    const result = PreTokenGenerationTriggerSchemaV2.safeParse(event);
    // Assess
    expect(result.success).toBe(true);
  });

  it('throws if the pre-token generation V2 event is missing a required field', () => {
    // Prepare
    const event = {
      ...basePreTokenGenEventV2,
      request: omit(
        ['scopes'],
        structuredClone(basePreTokenGenEventV2.request)
      ),
    };
    // Act & Assess
    expect(() => PreTokenGenerationTriggerSchemaV2.parse(event)).toThrow();
  });
});

describe('Schema: Cognito MigrateUserTrigger', () => {
  // Prepare
  const baseMigrateUserEvent = {
    userName: 'testuser',
    request: {
      password: 'TestPass123!',
      validationData: {
        key1: 'value1',
      },
      clientMetadata: {
        key2: 'value2',
      },
    },
    response: {
      userAttributes: {
        email: 'testuser@example.com',
        name: 'Test User',
      },
      finalUserStatus: 'CONFIRMED',
      messageAction: 'SUPPRESS',
      desiredDeliveryMediums: ['EMAIL'],
      forceAliasCreation: true,
      enableSMSMFA: false,
    },
  };

  it('parses a valid migrate user event', () => {
    // Prepare
    const event = structuredClone(baseMigrateUserEvent);
    // Act
    const result = MigrateUserTriggerSchema.safeParse(event);
    // Assess
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.userName).toEqual('testuser');
    }
  });

  it('throws if the migrate user event is missing a required field', () => {
    // Prepare
    const event = omit(['userName'], structuredClone(baseMigrateUserEvent));
    // Act & Assess
    expect(() => MigrateUserTriggerSchema.parse(event)).toThrow();
  });
});

describe('Schema: Cognito CustomMessageTrigger', () => {
  // Prepare
  const baseCustomMessageEvent = {
    request: {
      userAttributes: { email: 'test@example.com', name: 'Test User' },
      codeParameter: '####',
      usernameParameter: 'TestUser',
      clientMetadata: { key: 'value' },
    },
    response: {
      smsMessage: 'Your code is ####',
      emailMessage: 'Your verification code is ####',
      emailSubject: 'Verification',
    },
  };

  it('parses a valid custom message event', () => {
    // Prepare
    const event = structuredClone(baseCustomMessageEvent);
    // Act
    const result = CustomMessageTriggerSchema.safeParse(event);
    // Assess
    expect(result.success).toBe(true);
  });

  it('throws if the custom message event is missing a required field', () => {
    // Prepare
    const event = {
      ...baseCustomMessageEvent,
      request: omit(
        ['codeParameter'],
        structuredClone(baseCustomMessageEvent.request)
      ),
    };
    // Act & Assess
    expect(() => CustomMessageTriggerSchema.parse(event)).toThrow();
  });
});

describe('Schema: Cognito CustomEmailSenderTrigger', () => {
  // Prepare
  const baseCustomEmailSenderEvent = {
    request: {
      type: 'customEmailSenderRequestV1',
      code: 'encryptedCode',
      clientMetadata: { key: 'value' },
      userAttributes: { email: 'test@example.com', name: 'Test User' },
    },
    response: {},
  };

  it('parses a valid custom email sender event', () => {
    // Prepare
    const event = structuredClone(baseCustomEmailSenderEvent);
    // Act
    const result = CustomEmailSenderTriggerSchema.safeParse(event);
    // Assess
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.response).toEqual({});
    }
  });

  it('throws if the custom email sender event is missing a required field', () => {
    // Prepare
    const event = {
      ...baseCustomEmailSenderEvent,
      request: omit(
        ['code'],
        structuredClone(baseCustomEmailSenderEvent.request)
      ),
    };
    // Act & Assess
    expect(() => CustomEmailSenderTriggerSchema.parse(event)).toThrow();
  });
});

describe('Schema: Cognito CustomSMSSenderTrigger', () => {
  // Prepare
  const baseCustomSMSSenderEvent = {
    request: {
      type: 'customSMSSenderRequestV1',
      code: 'encryptedCode',
      clientMetadata: { key: 'value' },
      userAttributes: {
        phone_number: '+1234567890',
        email: 'test@example.com',
      },
    },
    response: {},
  };

  it('parses a valid custom SMS sender event', () => {
    // Prepare
    const event = structuredClone(baseCustomSMSSenderEvent);
    // Act
    const result = CustomSMSSenderTriggerSchema.safeParse(event);
    // Assess
    expect(result.success).toBe(true);
  });

  it('throws if the custom SMS sender event is missing a required field', () => {
    // Prepare
    const event = {
      ...baseCustomSMSSenderEvent,
      request: omit(
        ['code'],
        structuredClone(baseCustomSMSSenderEvent.request)
      ),
    };
    // Act & Assess
    expect(() => CustomSMSSenderTriggerSchema.parse(event)).toThrow();
  });
});

describe('Schema: Cognito DefineAuthChallenge', () => {
  const baseDefineAuthChallengeEvent = {
    request: {
      userAttributes: { email: 'user@example.com', name: 'John Doe' },
      session: [
        {
          challengeName: 'SRP_A',
          challengeResult: true,
          challengeMetadata: 'metadata',
        },
      ],
      clientMetadata: { key: 'value' },
      userNotFound: false,
    },
    response: {
      challengeName: 'PASSWORD_VERIFIER',
      issueTokens: false,
      failAuthentication: false,
    },
  };

  it('parses a valid define auth challenge event', () => {
    const event = structuredClone(baseDefineAuthChallengeEvent);
    const result = DefineAuthChallengeSchema.safeParse(event);
    expect(result.success).toBe(true);
  });

  it('throws if the define auth challenge event is missing a required field', () => {
    const event = {
      ...baseDefineAuthChallengeEvent,
      request: omit(
        ['userAttributes'],
        structuredClone(baseDefineAuthChallengeEvent.request)
      ),
    };
    expect(() => DefineAuthChallengeSchema.parse(event)).toThrow();
  });
});

describe('Schema: Cognito CreateAuthChallenge', () => {
  // Prepare
  const baseCreateAuthChallengeEvent = {
    request: {
      userAttributes: { email: 'user@example.com', name: 'John Doe' },
      challengeName: 'CUSTOM_CHALLENGE',
      session: [
        {
          challengeName: 'SRP_A',
          challengeResult: true,
          challengeMetadata: 'metadata',
        },
      ],
      clientMetadata: { key: 'value' },
      userNotFound: false,
    },
    response: {
      publicChallengeParameters: { captchaUrl: 'url/123.jpg' },
      privateChallengeParameters: { answer: '5' },
      challengeMetadata: 'custom metadata',
    },
  };

  it('parses a valid create auth challenge event', () => {
    // Prepare
    const event = structuredClone(baseCreateAuthChallengeEvent);
    // Act
    const result = CreateAuthChallengeSchema.safeParse(event);
    // Assess
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.response.publicChallengeParameters.captchaUrl).toEqual(
        'url/123.jpg'
      );
    }
  });

  it('throws if the create auth challenge event is missing a required field', () => {
    // Prepare
    const event = {
      ...baseCreateAuthChallengeEvent,
      request: omit(
        ['challengeName'],
        structuredClone(baseCreateAuthChallengeEvent.request)
      ),
    };
    // Act & Assess
    expect(() => CreateAuthChallengeSchema.parse(event)).toThrow();
  });
});

describe('Schema: Cognito VerifyAuthChallenge', () => {
  // Prepare
  const baseVerifyAuthChallengeEvent = {
    request: {
      userAttributes: { email: 'user@example.com', name: 'John Doe' },
      privateChallengeParameters: { answer: 'expectedAnswer' },
      challengeAnswer: 'expectedAnswer',
      clientMetadata: { key: 'value' },
      userNotFound: false,
    },
    response: {
      answerCorrect: true,
    },
  };

  it('parses a valid verify auth challenge event', () => {
    // Prepare
    const event = structuredClone(baseVerifyAuthChallengeEvent);
    // Act
    const result = VerifyAuthChallengeSchema.safeParse(event);
    // Assess
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.response.answerCorrect).toBe(true);
    }
  });

  it('throws if the verify auth challenge event is missing a required field', () => {
    // Prepare
    const event = {
      ...baseVerifyAuthChallengeEvent,
      request: omit(
        ['privateChallengeParameters'],
        structuredClone(baseVerifyAuthChallengeEvent.request)
      ),
    };
    // Act & Assess
    expect(() => VerifyAuthChallengeSchema.parse(event)).toThrow();
  });
});
