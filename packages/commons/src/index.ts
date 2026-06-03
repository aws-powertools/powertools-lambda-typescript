import { PT_VERSION } from './version.js';

const env = process.env.AWS_EXECUTION_ENV || 'NA';
if (!process.env.AWS_SDK_UA_APP_ID?.includes('/PTEnv/')) {
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
