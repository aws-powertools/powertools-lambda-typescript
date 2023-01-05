import { BaseProvider } from '../BaseProvider';
import {
  SecretsManagerClient,
  GetSecretValueCommand
} from '@aws-sdk/client-secrets-manager';
import type { GetSecretValueCommandInput } from '@aws-sdk/client-secrets-manager';
import type {
  SecretsProviderOptions,
  SecretsGetOptionsInterface
} from '../types/SecretsProvider';

class SecretsProvider extends BaseProvider {
  public client: SecretsManagerClient;

  public constructor (config?: SecretsProviderOptions) {
    super();

    const clientConfig = config?.clientConfig || {};
    this.client = new SecretsManagerClient(clientConfig);
  }

  public async get(
    name: string,
    options?: SecretsGetOptionsInterface
  ): Promise<undefined | string | Uint8Array | Record<string, unknown>> {
    return super.get(name, options);
  }

  protected async _get(
    name: string,
    options?: SecretsGetOptionsInterface
  ): Promise<string | Uint8Array | undefined> {
    const sdkOptions: GetSecretValueCommandInput = {
      ...(options?.sdkOptions || {}),
      SecretId: name,
    };

    const result = await this.client.send(new GetSecretValueCommand(sdkOptions));

    if (result.SecretString) return result.SecretString;

    return result.SecretBinary;
  }

  /**
   * Retrieving multiple parameter values is not supported with AWS Secrets Manager.
   */
  protected async _getMultiple(
    _path: string,
    _options?: unknown
  ): Promise<Record<string, string | undefined>> {
    throw new Error('Method not implemented.');
  } 
}

export {
  SecretsProvider,
};