import { BaseProvider } from '@aws-lambda-powertools/parameters/base';
import { GetParameterError } from '@aws-lambda-powertools/parameters/errors';
import type {
  HashiCorpVaultGetOptions,
  HashiCorpVaultProviderOptions,
} from './customProviderVaultTypes.js';

class HashiCorpVaultProvider extends BaseProvider {
  readonly #baseUrl: string;
  readonly #token: string;
  readonly #rootPath?: string;
  readonly #timeout: number;
  readonly #abortController: AbortController;

  /**
   * It initializes the HashiCorpVaultProvider class.
   *
   * @param config - The configuration object.
   */
  public constructor(config: HashiCorpVaultProviderOptions) {
    super({});

    const { url, token, rootPath, timeout } = config;
    this.#baseUrl = url;
    this.#rootPath = rootPath ?? 'secret';
    this.#timeout = timeout ?? 5000;
    this.#token = token;
    this.#abortController = new AbortController();
  }

  /**
   * Retrieve a secret from HashiCorp Vault.
   *
   * You can customize the retrieval of the secret by passing options to the function:
   * * `maxAge` - The maximum age of the value in cache before fetching a new one (in seconds) (default: 5)
   * * `forceFetch` - Whether to always fetch a new value from the store regardless if already available in cache
   * * `sdkOptions` - Extra options to pass to the HashiCorp Vault SDK, e.g. `mount` or `version`
   *
   * @param name - The name of the secret
   * @param options - Options to customize the retrieval of the secret
   */
  public async get<T extends Record<string, unknown>>(
    name: string,
    options?: HashiCorpVaultGetOptions
  ): Promise<T | undefined> {
    return super.get(name, options) as Promise<
      Record<string, unknown> | undefined
    > as Promise<T | undefined>;
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
   * @param name - The name of the secret
   * @param options - Options to customize the retrieval of the secret
   */
  protected async _get(
    name: string,
    options?: HashiCorpVaultGetOptions
  ): Promise<Record<string, unknown>> {
    const mount = options?.sdkOptions?.mount ?? this.#rootPath;
    const version = options?.sdkOptions?.version;

    setTimeout(() => {
      this.#abortController.abort();
    }, this.#timeout);

    const res = await fetch(
      `${this.#baseUrl}/${mount}/data/${name}${version ? `?version=${version}` : ''}`,
      {
        headers: { 'X-Vault-Token': this.#token },
        method: 'GET',
        signal: this.#abortController.signal,
      }
    );
    if (!res.ok) {
      throw new GetParameterError(
        `Failed to fetch secret from HashiCorp Vault: ${res.statusText}`
      );
    }
    const response = await res.json();
    return response.data.data;
  }

  /**
   * Retrieving multiple parameter values from HashiCorp Vault is not supported.
   *
   * @throws Not Implemented Error.
   */
  protected async _getMultiple(
    _path: string,
    _options?: unknown
  ): Promise<Record<string, unknown> | undefined> {
    throw new GetParameterError('Method not implemented.');
  }
}

export { HashiCorpVaultProvider };
