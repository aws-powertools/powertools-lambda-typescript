import { AWSEncryptionSDKProvider } from '@aws-lambda-powertools/data-masking/providers/kms';

export const provider = new AWSEncryptionSDKProvider({
  keys: [process.env.KMS_KEY_ARN ?? ''],
  localCacheCapacity: 200,
  maxCacheAgeSeconds: 400,
  maxMessagesEncrypted: 200,
  maxBytesEncrypted: 2000,
});
