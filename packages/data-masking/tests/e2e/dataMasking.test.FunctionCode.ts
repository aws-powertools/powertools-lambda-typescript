import { DataMasking } from '../../src/index.js';
import { AWSEncryptionSDKProvider } from '../../src/providers/kms/index.js';

const provider = new AWSEncryptionSDKProvider({
  keys: [process.env.KMS_KEY_ARN ?? ''],
});
const masker = new DataMasking({ provider });
const maskerNoProvider = new DataMasking();

export const handlerErase = (
  event: Record<string, unknown>
): Promise<Record<string, unknown>> => {
  return Promise.resolve(
    maskerNoProvider.erase(event, {
      fields: ['customer.ssn', 'payment.card'],
    })
  );
};

export const handlerFieldEncrypt = async (
  event: Record<string, unknown>
): Promise<Record<string, unknown>> => {
  const encrypted = await masker.encrypt(event, {
    fields: ['customer.ssn', 'payment.card'],
    context: { purpose: 'e2e-test' },
  });

  return masker.decrypt<Record<string, unknown>>(encrypted, {
    fields: ['customer.ssn', 'payment.card'],
    context: { purpose: 'e2e-test' },
  });
};

export const handlerFullEncrypt = async (
  event: Record<string, unknown>
): Promise<Record<string, unknown>> => {
  const encrypted = await masker.encrypt(event, {
    context: { purpose: 'e2e-test' },
  });

  return masker.decrypt<Record<string, unknown>>(encrypted, {
    context: { purpose: 'e2e-test' },
  });
};

export const handlerContextVerification = async (
  event: Record<string, unknown>
): Promise<Record<string, string>> => {
  const encrypted = await masker.encrypt(event, {
    context: { purpose: 'e2e-test', tenant: 'acme' },
  });

  const attemptDecrypt = async (
    context?: Record<string, string>
  ): Promise<string> => {
    try {
      await masker.decrypt(encrypted, { context });

      return 'decrypted';
    } catch (error) {
      return (error as Error).name;
    }
  };

  return {
    withoutContext: await attemptDecrypt(),
    withEmptyContext: await attemptDecrypt({}),
    withPartialContext: await attemptDecrypt({ purpose: 'e2e-test' }),
    withDifferentValue: await attemptDecrypt({
      purpose: 'e2e-test',
      tenant: 'other',
    }),
    withUnknownKey: await attemptDecrypt({
      purpose: 'e2e-test',
      tenant: 'acme',
      region: 'eu',
    }),
    withSameContext: await attemptDecrypt({
      purpose: 'e2e-test',
      tenant: 'acme',
    }),
  };
};
