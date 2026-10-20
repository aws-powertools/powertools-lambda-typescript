declare const encrypted: Record<string, unknown>;

import { DataMasking } from '@aws-lambda-powertools/data-masking';
import { AWSEncryptionSDKProvider } from '@aws-lambda-powertools/data-masking/providers/kms';

const provider = new AWSEncryptionSDKProvider({
  keys: [process.env.KMS_KEY_ARN ?? ''],
});
const masker = new DataMasking({ provider });

export const decrypted = await masker.decrypt(encrypted, {
  fields: ['customer.ssn'],
  context: {
    tenantId: 'acme',
    classification: 'confidential',
  }, // (1)!
});
