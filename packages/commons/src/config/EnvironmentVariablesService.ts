import type { ConfigServiceInterface } from '../types/ConfigServiceInterface.js';

/**
 * Class EnvironmentVariablesService
 *
 * This class is used to return environment variables that are available in the runtime of
 * the current Lambda invocation.
 * These variables can be a mix of runtime environment variables set by AWS and
 * variables that can be set by the developer additionally.
 *
 * @class
 * @extends {ConfigService}
 * @see https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars.html#configuration-envvars-runtime
 * @see https://docs.powertools.aws.dev/lambda/typescript/latest/#environment-variables
 */
class EnvironmentVariablesService implements ConfigServiceInterface {
  /**
   * @see https://docs.powertools.aws.dev/lambda/typescript/latest/#environment-variables
   * @protected
   */
  protected devModeVariable = 'POWERTOOLS_DEV';
  protected serviceNameVariable = 'POWERTOOLS_SERVICE_NAME';
  // Reserved environment variables
  private xRayTraceIdVariable = '_X_AMZN_TRACE_ID';

  /**
   * It returns the value of an environment variable that has given name.
   *
   * @param {string} name
   * @returns {string}
   */
  public get(name: string): string {
    return process.env[name]?.trim() || '';
  }

  /**
   * It returns the value of the POWERTOOLS_SERVICE_NAME environment variable.
   *
   * @returns {string}
   */
  public getServiceName(): string {
    return this.get(this.serviceNameVariable);
  }

  /**
   * It returns the value of the _X_AMZN_TRACE_ID environment variable.
   *
   * The AWS X-Ray Trace data available in the environment variable has this format:
   * `Root=1-5759e988-bd862e3fe1be46a994272793;Parent=557abcec3ee5a047;Sampled=1`,
   *
   * The actual Trace ID is: `1-5759e988-bd862e3fe1be46a994272793`.
   *
   * @returns {string}
   */
  public getXrayTraceId(): string | undefined {
    const xRayTraceData = this.getXrayTraceData();

    return xRayTraceData?.Root;
  }

  /**
   * It returns true if the Sampled flag is set in the _X_AMZN_TRACE_ID environment variable.
   *
   * The AWS X-Ray Trace data available in the environment variable has this format:
   * `Root=1-5759e988-bd862e3fe1be46a994272793;Parent=557abcec3ee5a047;Sampled=1`,
   *
   * @returns {boolean}
   */
  public getXrayTraceSampled(): boolean {
    const xRayTraceData = this.getXrayTraceData();

    return xRayTraceData?.Sampled === '1';
  }

  /**
   * It returns true if the `POWERTOOLS_DEV` environment variable is set to truthy value.
   *
   * @returns {boolean}
   */
  public isDevMode(): boolean {
    return this.isValueTrue(this.get(this.devModeVariable));
  }

  /**
   * It returns true if the string value represents a boolean true value.
   *
   * @param {string} value
   * @returns boolean
   */
  public isValueTrue(value: string): boolean {
    const truthyValues: string[] = ['1', 'y', 'yes', 't', 'true', 'on'];

    return truthyValues.includes(value.toLowerCase());
  }

  /**
   * It parses the key/value data present in the _X_AMZN_TRACE_ID environment variable
   * and returns it as an object when available.
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
