import { Logger } from '@aws-lambda-powertools/logger';
import { BaseProvider } from '@aws-lambda-powertools/parameters/base';
import Vault from 'hashi-vault-js';
import type {
  HashiCorpVaultProviderOptions,
  HashiCorpVaultGetOptions,
} from './customProviderVaultTypes';

class HashiCorpVaultProvider extends BaseProvider {
  public client: Vault;
  readonly #token: string;
  readonly #logger: Logger;

  /**
   * It initializes the HashiCorpVaultProvider class.
   *
   * @param {HashiCorpVaultProviderOptions} config - The configuration object.
   */
  public constructor(config: HashiCorpVaultProviderOptions) {
    super({
      proto: Vault,
    });

    const { url, token, clientConfig, vaultClient } = config;
    if (vaultClient) {
      if (vaultClient instanceof Vault) {
        this.client = vaultClient;
      } else {
        throw Error('Not a valid Vault client provided');
      }
    } else {
      const config = {
        baseUrl: url,
        ...(clientConfig ?? {
          timeout: 10000,
          rootPath: '',
        }),
      };
      this.client = new Vault(config);
    }
    this.#token = token;
    this.#logger = new Logger({
      serviceName: 'HashiCorpVaultProvider',
    });
  }

  /**
   * Retrieve a secret from HashiCorp Vault.
   *
   * You can customize the retrieval of the secret by passing options to the function:
   * * `maxAge` - The maximum age of the value in cache before fetching a new one (in seconds) (default: 5)
   * * `forceFetch` - Whether to always fetch a new value from the store regardless if already available in cache
   * * `sdkOptions` - Extra options to pass to the HashiCorp Vault SDK, e.g. `mount` or `version`
   *
   * @param {string} name - The name of the secret
   * @param {HashiCorpVaultGetOptions} options - Options to customize the retrieval of the secret
   */
  public async get(
    name: string,
    options?: HashiCorpVaultGetOptions
  ): Promise<Record<string, unknown> | undefined> {
    return super.get(name, options) as Promise<
      Record<string, unknown> | undefined
    >;
  }

  /**
   * Retrieving multiple parameter values is not supported with HashiCorp Vault.
   */
  public async getMultiple(path: string, _options?: unknown): Promise<void> {
    await super.getMultiple(path);
  }

  /**
   * Retrieve a secret from HashiCorp Vault.
   *
   * @param {string} name - The name of the secret
   * @param {HashiCorpVaultGetOptions} options - Options to customize the retrieval of the secret
   */
  protected async _get(
    name: string,
    options?: HashiCorpVaultGetOptions
  ): Promise<Record<string, unknown>> {
    const mount = options?.sdkOptions?.mount ?? 'secret';
    const version = options?.sdkOptions?.version;

    const response = await this.client.readKVSecret(
      this.#token,
      name,
      version,
      mount
    );

    if (response.isVaultError) {
      this.#logger.error('An error occurred', {
        error: response.vaultHelpMessage,
      });
      throw response;
    } else {
      return response.data;
    }
  }

  /**
   * Retrieving multiple parameter values from HashiCorp Vault is not supported.
   *
   * @throws Not Implemented Error.
   */
  protected async _getMultiple(
    _path: string,
    _options?: unknown
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }
}

export { HashiCorpVaultProvider };
