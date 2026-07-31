import type { JSONValue } from '@aws-lambda-powertools/commons/types';
import type { getConfig } from '../appconfig-agent/getConfig.js';
import type { GetMaybeUndefined } from './BaseProvider.js';

/**
 * Options for the {@link getConfig | `getConfig()`} function.
 *
 * @property environment - The environment ID or the environment name.
 * @property application - The application ID or the application name, if not provided it will be inferred from the service name in the environment.
 * @property transform - Optional transform to be applied, can be `json` or `binary`.
 * @property timeout - Optional timeout in milliseconds for the request to the AWS AppConfig Agent (default: `3000`).
 */
type GetConfigOptions = {
  /**
   * The environment ID or the environment name.
   */
  environment: string;
  /**
   * The application ID or the application name, if not provided it will be inferred from the service name in the environment (`POWERTOOLS_SERVICE_NAME`).
   */
  application?: string;
  /**
   * Optional transform to be applied, can be `json` or `binary`.
   */
  transform?: 'json' | 'binary';
  /**
   * Optional timeout in milliseconds for the request to the AWS AppConfig Agent (default: `3000`).
   */
  timeout?: number;
  /**
   * Optional flag to throw a `ParameterNotFoundError` when the configuration does not exist (default: `false`).
   *
   * By default, a missing configuration returns `undefined`.
   */
  throwOnMissing?: boolean;
};

/**
 * Generic output type for the {@link getConfig | `getConfig()`} function.
 *
 * When an explicit type is provided, it takes precedence. Otherwise, the type is inferred
 * from the `transform` option: `json` returns a {@link JSONValue | `JSONValue`}, everything
 * else (`binary` or no transform) returns a `string`.
 */
type AppConfigAgentGetOutput<
  ExplicitUserProvidedType = undefined,
  InferredFromOptionsType = undefined,
> = undefined extends ExplicitUserProvidedType
  ? InferredFromOptionsType extends { transform: 'json' }
    ? JSONValue
    : string
  : ExplicitUserProvidedType;

/**
 * Return type of the {@link getConfig | `getConfig()`} function.
 *
 * Combines {@link AppConfigAgentGetOutput | `AppConfigAgentGetOutput`} with
 * {@link GetMaybeUndefined | `GetMaybeUndefined`}: the value type is inferred from the
 * `transform` option (or the explicit type parameter), and `undefined` is excluded from
 * the union when the `throwOnMissing` option is set to `true`.
 */
type AppConfigAgentGetConfigOutput<
  ExplicitUserProvidedType = undefined,
  InferredFromOptionsType = undefined,
> = GetMaybeUndefined<
  AppConfigAgentGetOutput<ExplicitUserProvidedType, InferredFromOptionsType>,
  InferredFromOptionsType
>;

export type {
  AppConfigAgentGetConfigOutput,
  AppConfigAgentGetOutput,
  GetConfigOptions,
};
