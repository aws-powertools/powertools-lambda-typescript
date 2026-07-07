import type { JSONValue } from '@aws-lambda-powertools/commons/types';
import type { getConfig } from '../appconfig-agent/getConfig.js';

/**
 * Base options for the {@link getConfig | `getConfig()`} function.
 *
 * @property environment - The environment ID or the environment name.
 * @property application - The application ID or the application name, if not provided it will be inferred from the service name in the environment.
 * @property timeout - Optional timeout in milliseconds for the request to the AWS AppConfig Agent (default: `3000`).
 */
type GetConfigOptionsBase = {
  /**
   * The environment ID or the environment name.
   */
  environment: string;
  /**
   * The application ID or the application name, if not provided it will be inferred from the service name in the environment (`POWERTOOLS_SERVICE_NAME`).
   */
  application?: string;
  /**
   * Optional timeout in milliseconds for the request to the AWS AppConfig Agent (default: `3000`).
   */
  timeout?: number;
};

type GetConfigOptionsTransformJson = GetConfigOptionsBase & {
  transform: 'json';
};

type GetConfigOptionsTransformBinary = GetConfigOptionsBase & {
  transform: 'binary';
};

type GetConfigOptionsTransformNone = GetConfigOptionsBase & {
  transform?: never;
};

/**
 * Options for the {@link getConfig | `getConfig()`} function.
 *
 * @property environment - The environment ID or the environment name.
 * @property application - The application ID or the application name, if not provided it will be inferred from the service name in the environment.
 * @property transform - Optional transform to be applied, can be `json` or `binary`.
 * @property timeout - Optional timeout in milliseconds for the request to the AWS AppConfig Agent (default: `3000`).
 */
type GetConfigOptions =
  | GetConfigOptionsTransformNone
  | GetConfigOptionsTransformJson
  | GetConfigOptionsTransformBinary;

/**
 * Generic output type for the {@link getConfig | `getConfig()`} function.
 */
type AppConfigAgentGetOutput<
  ExplicitUserProvidedType = undefined,
  InferredFromOptionsType = undefined,
> = undefined extends ExplicitUserProvidedType
  ? InferredFromOptionsType extends GetConfigOptionsTransformBinary
    ? string
    : InferredFromOptionsType extends GetConfigOptionsTransformJson
      ? JSONValue
      : string
  : ExplicitUserProvidedType;

export type { AppConfigAgentGetOutput, GetConfigOptions };
