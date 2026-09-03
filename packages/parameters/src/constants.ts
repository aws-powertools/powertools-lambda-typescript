const DEFAULT_MAX_AGE_SECS = 5;
const TRANSFORM_METHOD_JSON = 'json';
const TRANSFORM_METHOD_BINARY = 'binary';
const TRANSFORM_METHOD_AUTO = 'auto';
const APPCONFIG_TOKEN_EXPIRATION = 23 * 60 * 60 * 1000 + 45 * 60 * 1000; // 23 hrs 45 min

/**
 * Transform methods for values retrieved by parameter providers.
 */
const Transform = {
  /**
   * Transform the retrieved value using `JSON.parse`.
   */
  JSON: TRANSFORM_METHOD_JSON,
  /**
   * Transform a base64-encoded value from `Uint8Array` to `string`.
   */
  BINARY: TRANSFORM_METHOD_BINARY,
  /**
   * Automatically detect the transform method based on the parameter' name suffix.
   */
  AUTO: TRANSFORM_METHOD_AUTO,
} as const;

/**
 * Kinds of request that share the cache, used as the first component of a cache key.
 */
const CacheKeyKind = {
  /** A request for a single value. */
  GET: 'get',
  /** A request for multiple values under a path. */
  GET_MULTIPLE: 'getMultiple',
} as const;

/**
 * Kind of request a cache key belongs to, see {@link CacheKeyKind}.
 */
type CacheKeyKindOptions = (typeof CacheKeyKind)[keyof typeof CacheKeyKind];

export type { CacheKeyKindOptions };

export {
  APPCONFIG_TOKEN_EXPIRATION,
  CacheKeyKind,
  DEFAULT_MAX_AGE_SECS,
  TRANSFORM_METHOD_AUTO,
  TRANSFORM_METHOD_BINARY,
  TRANSFORM_METHOD_JSON,
  Transform,
};
