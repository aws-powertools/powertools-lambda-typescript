import { SigV4Signer } from '@aws-lambda-powertools/signer/sigv4';

// By default, credentials are read from the standard AWS environment variables
// that the Lambda runtime injects. When running outside of Lambda, pass your
// own credentials or a credential provider, for example
// `fromNodeProviderChain()` from `@aws-sdk/credential-provider-node`.
const signer = new SigV4Signer({
  service: 'execute-api',
  credentials: {
    accessKeyId: process.env.MY_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.MY_SECRET_ACCESS_KEY ?? '',
  },
});

export const handler = async () => {
  const signed = await signer.sign(
    'https://example.execute-api.us-east-1.amazonaws.com/items'
  );

  await fetch(signed);
};
