import { SSMProvider, DEFAULT_PROVIDERS } from './SSMProvider';
import type {
  SSMGetParametersByNameOptionsInterface
} from '../types/SSMProvider';

const getParametersByName = (
  parameters: Record<string, SSMGetParametersByNameOptionsInterface>,
  options?: SSMGetParametersByNameOptionsInterface
): Promise<Record<string, unknown> & { _errors?: string[] }> => {
  if (!DEFAULT_PROVIDERS.hasOwnProperty('ssm')) {
    DEFAULT_PROVIDERS.ssm = new SSMProvider();
  }

  return (DEFAULT_PROVIDERS.ssm as SSMProvider).getParametersByName(parameters, options);
};

export {
  getParametersByName,
};