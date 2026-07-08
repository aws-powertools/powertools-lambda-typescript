import { SigV4Signer } from '@aws-lambda-powertools/signer/sigv4';

const signer = new SigV4Signer({
  service: 'execute-api',
  region: 'eu-west-1', // (1)!
});

export const handler = async () => {
  const signed = await signer.sign(
    'https://example.execute-api.eu-west-1.amazonaws.com/items'
  );

  await fetch(signed);
};

export { signer };
