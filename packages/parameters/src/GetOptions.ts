import { DEFAULT_MAX_AGE_SECS } from './constants';
import { EnvironmentVariablesService } from './config/EnvironmentVariablesService';
import type { GetOptionsInterface, TransformOptions } from './types';

/**
 * Options for the `get` method.
 * 
 * It merges the default options with the provided options.
 */
class GetOptions implements GetOptionsInterface {
  public forceFetch: boolean = false;
  public maxAge!: number;
  public sdkOptions?: unknown;
  public transform?: TransformOptions;

  public constructor(options: GetOptionsInterface = {}, envVarsService: EnvironmentVariablesService) {
    Object.assign(this, options);

    if (options.maxAge === undefined) {
      this.maxAge = envVarsService.getParametersMaxAge() ?? DEFAULT_MAX_AGE_SECS;
    }
  }
}

export {
  GetOptions
};