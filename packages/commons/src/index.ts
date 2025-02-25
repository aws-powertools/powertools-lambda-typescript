import { PT_VERSION } from './version.js';
if (!process.env.AWS_SDK_UA_APP_ID) {
  process.env.AWS_SDK_UA_APP_ID = `PT/NO-OP/${PT_VERSION}`;
}
export { PT_VERSION } from './version.js';
export {
  isRecord,
  isString,
  isNumber,
  isIntegerNumber,
  isTruthy,
  isNull,
  isNullOrUndefined,
  getType,
  isStrictEqual,
} from './typeUtils.js';
export { Utility } from './Utility.js';
export { EnvironmentVariablesService } from './config/EnvironmentVariablesService.js';
export { addUserAgentMiddleware, isSdkClient } from './awsSdkUtils.js';
export { cleanupMiddlewares } from './middleware/cleanupMiddlewares.js';
export {
  TRACER_KEY,
  LOGGER_KEY,
  METRICS_KEY,
  IDEMPOTENCY_KEY,
} from './middleware/constants.js';
