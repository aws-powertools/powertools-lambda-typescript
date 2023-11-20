import type { ConfigServiceInterface as ConfigServiceBaseInterface } from '@aws-lambda-powertools/commons/types';

/**
 * Interface ConfigServiceInterface
 *
 * @interface
 * @see https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars.html#configuration-envvars-runtime
 * @see https://docs.powertools.aws.dev/lambda-typescript/latest/#environment-variables
 */
interface ConfigServiceInterface extends ConfigServiceBaseInterface {
  /**
   * It returns the value of the POWERTOOLS_PARAMETERS_MAX_AGE environment variable.
   *
   * @returns {number|undefined}
   */
  getParametersMaxAge(): number | undefined;
  /**
   * It returns the value of the POWERTOOLS_PARAMETERS_SSM_DECRYPT environment variable.
   *
   * @returns {string}
   */
  getSSMDecrypt(): string;
}

export type { ConfigServiceInterface };
