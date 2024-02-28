import { GetOptions } from './GetOptions.js';
import { EnvironmentVariablesService } from '../config/EnvironmentVariablesService.js';
import type { GetMultipleOptionsInterface } from '../types/BaseProvider.js';

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
