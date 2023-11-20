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
   * It returns the value of the AWS_LAMBDA_FUNCTION_NAME environment variable.
   *
   * @returns {string}
   */
  getFunctionName(): string;

  /**
   * It returns whether the idempotency feature is enabled or not.
   *
   * Reads the value of the POWERTOOLS_IDEMPOTENCY_DISABLED environment variable.
   *
   * @returns {boolean}
   */
  getIdempotencyEnabled(): boolean;
}

export type { ConfigServiceInterface };
