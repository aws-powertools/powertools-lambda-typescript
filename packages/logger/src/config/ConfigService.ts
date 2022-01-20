import { ConfigServiceInterface } from '.';

/**
 * Abstract class ConfigService
 *
 * This class defines common methods and variables that can be set by the developer
 * in the runtime.
 *
 * @class
 * @abstract
 * @implements {ConfigServiceInterface}
 * @see https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars.html#configuration-envvars-runtime
 * @see https://awslabs.github.io/aws-lambda-powertools-typescript/latest/#environment-variables
 */
abstract class ConfigService implements ConfigServiceInterface {

  /**
   * @see https://awslabs.github.io/aws-lambda-powertools-typescript/latest/#environment-variables
   * @protected
   */
  protected currentEnvironmentVariable = 'ENVIRONMENT';
  protected logLevelVariable = 'LOG_LEVEL';
  protected sampleRateValueVariable = 'POWERTOOLS_LOGGER_SAMPLE_RATE';
  protected serviceNameVariable = 'POWERTOOLS_SERVICE_NAME';

  /**
   * It returns the value of an environment variable that has given name.
   *
   * @param {string} name
   * @returns {string}
   */
  public abstract get(name: string): string;

  /**
   * It returns the value of the ENVIRONMENT environment variable.
   *
   * @returns {string}
   */
  public abstract getCurrentEnvironment(): string;

  /**
   * It returns the value of the LOG_LEVEL environment variable.
   *
   * @returns {string}
   */
  public abstract getLogLevel(): string;

  /**
   * It returns the value of the POWERTOOLS_LOGGER_SAMPLE_RATE environment variable.
   *
   * @returns {string|undefined}
   */
  public abstract getSampleRateValue(): number | undefined;

  /**
   * It returns the value of the POWERTOOLS_SERVICE_NAME environment variable.
   *
   * @returns {string}
   */
  public abstract getServiceName(): string;

}

export {
  ConfigService,
};