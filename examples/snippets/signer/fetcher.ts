import { createSignedFetcher } from '@aws-lambda-powertools/signer/fetch';
import { SigV4Signer } from '@aws-lambda-powertools/signer/sigv4';

const signer = new SigV4Signer({ service: 'execute-api' });
const signedFetch = createSignedFetcher(signer);

export const handler = async () => {
  // `signedFetch` is a drop-in `fetch` that signs each request before sending it
  const response = await signedFetch(
    'https://example.execute-api.us-east-1.amazonaws.com/items',
    {
      method: 'POST',
      body: JSON.stringify({ name: 'powertools' }),
    }
  );

  await response.json();
};
