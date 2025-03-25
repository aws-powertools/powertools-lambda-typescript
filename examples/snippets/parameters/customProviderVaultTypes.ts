import type { GetOptionsInterface } from '@aws-lambda-powertools/parameters/base/types';

/**
 * Options for the HashiCorpVaultProvider class constructor.
 *
 * @param {string} url - Indicate the server name/IP, port and API version for the Vault instance, all paths are relative to this one.
 * @param {string} token - The Vault token to use for authentication.
 *
 */
interface HashiCorpVaultProviderOptions {
  /**
   * Indicate the server name/IP, port and API version for the Vault instance, all paths are relative to this one.
   * @example 'https://vault.example.com:8200/v1'
   */
  url: string;
  /**
   * The Vault token to use for authentication.
   */
  token: string;
  /**
   * The root path to use for the secret engine. Defaults to `secret`.
   */
  rootPath?: string;
  /**
   * The timeout in milliseconds for the HTTP requests. Defaults to `5000`.
   * @example 10000
   * @default 5000
   */
  timeout?: number;
}

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
