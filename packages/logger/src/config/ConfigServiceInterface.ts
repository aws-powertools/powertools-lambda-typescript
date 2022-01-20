/**
 * Interface ConfigServiceInterface
 *
 * @interface
 * @see https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars.html#configuration-envvars-runtime
 * @see https://awslabs.github.io/aws-lambda-powertools-typescript/latest/#environment-variables
 */
interface ConfigServiceInterface {

  /**
   * It returns the value of an environment variable that has given name.
   *
   * @param {string} name
   * @returns {string}
   */
  get(name: string): string

  /**
   * It returns the value of the ENVIRONMENT environment variable.
   *
   * @returns {string}
   */
  getCurrentEnvironment(): string

  /**
   * It returns the value of the LOG_LEVEL environment variable.
   *
   * @returns {string}
   */
  getLogLevel(): string

  /**
   * It returns the value of the POWERTOOLS_LOGGER_SAMPLE_RATE environment variable.
   *
   * @returns {string|undefined}
   */
  getSampleRateValue(): number | undefined

  /**
   * It returns the value of the POWERTOOLS_SERVICE_NAME environment variable.
   *
   * @returns {string}
   */
  getServiceName(): string

}

export {
  ConfigServiceInterface,
};