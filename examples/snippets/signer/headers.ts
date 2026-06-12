import { SigV4Signer } from '@aws-lambda-powertools/signer/sigv4';

const signer = new SigV4Signer({ service: 'execute-api' });

export const handler = async () => {
  const signed = await signer.sign(
    'https://example.execute-api.us-east-1.amazonaws.com/items',
    { method: 'POST', body: JSON.stringify({ name: 'powertools' }) }
  );

  // Extract the signed headers to use them with any HTTP client, e.g. an
  // interceptor for axios, got, or a generated SDK client.
  const headers: Record<string, string> = {};
  for (const [key, value] of signed.headers) {
    headers[key] = value;
  }

  // `signed.url`, `signed.method`, and `headers` can now be passed to the
  // client of your choice.
};
