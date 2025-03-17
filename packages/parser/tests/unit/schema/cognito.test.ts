import { describe, expect, it } from 'vitest';
import { PreSignupTriggerSchema } from '../../../src/schemas/cognito.js';
import { omit } from '../helpers/utils.js';

describe('Schema: Cognito PreSignupTrigger', () => {
  // Prepare
  const baseEvent = {
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
    },
    response: {
      autoConfirmUser: true,
      autoVerifyEmail: false,
      autoVerifyPhone: false,
    },
  };

  it('parses a valid pre-signup event', () => {
    // Prepare
    const event = structuredClone(baseEvent);
    // Act
    const result = PreSignupTriggerSchema.safeParse(event);
    // Assess
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.userName).toEqual('johndoe');
    }
  });

  it('throws if the event is missing a required field', () => {
    // Prepare
    const event = omit(['userName'], structuredClone(baseEvent));
    // Act & Assess
    expect(() => PreSignupTriggerSchema.parse(event)).toThrow();
  });
});
