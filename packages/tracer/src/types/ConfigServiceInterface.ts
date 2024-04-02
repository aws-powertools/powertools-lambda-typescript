import type { ConfigServiceInterface as ConfigServiceBaseInterface } from '@aws-lambda-powertools/commons/types';

/**
 * Interface ConfigServiceInterface
 *
 * @interface
 * @see https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars.html#configuration-envvars-runtime
 * @see https://docs.powertools.aws.dev/lambda/typescript/latest/#environment-variables
 */
interface ConfigServiceInterface extends ConfigServiceBaseInterface {
  /**
   * It returns the value of the AWS_EXECUTION_ENV environment variable.
   *
   * @returns {string}
   */
  getAwsExecutionEnv(): string;

  /**
   * It returns the value of the POWERTOOLS_TRACER_CAPTURE_HTTPS_REQUESTS environment variable.
   *
   * @returns {string}
   */
  getCaptureHTTPsRequests(): string;

  /**
   * It returns the value of the AWS_SAM_LOCAL environment variable.
   *
   * @returns {string}
   */
  getSamLocal(): string;

  /**
   * It returns the value of the POWERTOOLS_TRACE_ENABLED environment variable.
   *
   * @returns {string}
   */
  getTracingEnabled(): string;

  /**
   * It returns the value of the POWERTOOLS_TRACER_CAPTURE_RESPONSE environment variable.
   *
   * @returns {string}
   */
  getTracingCaptureResponse(): string;

  /**
   * It returns the value of the POWERTOOLS_TRACER_CAPTURE_ERROR environment variable.
   *
   * @returns {string}
   */
  getTracingCaptureError(): string;
}

export type { ConfigServiceInterface };
