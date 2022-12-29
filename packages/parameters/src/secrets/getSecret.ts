import { DEFAULT_PROVIDERS } from '../BaseProvider';
import { SecretsProvider } from './SecretsProvider';
import type { SecretsGetOptionsInterface } from '../types/SecretsProvider';

const getSecret = async (name: string, options?: SecretsGetOptionsInterface): Promise<undefined | string | Uint8Array | Record<string, unknown>> => {
  if (!DEFAULT_PROVIDERS.hasOwnProperty('secrets')) {
    DEFAULT_PROVIDERS.secrets = new SecretsProvider();
  }
  
  return DEFAULT_PROVIDERS.secrets.get(name, options);
};

export {
  getSecret
};