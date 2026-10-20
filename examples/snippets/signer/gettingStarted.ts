import { SigV4Signer } from '@aws-lambda-powertools/signer/sigv4';

const signer = new SigV4Signer({ service: 'execute-api' });

export const handler = async () => {
  const signed = await signer.sign(
    'https://example.execute-api.us-east-1.amazonaws.com/items'
  );

  // `signed` is a standard `Request` with the SigV4 headers added
  const response = await fetch(signed);
  await response.json();
};
