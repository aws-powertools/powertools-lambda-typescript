/**
 * Abstract class ConfigService
 *
 * This class defines common methods and variables that can be set by the developer
 * in the runtime.
 */
interface ConfigServiceInterface {
  /**
   * It returns the value of an environment variable that has given name.
   *
   * @param {string} name
   * @returns {string}
   */
  get(name: string): string;

  /**
   * It returns the value of the POWERTOOLS_SERVICE_NAME environment variable.
   *
   * @returns {string}
   */
  getServiceName(): string;

  /**
   * It returns the value of the _X_AMZN_TRACE_ID environment variable.
   *
   * The AWS X-Ray Trace data available in the environment variable has this format:
   * `Root=1-5759e988-bd862e3fe1be46a994272793;Parent=557abcec3ee5a047;Sampled=1`,
   *
   * The actual Trace ID is: `1-5759e988-bd862e3fe1be46a994272793`.
   *
   * @returns {string|undefined}
   */
  getXrayTraceId(): string | undefined;

  /**
   * It returns true if the `POWERTOOLS_DEV` environment variable is set to truthy value.
   *
   * @returns {boolean}
   */
  isDevMode(): boolean;

  /**
   * It returns true if the string value represents a boolean true value.
   *
   * @param {string} value
   * @returns boolean
   */
  isValueTrue(value: string): boolean;
}

export type { ConfigServiceInterface };
