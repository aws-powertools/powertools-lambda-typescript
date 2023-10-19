import { ConfigServiceInterface } from './ConfigServiceInterface.js';
import { EnvironmentVariablesService as CommonEnvironmentVariablesService } from '@aws-lambda-powertools/commons';

/**
 * Class EnvironmentVariablesService
 *
 * This class is used to return environment variables that are available in the runtime of
 * the current Lambda invocation.
 * These variables can be a mix of runtime environment variables set by AWS and
 * variables that can be set by the developer additionally.
 *
 * @class
 * @extends {CommonEnvironmentVariablesService}
 * @implements {ConfigServiceInterface}
 * @see https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars.html#configuration-envvars-runtime
 * @see https://docs.powertools.aws.dev/lambda/typescript/latest/#environment-variables
 */
class EnvironmentVariablesService
  extends CommonEnvironmentVariablesService
  implements ConfigServiceInterface
{
  // Reserved environment variables
  private awsLogLevelVariable = 'AWS_LAMBDA_LOG_LEVEL';
  private awsRegionVariable = 'AWS_REGION';
  private currentEnvironmentVariable = 'ENVIRONMENT';
  private functionNameVariable = 'AWS_LAMBDA_FUNCTION_NAME';
  private functionVersionVariable = 'AWS_LAMBDA_FUNCTION_VERSION';
  private logEventVariable = 'POWERTOOLS_LOGGER_LOG_EVENT';
  private logLevelVariable = 'POWERTOOLS_LOG_LEVEL';
  private logLevelVariableLegacy = 'LOG_LEVEL';
  private memoryLimitInMBVariable = 'AWS_LAMBDA_FUNCTION_MEMORY_SIZE';
  private sampleRateValueVariable = 'POWERTOOLS_LOGGER_SAMPLE_RATE';

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
  public getAwsLogLevel(): string {
    const awsLogLevelVariable = this.get(this.awsLogLevelVariable);

    return awsLogLevelVariable === 'FATAL' ? 'CRITICAL' : awsLogLevelVariable;
  }

  /**
   * It returns the value of the AWS_REGION environment variable.
   *
   * @returns {string}
   */
  public getAwsRegion(): string {
    return this.get(this.awsRegionVariable);
  }

  /**
   * It returns the value of the ENVIRONMENT environment variable.
   *
   * @returns {string}
   */
  public getCurrentEnvironment(): string {
    return this.get(this.currentEnvironmentVariable);
  }

  /**
   * It returns the value of the AWS_LAMBDA_FUNCTION_MEMORY_SIZE environment variable.
   *
   * @returns {string}
   */
  public getFunctionMemory(): number {
    const value = this.get(this.memoryLimitInMBVariable);

    return Number(value);
  }

  /**
   * It returns the value of the AWS_LAMBDA_FUNCTION_NAME environment variable.
   *
   * @returns {string}
   */
  public getFunctionName(): string {
    return this.get(this.functionNameVariable);
  }

  /**
   * It returns the value of the AWS_LAMBDA_FUNCTION_VERSION environment variable.
   *
   * @returns {string}
   */
  public getFunctionVersion(): string {
    return this.get(this.functionVersionVariable);
  }

  /**
   * It returns the value of the POWERTOOLS_LOGGER_LOG_EVENT environment variable.
   *
   * @returns {boolean}
   */
  public getLogEvent(): boolean {
    const value = this.get(this.logEventVariable);

    return this.isValueTrue(value);
  }

  /**
   * It returns the value of the `POWERTOOLS_LOG_LEVEL, or `LOG_LEVEL` (legacy) environment variables
   * when the first one is not set.
   *
   * @note The `LOG_LEVEL` environment variable is considered legacy and will be removed in a future release.
   * @note The `AWS_LAMBDA_LOG_LEVEL` environment variable always takes precedence over the ones above.
   *
   * @returns {string}
   */
  public getLogLevel(): string {
    const logLevelVariable = this.get(this.logLevelVariable);
    const logLevelVariableAlias = this.get(this.logLevelVariableLegacy);

    return logLevelVariable !== '' ? logLevelVariable : logLevelVariableAlias;
  }

  /**
   * It returns the value of the POWERTOOLS_LOGGER_SAMPLE_RATE environment variable.
   *
   * @returns {number|undefined}
   */
  public getSampleRateValue(): number | undefined {
    const value = this.get(this.sampleRateValueVariable);

    return value && value.length > 0 ? Number(value) : undefined;
  }
}

export { EnvironmentVariablesService };
