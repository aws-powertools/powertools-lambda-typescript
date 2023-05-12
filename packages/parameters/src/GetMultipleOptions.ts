import { GetOptions } from './GetOptions';
import { EnvironmentVariablesService } from './config/EnvironmentVariablesService';
import type { GetMultipleOptionsInterface } from './types';

/**
 * Options for the `getMultiple` method.
 *
 * Extends the `GetOptions` class and adds the `throwOnTransformError` option.
 */
class GetMultipleOptions
  extends GetOptions
  implements GetMultipleOptionsInterface
{
  public throwOnTransformError = false;

  public constructor(
    options: GetMultipleOptionsInterface = {},
    envVarsService: EnvironmentVariablesService
  ) {
    super(options, envVarsService);

    if (options.throwOnTransformError !== undefined) {
      this.throwOnTransformError = options.throwOnTransformError;
    }
  }
}

export { GetMultipleOptions };
