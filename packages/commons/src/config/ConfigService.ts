/**
 * Abstract class ConfigService
 *
 * This class defines common methods and variables that can be set by the developer
 * in the runtime.
 *
 * @class
 * @abstract
 */
abstract class ConfigService {

  /**
   * @see https://awslabs.github.io/aws-lambda-powertools-typescript/latest/#environment-variables
   * @protected
   */
  protected serviceNameVariable = 'POWERTOOLS_SERVICE_NAME';

  /**
   * It returns the value of an environment variable that has given name.
   *
   * @param {string} name
   * @returns {string}
   */
  public abstract get(name: string): string;

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