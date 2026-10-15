import { POWERTOOLS_SDK_UA_APP_ID_DISABLED_ENV_VAR } from './constants.js';
import { getBooleanFromEnv } from './envUtils.js';
import { PT_VERSION } from './version.js';

/**
 * Checks whether the `POWERTOOLS_SDK_UA_APP_ID_DISABLED` environment variable opts out of adding the Powertools marker to `AWS_SDK_UA_APP_ID`.
 *
 * Invalid values are treated as `false`, since this runs at module load and must never throw.
 *
 * @internal
 */
const isSdkUaAppIdDisabled = (): boolean => {
  try {
    return getBooleanFromEnv({
      key: POWERTOOLS_SDK_UA_APP_ID_DISABLED_ENV_VAR,
      defaultValue: false,
      extendedParsing: true,
    });
  } catch {
    return false;
  }
};

const env = process.env.AWS_EXECUTION_ENV || 'NA';
if (
  !isSdkUaAppIdDisabled() &&
  !process.env.AWS_SDK_UA_APP_ID?.includes('/PTEnv/')
) {
  const ptUserAgent = `PT/NO-OP/${PT_VERSION}/PTEnv/${env}`;
  process.env.AWS_SDK_UA_APP_ID = process.env.AWS_SDK_UA_APP_ID
    ? `${process.env.AWS_SDK_UA_APP_ID}/${ptUserAgent}`
    : ptUserAgent;
}

export { addUserAgentMiddleware, isSdkClient } from './awsSdkUtils.js';
export { deepMerge } from './deepMerge.js';
export { cleanupMiddlewares } from './middleware/cleanupMiddlewares.js';
export {
  IDEMPOTENCY_KEY,
  LOGGER_KEY,
  METRICS_KEY,
  TRACER_KEY,
} from './middleware/constants.js';
export {
  getType,
  isIntegerNumber,
  isNull,
  isNullOrUndefined,
  isNumber,
  isRecord,
  isRegExp,
  isStrictEqual,
  isString,
  isStringUndefinedNullEmpty,
  isTruthy,
} from './typeUtils.js';
export { Utility } from './Utility.js';
export { PT_VERSION } from './version.js';
