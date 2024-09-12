/**
 * If the AWS_XRAY_CONTEXT_MISSING environment variable is not set, we set it to IGNORE_ERROR.
 *
 * This is to prevent the AWS X-Ray SDK from logging errors when using top-level await features that make HTTP requests.
 * For example, when using the Parameters utility to fetch parameters during the initialization of the Lambda handler - See #2046
 */
if (
  process.env.AWS_XRAY_CONTEXT_MISSING === '' ||
  process.env.AWS_XRAY_CONTEXT_MISSING === undefined
) {
  process.env.AWS_XRAY_CONTEXT_MISSING = 'IGNORE_ERROR';
}
export { Tracer } from './Tracer.js';
