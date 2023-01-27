import { SSMProvider, DEFAULT_PROVIDERS } from './SSMProvider';
import type { SSMGetOptionsInterface } from '../types/SSMProvider';

const getParameter = (
  name: string,
  options?: SSMGetOptionsInterface
): Promise<undefined | string | Record<string, unknown>> => {
  if (!DEFAULT_PROVIDERS.hasOwnProperty('ssm')) {
    DEFAULT_PROVIDERS.ssm = new SSMProvider();
  }

  return (DEFAULT_PROVIDERS.ssm as SSMProvider).get(name, options);
};

export {
  getParameter,
};