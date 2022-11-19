import type { GetMultipleOptionsInterface, TransformOptions } from './types';

const DEFAULT_MAX_AGE_SECS = 5;

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