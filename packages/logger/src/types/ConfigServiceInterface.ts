/**
 * Interface ConfigServiceInterface
 *
 * @interface
 * @see https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars.html#configuration-envvars-runtime
 * @see https://docs.powertools.aws.dev/lambda/typescript/latest/#environment-variables
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
   * It returns the value of the `AWS_LAMBDA_LOG_LEVEL` environment variable.
   *
   * The `AWS_LAMBDA_LOG_LEVEL` environment variable is set by AWS Lambda when configuring
   * the function's log level using the Advanced Logging Controls feature. This value always
   * takes precedence over other means of configuring the log level.
   *
   * @note we need to map the `FATAL` log level to `CRITICAL`, see {@link https://docs.aws.amazon.com/lambda/latest/dg/configuration-logging.html#configuration-logging-log-levels AWS Lambda Log Levels}.
   *
   * @returns {string}
   */
  getAwsLogLevel(): string;

  /**
   * It returns the value of the ENVIRONMENT environment variable.
   *
   * @returns {string}
   */
  getCurrentEnvironment(): string;

  /**
   * It returns the value of the POWERTOOLS_LOGGER_LOG_EVENT environment variable.
   *
   * @returns {boolean}
   */
  getLogEvent(): boolean;

  /**
   * It returns the value of the `POWERTOOLS_LOG_LEVEL, or `LOG_LEVEL` (legacy) environment variables
   * when the first one is not set.
   *
   * @note The `LOG_LEVEL` environment variable is considered legacy and will be removed in a future release.
   * @note The `AWS_LAMBDA_LOG_LEVEL` environment variable always takes precedence over the ones above.
   *
   * @returns {string}
   */
  getLogLevel(): string;

  /**
   * It returns the value of the POWERTOOLS_LOGGER_SAMPLE_RATE environment variable.
   *
   * @returns {string|undefined}
   */
  getSampleRateValue(): number | undefined;

  /**
   * It returns the value of the POWERTOOLS_SERVICE_NAME environment variable.
   *
   * @returns {string}
   */
  getServiceName(): string;

  /**
   * It returns the value of the POWERTOOLS_DEV environment variable.
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
