import { DataMasking } from '@aws-lambda-powertools/data-masking';
import type { EncryptionProvider } from '@aws-lambda-powertools/data-masking/types';
import { expect, it } from 'vitest';

const mockProvider: EncryptionProvider = {
  encrypt: async (data: string) => `ENC:${data}`,
  decrypt: async (data: string) => data.replace('ENC:', ''),
};

const masker = new DataMasking({ provider: mockProvider });

it('encrypts and decrypts fields', async () => {
  const data = { secret: 'value', public: 'visible' };

  const encrypted = await masker.encrypt(data, { fields: ['secret'] });
  const decrypted = await masker.decrypt(encrypted, { fields: ['secret'] });

  expect(decrypted).toEqual(data);
});
