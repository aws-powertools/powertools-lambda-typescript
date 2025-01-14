import { EnvironmentVariablesService as CommonEnvironmentVariablesService } from '@aws-lambda-powertools/commons';
import type { ConfigServiceInterface } from '../types/ConfigServiceInterface.js';

class EnvironmentVariablesService
  extends CommonEnvironmentVariablesService
  implements ConfigServiceInterface
{
  // Environment variables
  private awsExecutionEnv = 'AWS_EXECUTION_ENV';
  private samLocalVariable = 'AWS_SAM_LOCAL';
  private tracerCaptureErrorVariable = 'POWERTOOLS_TRACER_CAPTURE_ERROR';
  private tracerCaptureHTTPsRequestsVariable =
    'POWERTOOLS_TRACER_CAPTURE_HTTPS_REQUESTS';
  private tracerCaptureResponseVariable = 'POWERTOOLS_TRACER_CAPTURE_RESPONSE';
  private tracingEnabledVariable = 'POWERTOOLS_TRACE_ENABLED';

  /**
   * It returns the value of the AWS_EXECUTION_ENV environment variable.
   *
   * @returns {string}
   */
  public getAwsExecutionEnv(): string {
    return this.get(this.awsExecutionEnv);
  }

  /**
   * It returns the value of the POWERTOOLS_TRACER_CAPTURE_HTTPS_REQUESTS environment variable.
   *
   * @returns {string}
   */
  public getCaptureHTTPsRequests(): string {
    return this.get(this.tracerCaptureHTTPsRequestsVariable);
  }

  /**
   * It returns the value of the AWS_SAM_LOCAL environment variable.
   *
   * @returns {string}
   */
  public getSamLocal(): string {
    return this.get(this.samLocalVariable);
  }

  /**
   * It returns the value of the POWERTOOLS_TRACER_CAPTURE_ERROR environment variable.
   *
   * @returns {string}
   */
  public getTracingCaptureError(): string {
    return this.get(this.tracerCaptureErrorVariable);
  }

  /**
   * It returns the value of the POWERTOOLS_TRACER_CAPTURE_RESPONSE environment variable.
   *
   * @returns {string}
   */
  public getTracingCaptureResponse(): string {
    return this.get(this.tracerCaptureResponseVariable);
  }

  /**
   * It returns the value of the POWERTOOLS_TRACE_ENABLED environment variable.
   *
   * @returns {string}
   */
  public getTracingEnabled(): string {
    return this.get(this.tracingEnabledVariable);
  }
}

const environmentVariablesService = new EnvironmentVariablesService();

export { EnvironmentVariablesService, environmentVariablesService };
