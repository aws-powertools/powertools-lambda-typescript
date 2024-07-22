import type { EnvironmentVariablesService } from '../config/EnvironmentVariablesService.js';
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

  public constructor(
    envVarsService: EnvironmentVariablesService,
    options: GetOptionsInterface = {},
  ) {
    Object.assign(this, options);

    if (options.maxAge === undefined) {
      this.maxAge =
        envVarsService.getParametersMaxAge() ?? DEFAULT_MAX_AGE_SECS;
    }
  }
}

export { GetOptions };
