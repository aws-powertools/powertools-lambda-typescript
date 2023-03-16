import { DEFAULT_MAX_AGE_SECS } from './constants';
import type { GetMultipleOptionsInterface, TransformOptions } from './types';

/**
 * Options for the `getMultiple` method.
 * 
 * It merges the default options with the provided options.
 */
class GetMultipleOptions implements GetMultipleOptionsInterface {
  public forceFetch: boolean = false;
  public maxAge: number = DEFAULT_MAX_AGE_SECS;
  public sdkOptions?: unknown;
  public throwOnTransformError: boolean = false;
  public transform?: TransformOptions;

  public constructor(options: GetMultipleOptionsInterface) {
    Object.assign(this, options);
  }
}

export {
  GetMultipleOptions
};