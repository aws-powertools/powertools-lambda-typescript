import { createSignedFetcher } from '@aws-lambda-powertools/signer/fetch';
import { SigV4aSigner } from '@aws-lambda-powertools/signer/sigv4a';

const signer = new SigV4aSigner({
  service: 's3',
  regionSet: ['us-east-1', 'us-west-2'],
});
const signedFetch = createSignedFetcher(signer);

export const handler = async () => {
  const response = await signedFetch(
    'https://example.mrap.accesspoint.s3-global.amazonaws.com/object'
  );

  return response.text();
};
