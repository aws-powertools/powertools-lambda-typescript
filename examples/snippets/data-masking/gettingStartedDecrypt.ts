import { DataMasking } from '@aws-lambda-powertools/data-masking';
import { AWSEncryptionSDKProvider } from '@aws-lambda-powertools/data-masking/providers/kms';

const provider = new AWSEncryptionSDKProvider({
  keys: [process.env.KMS_KEY_ARN ?? ''], // (1)!
});
const masker = new DataMasking({ provider });

export const handler = async (event: { body: string }) => {
  const data = event.body;

  const decrypted = await masker.decrypt(data);

  return decrypted;
};
