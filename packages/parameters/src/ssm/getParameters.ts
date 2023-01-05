import { SSMProvider, DEFAULT_PROVIDERS } from './SSMProvider';
import type { SSMGetMultipleOptionsInterface } from '../types/SSMProvider';

const getParameters = (
  path: string,
  options?: SSMGetMultipleOptionsInterface
): Promise<undefined | Record<string, unknown>> => {
  if (!DEFAULT_PROVIDERS.hasOwnProperty('ssm')) {
    DEFAULT_PROVIDERS.ssm = new SSMProvider();
  }

  return (DEFAULT_PROVIDERS.ssm as SSMProvider).getMultiple(path, options);
};

export {
  getParameters,
};