import { describe, expect, it, vi } from 'vitest';
import { DataMaskingEncryptionError } from '../../src/errors.js';
import { AWSEncryptionSDKProvider } from '../../src/providers/kms/AWSEncryptionSDKProvider.js';

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

const createProvider = () =>
  new AWSEncryptionSDKProvider({
    keys: ['arn:aws:kms:us-east-1:123456789012:key/test-key'],
  });

/**
 * Makes the next `decrypt` call return the given encryption context, as the
 * AWS Encryption SDK does when it reads it back from the message header.
 */
const stubStoredContext = async (context: Record<string, string>) => {
  const { buildDecrypt } = await import('@aws-crypto/client-node');
  const { decrypt: mockDecrypt } = buildDecrypt();
  (mockDecrypt as ReturnType<typeof vi.fn>).mockImplementationOnce(
    async (_cmm: unknown, ciphertext: Uint8Array) => ({
      plaintext: ciphertext,
      messageHeader: { encryptionContext: context },
    })
  );
};

describe('AWSEncryptionSDKProvider', () => {
  it('can be instantiated with keys', () => {
    // Prepare & Act
    const provider = createProvider();

    // Assess
    expect(provider).toBeDefined();
  });

  it('encrypt returns a base64 string', async () => {
    // Prepare
    const provider = createProvider();

    // Act
    const result = await provider.encrypt('test data');

    // Assess
    expect(typeof result).toBe('string');
    expect(() => Buffer.from(result, 'base64')).not.toThrow();
  });

  it('encrypt passes the context to the AWS Encryption SDK', async () => {
    // Prepare
    const { buildEncrypt } = await import('@aws-crypto/client-node');
    const { encrypt: mockEncrypt } = buildEncrypt();
    const provider = createProvider();

    // Act
    await provider.encrypt('secret', { tenantId: 'acme' });

    // Assess
    expect(mockEncrypt).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.any(Uint8Array),
      { encryptionContext: { tenantId: 'acme' } }
    );
  });

  it('encrypt throws when the context uses a reserved key', async () => {
    // Prepare
    const provider = createProvider();

    // Act & Assess
    await expect(
      provider.encrypt('secret', {
        'aws-crypto-public-key': 'spoofed',
        tenantId: 'acme',
      })
    ).rejects.toThrow(
      new DataMaskingEncryptionError(
        "Encryption context keys starting with 'aws-crypto-' are reserved by the AWS Encryption SDK: 'aws-crypto-public-key'"
      )
    );
  });

  it('decrypt returns the original string', async () => {
    // Prepare
    const provider = createProvider();
    const encrypted = await provider.encrypt('hello world');

    // Act
    const decrypted = await provider.decrypt(encrypted);

    // Assess
    expect(decrypted).toBe('hello world');
  });

  it('decrypt succeeds when the encryption context matches', async () => {
    // Prepare
    const provider = createProvider();
    const encrypted = await provider.encrypt('secret');
    await stubStoredContext({ tenantId: 'acme', classification: 'pii' });

    // Act
    const decrypted = await provider.decrypt(encrypted, {
      classification: 'pii',
      tenantId: 'acme',
    });

    // Assess
    expect(decrypted).toBe('secret');
  });

  it('decrypt ignores the keys reserved by the AWS Encryption SDK', async () => {
    // Prepare
    const provider = createProvider();
    const encrypted = await provider.encrypt('secret');
    await stubStoredContext({
      'aws-crypto-public-key': 'A4owK3...',
      tenantId: 'acme',
    });

    // Act
    const decrypted = await provider.decrypt(encrypted, {
      'aws-crypto-public-key': 'not verified by us',
      tenantId: 'acme',
    });

    // Assess
    expect(decrypted).toBe('secret');
  });

  it.each([
    {
      case: 'no context is provided',
      context: undefined,
    },
    {
      case: 'an empty context is provided',
      context: {},
    },
  ])('decrypt throws when $case', async ({ context }) => {
    // Prepare
    const provider = createProvider();
    const encrypted = await provider.encrypt('secret');
    await stubStoredContext({
      'aws-crypto-public-key': 'A4owK3...',
      tenantId: 'acme',
    });

    // Act & Assess
    await expect(provider.decrypt(encrypted, context)).rejects.toThrow(
      new DataMaskingEncryptionError(
        "Encryption context mismatch (missing keys 'tenantId'). You must provide the same encryption context used to encrypt the data."
      )
    );
  });

  it('decrypt throws when the context is missing some of the stored keys', async () => {
    // Prepare
    const provider = createProvider();
    const encrypted = await provider.encrypt('secret');
    await stubStoredContext({
      classification: 'pii',
      region: 'eu',
      tenantId: 'acme',
    });

    // Act & Assess
    await expect(
      provider.decrypt(encrypted, { tenantId: 'acme' })
    ).rejects.toThrow(
      new DataMaskingEncryptionError(
        "Encryption context mismatch (missing keys 'classification', 'region'). You must provide the same encryption context used to encrypt the data."
      )
    );
  });

  it('decrypt throws when a provided value differs from the stored one', async () => {
    // Prepare
    const provider = createProvider();
    const encrypted = await provider.encrypt('secret');
    await stubStoredContext({ tenantId: 'acme' });

    // Act & Assess
    await expect(
      provider.decrypt(encrypted, { tenantId: 'other' })
    ).rejects.toThrow(
      new DataMaskingEncryptionError(
        "Encryption context mismatch (different values for keys 'tenantId'). You must provide the same encryption context used to encrypt the data."
      )
    );
  });

  it('decrypt throws when the context has keys that were not stored', async () => {
    // Prepare
    const provider = createProvider();
    const encrypted = await provider.encrypt('secret');
    await stubStoredContext({ tenantId: 'acme' });

    // Act & Assess
    await expect(
      provider.decrypt(encrypted, { tenantId: 'acme', classification: 'pii' })
    ).rejects.toThrow(
      new DataMaskingEncryptionError(
        "Encryption context mismatch (unknown keys 'classification'). You must provide the same encryption context used to encrypt the data."
      )
    );
  });

  it('decrypt reports every mismatching key without leaking values', async () => {
    // Prepare
    const provider = createProvider();
    const encrypted = await provider.encrypt('secret');
    await stubStoredContext({
      classification: 'pii',
      'aws-crypto-public-key': 'A4owK3...',
      tenantId: 'acme',
    });

    // Act & Assess
    await expect(
      provider.decrypt(encrypted, { tenantId: 'other', region: 'eu' })
    ).rejects.toThrow(
      new DataMaskingEncryptionError(
        "Encryption context mismatch (missing keys 'classification'; different values for keys 'tenantId'; unknown keys 'region'). You must provide the same encryption context used to encrypt the data."
      )
    );
  });

  it('decrypt succeeds when the data was encrypted without a context', async () => {
    // Prepare
    const provider = createProvider();
    const encrypted = await provider.encrypt('secret');
    await stubStoredContext({ 'aws-crypto-public-key': 'A4owK3...' });

    // Act
    const decrypted = await provider.decrypt(encrypted);

    // Assess
    expect(decrypted).toBe('secret');
  });

  it('decrypt ignores keys inherited from the prototype chain', async () => {
    // Prepare
    const provider = createProvider();
    const encrypted = await provider.encrypt('secret');
    await stubStoredContext({ tenantId: 'acme' });
    const context = Object.create({ classification: 'pii' }) as Record<
      string,
      string
    >;
    context.tenantId = 'acme';

    // Act
    const decrypted = await provider.decrypt(encrypted, context);

    // Assess
    expect(decrypted).toBe('secret');
  });
});
