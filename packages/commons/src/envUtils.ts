import {
  POWERTOOLS_DEV_ENV_VAR,
  POWERTOOLS_SERVICE_NAME_ENV_VAR,
  XRAY_TRACE_ID_ENV_VAR,
} from './constants.js';
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

const truthyValues = new Set(['1', 'y', 'yes', 't', 'true', 'on']);

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

  return truthyValues.has(value.toLowerCase());
};

const falsyValues = new Set(['0', 'n', 'no', 'f', 'false', 'off']);

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
  return falsyValues.has(value.toLowerCase());
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
    key: POWERTOOLS_DEV_ENV_VAR,
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
    key: POWERTOOLS_SERVICE_NAME_ENV_VAR,
    defaultValue: '',
  });
};

/**
 * Get the AWS X-Ray Trace data from the environment variable.
 *
 * The method parses the environment variable `_X_AMZN_TRACE_ID` and returns an object with the key-value pairs.
 */
const getXrayTraceDataFromEnv = (): Record<string, string> | undefined => {
  const xRayTraceEnv = getStringFromEnv({
    key: XRAY_TRACE_ID_ENV_VAR,
    defaultValue: '',
  });
  if (xRayTraceEnv === '') {
    return undefined;
  }
  if (!xRayTraceEnv.includes('=')) {
    return {
      Root: xRayTraceEnv,
    };
  }
  const xRayTraceData: Record<string, string> = {};

  for (const field of xRayTraceEnv.split(';')) {
    const [key, value] = field.split('=');

    xRayTraceData[key] = value;
  }

  return xRayTraceData;
};

/**
 * Determine if the current invocation is part of a sampled X-Ray trace.
 *
 * The AWS X-Ray Trace data available in the environment variable has this format:
 * `Root=1-5759e988-bd862e3fe1be46a994272793;Parent=557abcec3ee5a047;Sampled=1`,
 */
const isRequestXRaySampled = (): boolean => {
  const xRayTraceData = getXrayTraceDataFromEnv();
  return xRayTraceData?.Sampled === '1';
};

/**
 * Get the value of the `_X_AMZN_TRACE_ID` environment variable.
 *
 * The AWS X-Ray Trace data available in the environment variable has this format:
 * `Root=1-5759e988-bd862e3fe1be46a994272793;Parent=557abcec3ee5a047;Sampled=1`,
 *
 * The actual Trace ID is: `1-5759e988-bd862e3fe1be46a994272793`.
 */
const getXRayTraceIdFromEnv = (): string | undefined => {
  const xRayTraceData = getXrayTraceDataFromEnv();
  return xRayTraceData?.Root;
};

export {
  getStringFromEnv,
  getNumberFromEnv,
  getBooleanFromEnv,
  getTruthyBooleanFromEnv,
  getFalsyBooleanFromEnv,
  isDevMode,
  getServiceName,
  getXrayTraceDataFromEnv,
  isRequestXRaySampled,
  getXRayTraceIdFromEnv,
};
