import { RequestSigningError, SignerError } from '../../src/errors.js';
import { createSignedFetcher } from '../../src/fetch.js';
import { SigV4Signer } from '../../src/sigv4.js';

// region + credentials (incl. AWS_SESSION_TOKEN) are read from the Lambda
// runtime environment variables.
const signer = new SigV4Signer({ service: 'execute-api' });
const signedFetch = createSignedFetcher(signer);

const region = process.env.AWS_REGION as string;

export const handler = async () => {
  const base = process.env.TARGET_API_URL; // .../test/
  if (!base) {
    throw new Error('TARGET_API_URL is not set');
  }

  const getUrl = `${base}items`;
  const postUrl = `${base}items`;
  const queryUrl = `${base}items?foo=bar&baz=qux`;

  const results: Record<string, unknown> = {};

  // 1) Unsigned GET -> expect 403 (proves IAM auth is enforced).
  results.unsignedGet = (await fetch(getUrl)).status;

  // 2) Signed GET via createSignedFetcher -> expect 200.
  results.signedFetcherGet = (await signedFetch(getUrl)).status;

  // 3) Signed GET via sign() + standard fetch -> expect 200.
  results.signedManualGet = (await fetch(await signer.sign(getUrl))).status;

  // 4) Signed POST with a JSON body (exercises body buffering + hashing).
  results.signedPost = (
    await signedFetch(postUrl, {
      method: 'POST',
      body: JSON.stringify({ hello: 'world' }),
      headers: { 'content-type': 'application/json' },
    })
  ).status;

  // 5) Signed GET with query-string params (params participate in the canonical request).
  results.signedQuery = (await signedFetch(queryUrl)).status;

  // 6) Reuse the same signer instance across several requests (no state leak).
  const reuse = await Promise.all([
    signedFetch(getUrl),
    signedFetch(getUrl),
    signedFetch(getUrl),
  ]);
  results.signerReuseAllOk = reuse.every((r) => r.status === 200);

  // 7) Drop-in fetch: pass createSignedFetcher's result to code that expects `typeof fetch`.
  const makeClient = (fetchImpl: typeof fetch) => ({
    get: (u: string) => fetchImpl(u),
  });
  results.dropInClientGet = (await makeClient(signedFetch).get(getUrl)).status;

  // 8) Explicit, correct region -> still signs successfully (200).
  const explicitRegionSigner = new SigV4Signer({
    service: 'execute-api',
    region,
  });
  results.explicitRegionGet = (
    await fetch(await explicitRegionSigner.sign(getUrl))
  ).status;

  // 9) Wrong region -> signature computed for the wrong scope -> expect 403.
  const wrongRegion = region === 'us-east-1' ? 'us-west-2' : 'us-east-1';
  const wrongRegionSigner = new SigV4Signer({
    service: 'execute-api',
    region: wrongRegion,
  });
  results.wrongRegionGet = (
    await fetch(await wrongRegionSigner.sign(getUrl))
  ).status;

  // 10) Explicit (static) credentials path instead of the runtime env default.
  const staticSigner = new SigV4Signer({
    service: 'execute-api',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
      sessionToken: process.env.AWS_SESSION_TOKEN,
    },
  });
  results.staticCredentialsGet = (
    await fetch(await staticSigner.sign(getUrl))
  ).status;

  // 11) RequestSigningError on a body that cannot be read (a stream that errors mid-read).
  try {
    const stream = new ReadableStream({
      pull(controller) {
        controller.error(new Error('stream read failure'));
      },
    });
    await signer.sign(postUrl, {
      method: 'POST',
      body: stream,
      duplex: 'half',
    } as RequestInit);
    results.streamingError = 'NO_ERROR_THROWN';
  } catch (err) {
    results.streamingError =
      err instanceof RequestSigningError ? 'RequestSigningError' : String(err);
    results.streamingErrorIsSignerError = err instanceof SignerError;
  }

  // Log the structured result so the e2e test can parse it from CloudWatch.
  console.log(JSON.stringify(results));

  return results;
};
