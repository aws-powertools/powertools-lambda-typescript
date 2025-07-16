import type { GetMultipleOptionsInterface } from '../types/BaseProvider.js';
import { GetOptions } from './GetOptions.js';

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

  public constructor(options: GetMultipleOptionsInterface = {}) {
    super(options);

    if (options.throwOnTransformError !== undefined) {
      this.throwOnTransformError = options.throwOnTransformError;
    }
  }
}

export { GetMultipleOptions };
