import { EnvironmentVariablesService } from '../config/EnvironmentVariablesService';
import { DEFAULT_MAX_AGE_SECS } from '../constants';
import type {
  GetOptionsInterface,
  TransformOptions,
} from '../types/BaseProvider';

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
    options: GetOptionsInterface = {},
    envVarsService: EnvironmentVariablesService
  ) {
    Object.assign(this, options);

    if (options.maxAge === undefined) {
      this.maxAge =
        envVarsService.getParametersMaxAge() ?? DEFAULT_MAX_AGE_SECS;
    }
  }
}

export { GetOptions };
