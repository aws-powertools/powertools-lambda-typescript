import { createHash, createHmac, createPublicKey, verify } from 'node:crypto';

const credentials = {
  accessKeyId: 'AKIDEXAMPLE',
  secretAccessKey: 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY',
};

// Public key derived from the fixture credentials using the SigV4a KDF
// (SP800-108 counter mode with HMAC-SHA256), independently of Smithy.
const publicKey = createPublicKey({
  key: {
    kty: 'EC',
    crv: 'P-256',
    x: 'tmGPamV0CpnmULM7a0tb0NQ7F21yGj7f6n59LVbZNrE',
    y: 'hl7SKn6tycXLnSy6yhs2mROf7cUEPcZmGGQhgzDI5Rg',
  },
  format: 'jwk',
});

/**
 * Verifies the signature against an independently assembled canonical request.
 *
 * @param signed - The request containing the signature to verify.
 * @param path - The expected canonical path for the service.
 * @param query - The expected canonical query string.
 */
const verifySignature = async (
  signed: Request,
  path: string,
  query = ''
): Promise<boolean> => {
  const authorization = signed.headers.get('authorization') ?? '';
  const [, scope, signedHeaders, signature] =
    authorization.match(
      /^AWS4-(?:ECDSA-P256-SHA256|HMAC-SHA256) Credential=AKIDEXAMPLE\/([^,]+), SignedHeaders=([^,]+), Signature=([a-f0-9]+)$/
    ) ?? [];
  if (!scope || !signedHeaders || !signature) {
    throw new Error('Unexpected AWS authorization header');
  }

  const bodyHash = createHash('sha256')
    .update(Buffer.from(await signed.clone().arrayBuffer()))
    .digest('hex');
  const payloadHash =
    signed.headers.get('x-amz-content-sha256') === 'UNSIGNED-PAYLOAD'
      ? 'UNSIGNED-PAYLOAD'
      : bodyHash;
  const canonicalHeaders = signedHeaders
    .split(';')
    .map(
      (header) =>
        `${header}:${signed.headers.get(header)?.trim().replace(/\s+/g, ' ')}\n`
    )
    .join('');
  const canonicalRequest = [
    signed.method,
    path,
    query,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');
  const stringToSign = [
    authorization.split(' ')[0],
    signed.headers.get('x-amz-date'),
    scope,
    createHash('sha256').update(canonicalRequest).digest('hex'),
  ].join('\n');

  if (authorization.startsWith('AWS4-HMAC-SHA256')) {
    const [date, region, service] = scope.split('/');
    const dateKey = createHmac('sha256', `AWS4${credentials.secretAccessKey}`)
      .update(date)
      .digest();
    const regionKey = createHmac('sha256', dateKey).update(region).digest();
    const serviceKey = createHmac('sha256', regionKey).update(service).digest();
    const signingKey = createHmac('sha256', serviceKey)
      .update('aws4_request')
      .digest();
    return (
      createHmac('sha256', signingKey).update(stringToSign).digest('hex') ===
      signature
    );
  }

  return verify(
    'sha256',
    Buffer.from(stringToSign),
    publicKey,
    Buffer.from(signature, 'hex')
  );
};

export { credentials, verifySignature };
