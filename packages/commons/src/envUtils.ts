import type {
  GetBooleanFromEnvOptions,
  GetNumberFromEnvOptions,
  GetStringFromEnvOptions,
} from './types/envUtils.js';

/**
 * Get a string from the environment variables.
 *
 * @example
 * ```ts
 * import { getStringFromEnv } from '@aws-lambda-powertools/commons/utils/env';
 *
 * const myEnvVar = getStringFromEnv({
 *   key: 'MY_ENV_VAR',
 *   errorMessage: 'MY_ENV_VAR is required for this function',
 * });
 * ```
 *
 * By default, the value is trimmed and always required.
 *
 * You can also provide a default value, which will be returned if the environment variable is not set instead of throwing an error.
 *
 * @example
 * ```ts
 * import { getStringFromEnv } from '@aws-lambda-powertools/commons/utils/env';
 *
 * const myEnvVar = getStringFromEnv({
 *   key: 'MY_ENV_VAR',
 *   defaultValue: 'defaultValue',
 * });
 * ```
 *
 * @param options - The options for getting the string.
 * @param options.key - The key of the environment variable.
 * @param options.defaultValue - Optional default value to return if the environment variable is not set.
 * @param options.errorMessage - Optional error message to throw if the environment variable is not set and no default value is provided. Defaults to `"Environment variable <key> is required"`.
 */
const getStringFromEnv = ({
  key,
  defaultValue,
  errorMessage,
}: GetStringFromEnvOptions): string => {
  const value = process.env[key];

  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    if (errorMessage) {
      throw new Error(errorMessage);
    }
    throw new Error(`Environment variable ${key} is required`);
  }

  return value.trim();
};

/**
 * Get a number from the environment variables.
 *
 * @example
 * ```ts
 * import { getNumberFromEnv } from '@aws-lambda-powertools/commons/utils/env';
 *
 * const myEnvVar = getNumberFromEnv({
 *   key: 'MY_ENV_VAR',
 *   errorMessage: 'MY_ENV_VAR is required for this function',
 * });
 * ```
 *
 * By default, the value is trimmed before being converted to a number and always required.
 *
 * You can also provide a default value, which will be returned if the environment variable is not set instead of throwing an error.
 *
 * @example
 * ```ts
 * import { getNumberFromEnv } from '@aws-lambda-powertools/commons/utils/env';
 *
 * const myEnvVar = getNumberFromEnv({
 *   key: 'MY_ENV_VAR',
 *   defaultValue: 42,
 * });
 * ```
 *
 * @param options - The options for getting the number.
 * @param options.key - The key of the environment variable.
 * @param options.defaultValue - The default value to return if the environment variable is not set.
 * @param options.errorMessage - Optional error message to throw if the environment variable is not set and no default value is provided. Defaults to `"Environment variable <key> is required"`.
 */
const getNumberFromEnv = ({
  key,
  defaultValue,
  errorMessage,
}: GetNumberFromEnvOptions): number => {
  const value = getStringFromEnv({
    key,
    defaultValue: String(defaultValue),
    errorMessage,
  });

  const parsedValue = Number(value);

  if (Number.isNaN(parsedValue)) {
    throw new Error(`Environment variable ${key} must be a number`);
  }

  return parsedValue;
};

/**
 * Get a boolean from the environment variables.
 *
 * @example
 * ```ts
 * import { getBooleanFromEnv } from '@aws-lambda-powertools/commons/utils/env';
 *
 * const myEnvVar = getBooleanFromEnv({
 *   key: 'MY_ENV_VAR',
 *   errorMessage: 'MY_ENV_VAR is required for this function',
 * });
 * ```
 *
 * By default, the value is trimmed before being converted to a boolean and always required.
 *
 * You can also provide a default value, which will be returned if the environment variable is not set instead of throwing an error.
 *
 * @example
 * ```ts
 * import { getBooleanFromEnv } from '@aws-lambda-powertools/commons/utils/env';
 *
 * const myEnvVar = getBooleanFromEnv({
 *   key: 'MY_ENV_VAR',
 *   defaultValue: true,
 * });
 * ```
 *
 * @param options - The options for getting the boolean.
 * @param options.key - The key of the environment variable.
 * @param options.defaultValue - The default value to return if the environment variable is not set.
 * @param options.errorMessage - Optional error message to throw if the environment variable is not set and no default value is provided. Defaults to `"Environment variable <key> is required"`.
 */
const getBooleanFromEnv = ({
  key,
  defaultValue,
  errorMessage,
}: GetBooleanFromEnvOptions): boolean => {
  const value = getStringFromEnv({
    key,
    defaultValue: String(defaultValue),
    errorMessage,
  });

  const parsedValue = value.toLowerCase();

  if (parsedValue !== 'true' && parsedValue !== 'false') {
    throw new Error(`Environment variable ${key} must be a boolean`);
  }

  return parsedValue === 'true';
};

const truthyValues = ['1', 'y', 'yes', 't', 'true', 'on'];

/**
 * Get a truthy boolean from the environment variables.
 *
 * Truthy values are: `1`, `y`, `yes`, `t`, `true`, `on`.
 *
 * @example
 * ```ts
 * import { getTruthyBooleanFromEnv } from '@aws-lambda-powertools/commons/utils/env';
 *
 * const myEnvVar = getTruthyBooleanFromEnv({
 *   key: 'MY_ENV_VAR',
 *   errorMessage: 'MY_ENV_VAR is required for this function',
 * });
 * ```
 *
 * By default, the value is trimmed before being converted to a boolean and always required.
 *
 * You can also provide a default value, which will be returned if the environment variable is not set instead of throwing an error.
 *
 * @example
 * ```ts
 * import { getTruthyBooleanFromEnv } from '@aws-lambda-powertools/commons/utils/env';
 *
 * const myEnvVar = getTruthyBooleanFromEnv({
 *   key: 'MY_ENV_VAR',
 *   defaultValue: true,
 * });
 * ```
 *
 * @param options - The options for getting the truthy boolean.
 * @param options.key - The key of the environment variable.
 * @param options.defaultValue - The default value to return if the environment variable is not set.
 * @param options.errorMessage - Optional error message to throw if the environment variable is not set and no default value is provided. Defaults to `"Environment variable <key> is required"`.
 */
const getTruthyBooleanFromEnv = ({
  key,
  defaultValue,
  errorMessage,
}: GetBooleanFromEnvOptions): boolean => {
  const value = getStringFromEnv({
    key,
    defaultValue: String(defaultValue),
    errorMessage,
  });

  return truthyValues.includes(value.toLowerCase());
};

const falsyValues = ['0', 'n', 'no', 'f', 'false', 'off'];

/**
 * Get a falsy boolean from the environment variables.
 *
 * Falsy values are: `0`, `n`, `no`, `f`, `false`, `off`.
 *
 * @example
 * ```ts
 * import { getFalsyBooleanFromEnv } from '@aws-lambda-powertools/commons/utils/env';
 *
 * const myEnvVar = getFalsyBooleanFromEnv({
 *   key: 'MY_ENV_VAR',
 *   errorMessage: 'MY_ENV_VAR is required for this function',
 * });
 * ```
 *
 * By default, the value is trimmed before being converted to a boolean and always required.
 *
 * You can also provide a default value, which will be returned if the environment variable is not set instead of throwing an error.
 *
 * @example
 * ```ts
 * import { getFalsyBooleanFromEnv } from '@aws-lambda-powertools/commons/utils/env';
 *
 * const myEnvVar = getFalsyBooleanFromEnv({
 *   key: 'MY_ENV_VAR',
 *   defaultValue: false,
 * });
 * ```
 *
 * @param options - The options for getting the falsy boolean.
 * @param options.key - The key of the environment variable.
 * @param options.defaultValue - The default value to return if the environment variable is not set.
 * @param options.errorMessage - Optional error message to throw if the environment variable is not set and no default value is provided. Defaults to `"Environment variable <key> is required"`.
 */
const getFalsyBooleanFromEnv = ({
  key,
  defaultValue,
  errorMessage,
}: GetBooleanFromEnvOptions): boolean => {
  const value = getStringFromEnv({
    key,
    defaultValue: String(defaultValue),
    errorMessage,
  });
  return falsyValues.includes(value.toLowerCase());
};

/**
 * Check if the current invocation is running in a development environment.
 *
 * This is determined by the `POWERTOOLS_DEV` environment variable.
 *
 * @example
 * ```ts
 * import { isDevMode } from '@aws-lambda-powertools/commons/utils/env';
 *
 * const isDev = isDevMode();
 * ```
 */
const isDevMode = (): boolean => {
  return getTruthyBooleanFromEnv({
    key: 'POWERTOOLS_DEV',
    defaultValue: false,
  });
};

/**
 * Get the service name from the environment variables.
 *
 * This is determined by the `POWERTOOLS_SERVICE_NAME` environment variable.
 *
 * @example
 * ```ts
 * import { getServiceName } from '@aws-lambda-powertools/commons/utils/env';
 *
 * const serviceName = getServiceName();
 * ```
 */
const getServiceName = (): string => {
  return getStringFromEnv({
    key: 'POWERTOOLS_SERVICE_NAME',
    defaultValue: '',
  });
};

export {
  getStringFromEnv,
  getNumberFromEnv,
  getBooleanFromEnv,
  getTruthyBooleanFromEnv,
  getFalsyBooleanFromEnv,
  isDevMode,
  getServiceName,
};
