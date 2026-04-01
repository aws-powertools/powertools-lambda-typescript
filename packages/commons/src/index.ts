import { PT_VERSION } from './version.js';

const env = process.env.AWS_EXECUTION_ENV || 'NA';
const POWETOOLS_NOOP_UA = `PT/NO-OP/${PT_VERSION}/PTEnv/${env}`;
const AWS_SDK_UA_APP_ID_MAX_LENGTH = 50;

const currentUserAgentAppId = process.env.AWS_SDK_UA_APP_ID?.trim();
const nextUserAgentAppId = currentUserAgentAppId?.includes('PT/NO-OP')
  ? currentUserAgentAppId
  : currentUserAgentAppId
    ? `${currentUserAgentAppId}/${POWETOOLS_NOOP_UA}`
    : POWETOOLS_NOOP_UA;

process.env.AWS_SDK_UA_APP_ID = nextUserAgentAppId.slice(
  0,
  AWS_SDK_UA_APP_ID_MAX_LENGTH
);

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
