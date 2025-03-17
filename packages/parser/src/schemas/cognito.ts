import { z } from 'zod';

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
