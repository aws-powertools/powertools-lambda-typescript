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
   * Get the value of the `POWERTOOLS_METRICS_NAMESPACE` environment variable.
   */
  getNamespace(): string;
}

export type { ConfigServiceInterface };
