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
}

export type { ConfigServiceInterface };
