import { GetOptionsInterface } from '@aws-lambda-powertools/parameters/base/types';
import Vault from 'hashi-vault-js';

/**
 * Base interface for HashiCorpVaultProviderOptions.
 * @interface
 */
interface HashiCorpVaultProviderOptionsBase {
  /**
   * Indicate the server name/IP, port and API version for the Vault instance, all paths are relative to this one.
   * @example 'https://vault.example.com:8200/v1'
   */
  url: string;
  /**
   * The Vault token to use for authentication.
   */
  token: string;
}

/**
 * Interface for HashiCorpVaultProviderOptions with clientConfig property.
 * @interface
 */
interface HashiCorpVaultProviderOptionsWithClientConfig
  extends HashiCorpVaultProviderOptionsBase {
  /**
   * Optional configuration to pass during client initialization to customize the `hashi-vault-js` client.
   */
  clientConfig?: unknown;
  /**
   * This property should never be passed.
   */
  vaultClient?: never;
}

/**
 * Interface for HashiCorpVaultProviderOptions with vaultClient property.
 *
 *  @interface
 */
interface HashiCorpVaultProviderOptionsWithClientInstance
  extends HashiCorpVaultProviderOptionsBase {
  /**
   * Optional `hashi-vault-js` client to pass during HashiCorpVaultProvider class instantiation. If not provided, a new client will be created.
   */
  vaultClient?: Vault;
  /**
   * This property should never be passed.
   */
  clientConfig: never;
}

/**
 * Options for the HashiCorpVaultProvider class constructor.
 *
 * @param {string} url - Indicate the server name/IP, port and API version for the Vault instance, all paths are relative to this one.
 * @param {string} token - The Vault token to use for authentication.
 * @param {Vault.VaultConfig} [clientConfig] - Optional configuration to pass during client initialization, e.g. timeout. Mutually exclusive with vaultClient.
 * @param {Vault} [vaultClient] - Optional `hashi-vault-js` client to pass during HashiCorpVaultProvider class instantiation. Mutually exclusive with clientConfig.
 */
type HashiCorpVaultProviderOptions =
  | HashiCorpVaultProviderOptionsWithClientConfig
  | HashiCorpVaultProviderOptionsWithClientInstance;

type HashiCorpVaultReadKVSecretOptions = {
  /**
   * The mount point of the secret engine to use. Defaults to `secret`.
   * @example 'kv'
   */
  mount?: string;
  /**
   * The version of the secret to retrieve. Defaults to `undefined`.
   * @example 1
   */
  version?: number;
};

interface HashiCorpVaultGetOptions extends GetOptionsInterface {
  /**
   * The Parameters utility does not support transforming `Record<string, unknown>` values as returned by the HashiCorp Vault SDK.
   */
  transform?: never;
  sdkOptions?: HashiCorpVaultReadKVSecretOptions;
}

export type { HashiCorpVaultProviderOptions, HashiCorpVaultGetOptions };
