import { BaseProvider } from '../BaseProvider';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import type { GetSecretValueCommandInput } from '@aws-sdk/client-secrets-manager';
import type { SecretsProviderOptions, SecretsGetOptionsInterface } from 'types/SecretsProvider';

class SecretsProvider extends BaseProvider {
  public client: SecretsManagerClient;

  public constructor (config?: SecretsProviderOptions) {
    super();

    const clientConfig = config?.clientConfig || {};
    this.client = new SecretsManagerClient(clientConfig);
  }

  public async get(name: string, options?: SecretsGetOptionsInterface): Promise<undefined | string | Uint8Array | Record<string, unknown>> {
    return super.get(name, options);
  }

  protected async _get(name: string, options?: SecretsGetOptionsInterface): Promise<string | Uint8Array | undefined> {
    const sdkOptions: GetSecretValueCommandInput = {
      SecretId: name,
    };
    if (options?.sdkOptions) {
      this.removeNonOverridableOptions(options.sdkOptions as GetSecretValueCommandInput);
      Object.assign(sdkOptions, options.sdkOptions);
    }

    const result = await this.client.send(new GetSecretValueCommand(sdkOptions));

    if (result.SecretString) return result.SecretString;

    return result.SecretBinary;
  }

  /**
   * Retrieving multiple parameter values is not supported with AWS Secrets Manager.
   */
  protected async _getMultiple(_path: string, _options?: unknown): Promise<Record<string, string | undefined>> {
    throw new Error('Method not implemented.');
  }

  /**
   * Explicit arguments passed to the constructor will take precedence over ones passed to the method.
   * For users who consume the library with TypeScript, this will be enforced by the type system. However,
   * for JavaScript users, we need to manually delete the properties that are not allowed to be overridden.
   */
  protected removeNonOverridableOptions(options: GetSecretValueCommandInput): void {
    if (options.hasOwnProperty('SecretId')) {
      delete options.SecretId;
    }
  }
}

export {
  SecretsProvider,
};