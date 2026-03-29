import { describe, expect, it, vi } from 'vitest';
import { AWSEncryptionSDKProvider } from '../../src/provider/AWSEncryptionSDKProvider.js';

vi.mock('@aws-crypto/client-node', () => {
  const mockEncrypt = vi.fn(async (_cmm: unknown, plaintext: Uint8Array) => ({
    result: plaintext,
  }));
  const mockDecrypt = vi.fn(async (_cmm: unknown, ciphertext: Uint8Array) => ({
    plaintext: ciphertext,
    messageHeader: { encryptionContext: {} },
  }));

  const MockKmsKeyringNode = vi.fn();
  const MockNodeCachingMaterialsManager = vi.fn();

  return {
    buildEncrypt: () => ({ encrypt: mockEncrypt }),
    buildDecrypt: () => ({ decrypt: mockDecrypt }),
    KmsKeyringNode: MockKmsKeyringNode,
    getLocalCryptographicMaterialsCache: vi.fn().mockReturnValue({}),
    NodeCachingMaterialsManager: MockNodeCachingMaterialsManager,
  };
});

describe('AWSEncryptionSDKProvider', () => {
  it('can be instantiated with keys', () => {
    const provider = new AWSEncryptionSDKProvider({
      keys: ['arn:aws:kms:us-east-1:123456789012:key/test-key'],
    });

    expect(provider).toBeDefined();
  });

  it('encrypt returns a base64 string', async () => {
    const provider = new AWSEncryptionSDKProvider({
      keys: ['arn:aws:kms:us-east-1:123456789012:key/test-key'],
    });

    const result = await provider.encrypt('test data');
    expect(typeof result).toBe('string');
    expect(() => Buffer.from(result, 'base64')).not.toThrow();
  });

  it('decrypt returns the original string', async () => {
    const provider = new AWSEncryptionSDKProvider({
      keys: ['arn:aws:kms:us-east-1:123456789012:key/test-key'],
    });

    const encrypted = await provider.encrypt('hello world');
    const decrypted = await provider.decrypt(encrypted);
    expect(decrypted).toBe('hello world');
  });
});
