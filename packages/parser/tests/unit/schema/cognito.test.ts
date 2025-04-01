import { describe, expect, it } from 'vitest';
import {
  CreateAuthChallengeTriggerSchema,
  CustomEmailSenderTriggerSchema,
  CustomMessageTriggerSchema,
  CustomSMSSenderTriggerSchema,
  DefineAuthChallengeTriggerSchema,
  MigrateUserTriggerSchema,
  PostAuthenticationTriggerSchema,
  PostConfirmationTriggerSchema,
  PreAuthenticationTriggerSchema,
  PreSignupTriggerSchema,
  PreTokenGenerationTriggerSchemaV1,
  VerifyAuthChallengeTriggerSchema,
} from '../../../src/schemas/cognito.js';
import { getTestEvent } from '../helpers/utils.js';

describe('Schemas: Cognito User Pool', () => {
  const baseEvent = getTestEvent({
    eventsPath: 'cognito',
    filename: 'base',
  });

  it('parses a valid pre-signup event', () => {
    // Prepare
    const event = structuredClone(baseEvent);
    event.triggerSource = 'PreSignUp_SignUp';
    event.request = {
      userAttributes: {},
      validationData: null,
    };
    event.response = {
      autoConfirmUser: false,
      autoVerifyEmail: false,
      autoVerifyPhone: false,
    };

    // Act
    const result = PreSignupTriggerSchema.parse(event);

    // Assess
    expect(result).toEqual(event);
  });

  it('throws if the pre-signup event is missing a required field', () => {
    // Prepare
    const event = structuredClone(baseEvent);

    // Act & Assess
    expect(() => PreSignupTriggerSchema.parse(event)).toThrow();
  });

  it('parses a valid post-confirmation event', () => {
    // Prepare
    const event = structuredClone(baseEvent);
    event.triggerSource = 'PostConfirmation_ConfirmSignUp';
    event.request = {
      userAttributes: {
        sub: '42051434-5091-70ec-4b71-7c26db407ea4',
        'cognito:user_status': 'CONFIRMED',
      },
    };

    // Act
    const result = PostConfirmationTriggerSchema.parse(event);

    // Assess
    expect(result).toEqual(event);
  });

  it('throws if the post-confirmation event is missing a required field', () => {
    // Prepare
    const event = structuredClone(baseEvent);

    // Act & Assess
    expect(() => PostConfirmationTriggerSchema.parse(event)).toThrow();
  });

  it('parses a valid post-authentication event', () => {
    // Prepare
    const event = structuredClone(baseEvent);
    event.triggerSource = 'PostAuthentication_Authentication';
    event.request = {
      userAttributes: {
        sub: '42051434-5091-70ec-4b71-7c26db407ea4',
        'cognito:user_status': 'CONFIRMED',
      },
      newDeviceUsed: false,
      clientMetadata: {
        someKey: 'someValue',
      },
    };

    // Act
    const result = PostAuthenticationTriggerSchema.parse(event);

    // Assess
    expect(result).toEqual(event);
  });

  it('throws if the post-authentication event is missing a required field', () => {
    // Prepare
    const event = structuredClone(baseEvent);

    // Act & Assess
    expect(() => PostAuthenticationTriggerSchema.parse(event)).toThrow();
  });

  it('parses a valid pre-authentication event', () => {
    // Prepare
    const event = structuredClone(baseEvent);
    event.triggerSource = 'PreAuthentication_Authentication';
    event.request = {
      userAttributes: {
        sub: '42051434-5091-70ec-4b71-7c26db407ea4',
        'cognito:user_status': 'CONFIRMED',
      },
      userNotFound: false,
    };

    // Act
    const result = PreAuthenticationTriggerSchema.parse(event);

    // Assess
    expect(result).toEqual(event);
  });

  it('throws if the pre-authentication event is missing a required field', () => {
    // Prepare
    const event = structuredClone(baseEvent);

    // Act & Assess
    expect(() => PreAuthenticationTriggerSchema.parse(event)).toThrow();
  });

  it('parses a valid migrate user event', () => {
    // Prepare
    const event = structuredClone(baseEvent);
    event.triggerSource = 'UserMigration_Authentication';
    event.request = {
      password: 'string',
      validationData: {
        key1: 'value1',
      },
      clientMetadata: {
        key2: 'value2',
      },
    };
    event.response = {
      userAttributes: null,
      forceAliasCreation: null,
      enableSMSMFA: null,
      finalUserStatus: null,
      messageAction: null,
      desiredDeliveryMediums: null,
    };

    // Act
    const result = MigrateUserTriggerSchema.parse(event);

    // Assess
    expect(result).toEqual(event);
  });

  it('throws if the migrate user event is missing a required field', () => {
    // Prepare
    const event = structuredClone(baseEvent);

    // Act & Assess
    expect(() => MigrateUserTriggerSchema.parse(event)).toThrow();
  });

  it('parses a valid custom message event', () => {
    // Prepare
    const event = structuredClone(baseEvent);
    event.triggerSource = 'CustomMessage_SignUp';
    event.request = {
      userAttributes: {
        sub: '42051434-5091-70ec-4b71-7c26db407ea4',
        'cognito:user_status': 'CONFIRMED',
      },
      codeParameter: 'string',
      usernameParameter: 'string',
      clientMetadata: {
        key1: 'value1',
      },
      linkParameter: 'string',
    };
    event.response = {
      smsMessage: null,
      emailMessage: null,
      emailSubject: null,
    };

    // Act
    const result = CustomMessageTriggerSchema.parse(event);

    // Assess
    expect(result).toEqual(event);
  });

  it('throws if the custom message event is missing a required field', () => {
    // Prepare
    const event = structuredClone(baseEvent);

    // Act & Assess
    expect(() => CustomMessageTriggerSchema.parse(event)).toThrow();
  });

  it('parses a valid custom message event with custom email sender', () => {
    // Prepare
    const event = structuredClone(baseEvent);
    event.triggerSource = 'CustomEmailSender_SignUp';
    event.request = {
      type: 'customEmailSenderRequestV1',
      code: 'string',
      clientMetadata: {
        key1: 'value1',
      },
      userAttributes: {
        sub: '42051434-5091-70ec-4b71-7c26db407ea4',
        'cognito:user_status': 'CONFIRMED',
      },
    };

    // Act
    const result = CustomEmailSenderTriggerSchema.parse(event);

    // Assess
    expect(result).toEqual(event);
  });

  it('throws if the custom message event with custom email sender is missing a required field', () => {
    // Prepare
    const event = structuredClone(baseEvent);

    // Act & Assess
    expect(() => CustomEmailSenderTriggerSchema.parse(event)).toThrow();
  });

  it('parses a valid custom message event with custom SMS sender', () => {
    // Prepare
    const event = structuredClone(baseEvent);
    event.triggerSource = 'CustomSMSSender_SignUp';
    event.request = {
      type: 'customSMSSenderRequestV1',
      code: 'string',
      clientMetadata: {
        key1: 'value1',
      },
      userAttributes: {
        sub: '42051434-5091-70ec-4b71-7c26db407ea4',
        'cognito:user_status': 'CONFIRMED',
      },
    };

    // Act
    const result = CustomSMSSenderTriggerSchema.parse(event);

    // Assess
    expect(result).toEqual(event);
  });

  it('throws if the custom message event with custom SMS sender is missing a required field', () => {
    // Prepare
    const event = structuredClone(baseEvent);

    // Act & Assess
    expect(() => CustomSMSSenderTriggerSchema.parse(event)).toThrow();
  });

  it('parses a valid define auth challenge event', () => {
    // Prepare
    const event = structuredClone(baseEvent);
    event.triggerSource = 'DefineAuthChallenge_Authentication';
    event.request = {
      userAttributes: {
        sub: '42051434-5091-70ec-4b71-7c26db407ea4',
        'cognito:user_status': 'CONFIRMED',
      },
      session: [
        {
          challengeName: 'SRP_A',
          challengeResult: true,
          challengeMetadata: 'metadata',
        },
      ],
      clientMetadata: { key: 'value' },
      userNotFound: false,
    };

    // Act
    const result = DefineAuthChallengeTriggerSchema.parse(event);

    // Assess
    expect(result).toEqual(event);
  });

  it('throws if the define auth challenge event is missing a required field', () => {
    // Prepare
    const event = structuredClone(baseEvent);

    // Act & Assess
    expect(() => DefineAuthChallengeTriggerSchema.parse(event)).toThrow();
  });

  it('parses a valid create auth challenge event', () => {
    // Prepare
    const event = structuredClone(baseEvent);
    event.triggerSource = 'CreateAuthChallenge_Authentication';
    event.request = {
      userAttributes: {
        sub: '42051434-5091-70ec-4b71-7c26db407ea4',
        'cognito:user_status': 'CONFIRMED',
      },
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
    };

    // Act
    const result = CreateAuthChallengeTriggerSchema.parse(event);

    // Assess
    expect(result).toEqual(event);
  });

  it('throws if the create auth challenge event is missing a required field', () => {
    // Prepare
    const event = structuredClone(baseEvent);

    // Act & Assess
    expect(() => CreateAuthChallengeTriggerSchema.parse(event)).toThrow();
  });

  it('parses a valid verify auth challenge event', () => {
    // Prepare
    const event = structuredClone(baseEvent);
    event.triggerSource = 'VerifyAuthChallengeResponse_Authentication';
    event.request = {
      userAttributes: {
        sub: '42051434-5091-70ec-4b71-7c26db407ea4',
        'cognito:user_status': 'CONFIRMED',
      },
      privateChallengeParameters: { answer: 'expectedAnswer' },
      challengeAnswer: 'expectedAnswer',
      clientMetadata: { key: 'value' },
      userNotFound: false,
    };
    event.response = {
      answerCorrect: true,
    };

    // Act
    const result = VerifyAuthChallengeTriggerSchema.parse(event);

    // Assess
    expect(result).toEqual(event);
  });

  it('throws if the verify auth challenge event is missing a required field', () => {
    // Prepare
    const event = structuredClone(baseEvent);

    // Act & Assess
    expect(() => VerifyAuthChallengeTriggerSchema.parse(event)).toThrow();
  });

  it('parses a valid pre-token generation event v1', () => {
    // Prepare
    const event = structuredClone(baseEvent);
    event.request = {
      userAttributes: {
        sub: '42051434-5091-70ec-4b71-7c26db407ea4',
        'cognito:user_status': 'CONFIRMED',
      },
      groupConfiguration: {
        groupsToOverride: ['group1', 'group2'],
        iamRolesToOverride: ['role1', 'role2'],
        preferredRole: 'role1',
      },
      clientMetadata: { key: 'value' },
    };

    // Act
    const result = PreTokenGenerationTriggerSchemaV1.parse(event);

    // Assess
    expect(result).toEqual(event);
  });

  it('throws if the pre-token generation event v1 is missing a required field', () => {
    // Prepare
    const event = structuredClone(baseEvent);

    // Act & Assess
    expect(() => PreTokenGenerationTriggerSchemaV1.parse(event)).toThrow();
  });
});
