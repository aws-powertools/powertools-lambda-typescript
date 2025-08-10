import { EnvironmentVariablesService as CommonEnvironmentVariablesService } from '@aws-lambda-powertools/commons';
import type { ConfigServiceInterface } from '../types/ConfigServiceInterface.js';

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
 * @see https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars.html#configuration-envvars-runtime
 * @see https://docs.powertools.aws.dev/lambda/typescript/latest/#environment-variables
 */
class EnvironmentVariablesService
  extends CommonEnvironmentVariablesService
  implements ConfigServiceInterface
{
  // Reserved environment variables
  private readonly functionNameVariable = 'AWS_LAMBDA_FUNCTION_NAME';
  private readonly idempotencyDisabledVariable =
    'POWERTOOLS_IDEMPOTENCY_DISABLED';

  /**
   * It returns the value of the AWS_LAMBDA_FUNCTION_NAME environment variable.
   *
   * @returns {string}
   */
  public getFunctionName(): string {
    return this.get(this.functionNameVariable);
  }

  /**
   * It returns whether the idempotency feature is enabled or not.
   *
   * Reads the value of the POWERTOOLS_IDEMPOTENCY_DISABLED environment variable.
   *
   * @returns {boolean}
   */
  public getIdempotencyEnabled(): boolean {
    return !this.isValueTrue(this.get(this.idempotencyDisabledVariable));
  }
}

export { EnvironmentVariablesService };
