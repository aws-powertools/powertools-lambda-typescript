import { AWSEncryptionSDKProvider } from '@aws-lambda-powertools/data-masking/providers/kms';

export const provider = new AWSEncryptionSDKProvider({
  keys: [process.env.KMS_KEY_ARN_1 ?? '', process.env.KMS_KEY_ARN_2 ?? ''],
});
