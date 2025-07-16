import { PT_VERSION } from './version.js';

if (!process.env.AWS_SDK_UA_APP_ID) {
  process.env.AWS_SDK_UA_APP_ID = `PT/NO-OP/${PT_VERSION}`;
}

export { addUserAgentMiddleware, isSdkClient } from './awsSdkUtils.js';
export { EnvironmentVariablesService } from './config/EnvironmentVariablesService.js';
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
  isStrictEqual,
  isString,
  isStringUndefinedNullEmpty,
  isTruthy,
} from './typeUtils.js';
export { Utility } from './Utility.js';
export { PT_VERSION } from './version.js';
