import {
  getServiceName,
  getXRayTraceIdFromEnv,
  isDevMode,
  isRequestXRaySampled,
} from '../envUtils.js';
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
    return getServiceName();
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
    return getXRayTraceIdFromEnv();
  }

  /**
   * Determine if the current invocation is part of a sampled X-Ray trace.
   *
   * The AWS X-Ray Trace data available in the environment variable has this format:
   * `Root=1-5759e988-bd862e3fe1be46a994272793;Parent=557abcec3ee5a047;Sampled=1`,
   */
  public getXrayTraceSampled(): boolean {
    return isRequestXRaySampled();
  }

  /**
   * Determine if the current invocation is running in a development environment.
   */
  public isDevMode(): boolean {
    return isDevMode();
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
   * Helper function to determine if a value is considered falsy.
   *
   * @param value The value to check for falsiness.
   */
  public isValueFalse(value: string): boolean {
    const falsyValues: string[] = ['0', 'n', 'no', 'f', 'false', 'off'];

    return falsyValues.includes(value.toLowerCase());
  }
}

export { EnvironmentVariablesService };
