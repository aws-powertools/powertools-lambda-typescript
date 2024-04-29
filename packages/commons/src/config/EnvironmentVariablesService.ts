import type { ConfigServiceInterface } from '../types/ConfigServiceInterface.js';

/**
 * This class is used to fetch environment variables that are available in the execution environment.
 *
 * These variables can be a mix of runtime environment variables set by AWS and
 * other environment variables that are set by the developer to configure Powertools for AWS Lambda.
 *
 * @example
 * ```typescript
 * import { EnvironmentVariablesService } from '@aws-lambda-powertools/commons/';
 *
 * const config = new EnvironmentVariablesService();
 * const serviceName = config.getServiceName();
 * ```
 *
 * @see https://docs.powertools.aws.dev/lambda/typescript/latest/#environment-variables
 *
 * @class
 * @implements {ConfigServiceInterface}
 */
class EnvironmentVariablesService implements ConfigServiceInterface {
  /**
   * Increase JSON indentation for Logger to ease debugging when running functions locally or in a non-production environment
   */
  protected devModeVariable = 'POWERTOOLS_DEV';
  /**
   * Set service name used for tracing namespace, metrics dimension and structured logging
   */
  protected serviceNameVariable = 'POWERTOOLS_SERVICE_NAME';
  /**
   * AWS X-Ray Trace ID environment variable
   * @private
   */
  private xRayTraceIdVariable = '_X_AMZN_TRACE_ID';

  /**
   * Get the value of an environment variable by name.
   *
   * @param {string} name The name of the environment variable to fetch.
   */
  public get(name: string): string {
    return process.env[name]?.trim() || '';
  }

  /**
   * Get the value of the `POWERTOOLS_SERVICE_NAME` environment variable.
   */
  public getServiceName(): string {
    return this.get(this.serviceNameVariable);
  }

  /**
   * Get the value of the `_X_AMZN_TRACE_ID` environment variable.
   *
   * The AWS X-Ray Trace data available in the environment variable has this format:
   * `Root=1-5759e988-bd862e3fe1be46a994272793;Parent=557abcec3ee5a047;Sampled=1`,
   *
   * The actual Trace ID is: `1-5759e988-bd862e3fe1be46a994272793`.
   */
  public getXrayTraceId(): string | undefined {
    const xRayTraceData = this.getXrayTraceData();

    return xRayTraceData?.Root;
  }

  /**
   * Determine if the current invocation is part of a sampled X-Ray trace.
   *
   * The AWS X-Ray Trace data available in the environment variable has this format:
   * `Root=1-5759e988-bd862e3fe1be46a994272793;Parent=557abcec3ee5a047;Sampled=1`,
   */
  public getXrayTraceSampled(): boolean {
    const xRayTraceData = this.getXrayTraceData();

    return xRayTraceData?.Sampled === '1';
  }

  /**
   * Determine if the current invocation is running in a development environment.
   */
  public isDevMode(): boolean {
    return this.isValueTrue(this.get(this.devModeVariable));
  }

  /**
   * Helper function to determine if a value is considered thruthy.
   *
   * @param value The value to check for truthiness.
   */
  public isValueTrue(value: string): boolean {
    const truthyValues: string[] = ['1', 'y', 'yes', 't', 'true', 'on'];

    return truthyValues.includes(value.toLowerCase());
  }

  /**
   * Get the AWS X-Ray Trace data from the environment variable.
   *
   * The method parses the environment variable `_X_AMZN_TRACE_ID` and returns an object with the key-value pairs.
   */
  private getXrayTraceData(): Record<string, string> | undefined {
    const xRayTraceEnv = this.get(this.xRayTraceIdVariable);

    if (xRayTraceEnv === '') return undefined;

    if (!xRayTraceEnv.includes('=')) return { Root: xRayTraceEnv };

    const xRayTraceData: Record<string, string> = {};

    xRayTraceEnv.split(';').forEach((field) => {
      const [key, value] = field.split('=');

      xRayTraceData[key] = value;
    });

    return xRayTraceData;
  }
}

export { EnvironmentVariablesService };
