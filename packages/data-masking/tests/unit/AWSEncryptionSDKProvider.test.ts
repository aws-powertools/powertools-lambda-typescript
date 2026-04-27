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

  it('decrypt throws on encryption context mismatch', async () => {
    const provider = new AWSEncryptionSDKProvider({
      keys: ['arn:aws:kms:us-east-1:123456789012:key/test-key'],
    });

    const encrypted = await provider.encrypt('secret');

    await expect(
      provider.decrypt(encrypted, { tenantId: 'acme' })
    ).rejects.toThrow("Encryption context mismatch for key 'tenantId'");
  });

  it('decrypt succeeds when encryption context matches', async () => {
    const { buildDecrypt } = await import('@aws-crypto/client-node');
    const { decrypt: mockDecrypt } = buildDecrypt();
    (mockDecrypt as ReturnType<typeof vi.fn>).mockImplementationOnce(
      async (_cmm: unknown, ciphertext: Uint8Array) => ({
        plaintext: ciphertext,
        messageHeader: { encryptionContext: { tenantId: 'acme' } },
      })
    );

    const provider = new AWSEncryptionSDKProvider({
      keys: ['arn:aws:kms:us-east-1:123456789012:key/test-key'],
    });

    const encrypted = await provider.encrypt('secret');
    const decrypted = await provider.decrypt(encrypted, { tenantId: 'acme' });
    expect(decrypted).toBe('secret');
  });
});
