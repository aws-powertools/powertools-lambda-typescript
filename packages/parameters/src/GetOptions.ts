import { DEFAULT_MAX_AGE_SECS } from './constants';
import type { GetOptionsInterface, TransformOptions } from './types';

class GetOptions implements GetOptionsInterface {
  public forceFetch: boolean = false;
  public maxAge: number = DEFAULT_MAX_AGE_SECS;
  public sdkOptions?: unknown;
  public transform?: TransformOptions;

  public constructor(options: GetOptionsInterface = {}) {
    Object.assign(this, options);
  }
}

export {
  GetOptions
};