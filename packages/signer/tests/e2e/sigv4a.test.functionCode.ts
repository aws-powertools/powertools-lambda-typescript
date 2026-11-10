import { getStringFromEnv } from '@aws-lambda-powertools/commons/utils/env';
import { createSignedFetcher } from '../../src/fetch.js';
import { SigV4aSigner } from '../../src/sigv4a.js';

const signer = new SigV4aSigner({ service: 's3', regionSet: ['*'] });
const signedFetch = createSignedFetcher(signer);

/**
 * Exercises SigV4a using Lambda execution-role credentials against live S3.
 */
export const handler = async () => {
  const base = getStringFromEnv({ key: 'TARGET_MRAP_URL' });
  const region = getStringFromEnv({ key: 'AWS_REGION' });
  const url = `${base}/plain.txt`;
  const payload = 'Powertools SigV4a E2E payload';
  const putResponse = await signedFetch(url, { method: 'PUT', body: payload });
  await putResponse.arrayBuffer();
  const getResponse = await fetch(await signer.sign(url));
  const body = await getResponse.text();
  const unsigned = await fetch(url);
  await unsigned.arrayBuffer();

  const explicit = new SigV4aSigner({ service: 's3', regionSet: [region] });
  const explicitResponse = await fetch(await explicit.sign(url));
  await explicitResponse.arrayBuffer();
  const pattern = new SigV4aSigner({
    service: 's3',
    regionSet: [`${region.split('-')[0]}-*`],
  });
  const patternResponse = await fetch(await pattern.sign(url));
  await patternResponse.arrayBuffer();
  const excludedRegion = region === 'us-east-1' ? 'eu-west-1' : 'us-east-1';
  const excluded = new SigV4aSigner({
    service: 's3',
    regionSet: [excludedRegion],
  });
  const excludedResponse = await fetch(await excluded.sign(url));
  await excludedResponse.arrayBuffer();

  const keyResults: {
    path: string;
    put: number;
    get: number;
    bodyMatches: boolean;
  }[] = [];
  for (const path of [
    'folder//photo%20%281%29%21.jpg',
    'folder/plus%2Bquote%27%2A%28%29%21%2C%24%26%3D%3B%3A%40~~',
    'folder/a/b%252Fc/%E2%98%83',
  ]) {
    const keyUrl = `${base}/${path}`;
    const signedPut = await signedFetch(keyUrl, {
      method: 'PUT',
      body: payload,
    });
    await signedPut.arrayBuffer();
    const signedGet = await signedFetch(keyUrl);
    keyResults.push({
      path,
      put: signedPut.status,
      get: signedGet.status,
      bodyMatches: (await signedGet.text()) === payload,
    });
  }

  const queryResponse = await signedFetch(`${url}?foo=bar&baz=qux`);
  await queryResponse.arrayBuffer();
  const reusedResponses = await Promise.all([
    signedFetch(url),
    signedFetch(url),
    signedFetch(url),
  ]);
  for (const response of reusedResponses) await response.arrayBuffer();

  const results = {
    sigv4a: true,
    put: putResponse.status,
    get: getResponse.status,
    bodyMatches: body === payload,
    unsigned: unsigned.status,
    explicitRegion: explicitResponse.status,
    regionPattern: patternResponse.status,
    excludedRegion: excludedResponse.status,
    keyResults,
    query: queryResponse.status,
    reuseAllOk: reusedResponses.every((response) => response.status === 200),
  };
  console.log(JSON.stringify(results));
  return results;
};
