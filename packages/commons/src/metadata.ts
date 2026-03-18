import { getStringFromEnv, isDevMode } from './envUtils.js';

const metadataCache: Record<string, unknown> = {};

const clearMetadataCache = () => {
  for (const key of Object.keys(metadataCache)) {
    delete metadataCache[key];
  }
};

/**
 * Fetches metadata from the AWS Lambda Metadata endpoint.
 *
 * When not running in a Lambda environment (e.g., during local development), it returns an empty object.
 */
const getMetadata = async () => {
  const initType = getStringFromEnv({
    key: 'AWS_LAMBDA_INITIALIZATION_TYPE',
    defaultValue: 'unknown',
  });

  if (isDevMode() || initType === 'unknown') {
    return {};
  }

  if (Object.keys(metadataCache).length > 0) {
    return metadataCache;
  }

  const metadataBaseUrl = getStringFromEnv({ key: 'AWS_LAMBDA_METADATA_API' });
  const metadataToken = getStringFromEnv({ key: 'AWS_LAMBDA_METADATA_TOKEN' });

  const res = await fetch(
    `http://${metadataBaseUrl}/2026-01-15/metadata/execution-environment`,
    {
      headers: {
        Authorization: `Bearer ${metadataToken}`,
      },
      signal: AbortSignal.timeout(1000),
    }
  );
  if (!res.ok) {
    throw new Error(
      `Failed to fetch execution environment metadata: ${res.status} ${res.statusText}`
    );
  }
  const data = await res.json();
  Object.assign(metadataCache, data);
  return metadataCache;
};

export { clearMetadataCache, getMetadata };
