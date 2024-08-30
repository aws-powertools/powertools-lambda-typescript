/**
 * This class defines common methods and variables that can be set by the developer
 * in the runtime.
 */
interface ConfigServiceInterface {
  /**
   * Get the value of an environment variable by name.
   *
   * @param {string} name The name of the environment variable to fetch.
   */
  get(name: string): string;

  /**
   * Get the value of the `POWERTOOLS_SERVICE_NAME` environment variable.
   */
  getServiceName(): string;

  /**
   * Get the value of the `_X_AMZN_TRACE_ID` environment variable.
   *
   * The AWS X-Ray Trace data available in the environment variable has this format:
   * `Root=1-5759e988-bd862e3fe1be46a994272793;Parent=557abcec3ee5a047;Sampled=1`,
   *
   * The actual Trace ID is: `1-5759e988-bd862e3fe1be46a994272793`.
   */
  getXrayTraceId(): string | undefined;

  /**
   * Determine if the current invocation is part of a sampled X-Ray trace.
   *
   * The AWS X-Ray Trace data available in the environment variable has this format:
   * `Root=1-5759e988-bd862e3fe1be46a994272793;Parent=557abcec3ee5a047;Sampled=1`,
   */
  getXrayTraceSampled(): boolean;

  /**
   * Determine if the current invocation is running in a development environment.
   */
  isDevMode(): boolean;

  /**
   * Helper function to determine if a value is considered thruthy.
   *
   * @param value The value to check for truthiness.
   */
  isValueTrue(value: string): boolean;
}

export type { ConfigServiceInterface };
