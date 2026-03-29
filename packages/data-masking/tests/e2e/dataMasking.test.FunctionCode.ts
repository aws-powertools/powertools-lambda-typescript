import { DataMasking } from '../../src/index.js';
import { AWSEncryptionSDKProvider } from '../../src/provider/index.js';

const provider = new AWSEncryptionSDKProvider({
  keys: [process.env.KMS_KEY_ARN ?? ''],
});
const masker = new DataMasking({ provider });
const maskerNoProvider = new DataMasking();

export const handlerErase = (
  event: Record<string, unknown>
): Record<string, unknown> => {
  return maskerNoProvider.erase(event, {
    fields: ['customer.ssn', 'payment.card'],
  });
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
