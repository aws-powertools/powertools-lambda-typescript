import { getNumberFromEnv } from '@aws-lambda-powertools/commons/utils/env';
import { DEFAULT_MAX_AGE_SECS } from '../constants.js';
import type {
  GetOptionsInterface,
  TransformOptions,
} from '../types/BaseProvider.js';

/**
 * Options for the `get` method.
 *
 * It merges the default options with the provided options.
 */
class GetOptions implements GetOptionsInterface {
  public forceFetch = false;
  public maxAge!: number;
  public sdkOptions?: unknown;
  public transform?: TransformOptions;

  public constructor(options: GetOptionsInterface = {}) {
    Object.assign(this, options);

    if (options.maxAge === undefined) {
      this.maxAge = getNumberFromEnv({
        key: 'POWERTOOLS_PARAMETERS_MAX_AGE',
        defaultValue: DEFAULT_MAX_AGE_SECS,
      });
    }
  }
}

export { GetOptions };
