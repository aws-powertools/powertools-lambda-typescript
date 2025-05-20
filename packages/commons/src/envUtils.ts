import { isNumber } from './typeUtils.js';

type GetFromEnvOptions = {
  key: string;
  defaultValue?: unknown;
  required?: boolean;
};

/**
 * Get a string from the environment variables.
 *
 * @param {Object} options - The options for getting the string.
 * @param {string} options.key - The key of the environment variable.
 * @param {string} [options.defaultValue] - The default value to return if the environment variable is not set.
 * @param {boolean} [options.required] - Whether the environment variable is required.
 */
const getStringFromEnv = ({
  key,
  defaultValue,
  required,
}: GetFromEnvOptions): string => {
  const value = process.env[key];

  if (value === undefined) {
    if (required === true) {
      throw new Error(`Environment variable ${key} is required`);
    }

    return String(defaultValue) ?? '';
  }

  return value.trim();
};

/**
 * Get a number from the environment variables.
 *
 * @param {Object} options - The options for getting the number.
 * @param {string} options.key - The key of the environment variable.
 * @param {number} [options.defaultValue] - The default value to return if the environment variable is not set.
 * @param {boolean} [options.required] - Whether the environment variable is required.
 */
const getNumberFromEnv = ({
  key,
  defaultValue,
  required,
}: GetFromEnvOptions): number => {
  const value = getStringFromEnv({
    key,
    defaultValue: String(defaultValue),
    required,
  }) as unknown;

  if (!isNumber(value)) {
    throw new Error(`Environment variable ${key} must be a number`);
  }

  return value;
};

/**
 * Get a boolean from the environment variables.
 *
 * @param {Object} options - The options for getting the boolean.
 * @param {string} options.key - The key of the environment variable.
 * @param {boolean} [options.defaultValue] - The default value to return if the environment variable is not set.
 * @param {boolean} [options.required] - Whether the environment variable is required.
 */
const getBooleanFromEnv = ({
  key,
  defaultValue,
  required,
}: GetFromEnvOptions): boolean => {
  const value = getStringFromEnv({
    key,
    defaultValue: String(defaultValue),
    required,
  });

  const parsedValue = value.toLowerCase();

  if (parsedValue !== 'true' && parsedValue !== 'false') {
    throw new Error(`Environment variable ${key} must be a boolean`);
  }

  return Boolean(parsedValue);
};

const truthyValues = ['1', 'y', 'yes', 't', 'true', 'on'];

/**
 * Get a truthy boolean from the environment variables.
 *
 * Truthy values are: `1`, `y`, `yes`, `t`, `true`, `on`.
 *
 * @param {Object} options - The options for getting the truthy boolean.
 * @param {string} options.key - The key of the environment variable.
 * @param {boolean} [options.defaultValue] - The default value to return if the environment variable is not set.
 * @param {boolean} [options.required] - Whether the environment variable is required.
 */
const getTruthyBooleanFromEnv = ({
  key,
  defaultValue,
  required,
}: GetFromEnvOptions): boolean => {
  const value = getStringFromEnv({
    key,
    defaultValue: String(defaultValue),
    required,
  });

  return truthyValues.includes(value.toLowerCase());
};

const falsyValues = ['0', 'n', 'no', 'f', 'false', 'off'];

/**
 * Get a falsy boolean from the environment variables.
 *
 * Falsy values are: `0`, `n`, `no`, `f`, `false`, `off`.
 *
 * @param {Object} options - The options for getting the falsy boolean.
 * @param {string} options.key - The key of the environment variable.
 * @param {boolean} [options.defaultValue] - The default value to return if the environment variable is not set.
 * @param {boolean} [options.required] - Whether the environment variable is required.
 */
const getFalsyBooleanFromEnv = ({
  key,
  defaultValue,
  required,
}: GetFromEnvOptions): boolean => {
  const value = getStringFromEnv({
    key,
    defaultValue: String(defaultValue),
    required,
  });
  return falsyValues.includes(value.toLowerCase());
};

/**
 * Check if the current invocation is running in a development environment.
 *
 * This is determined by the `POWERTOOLS_DEV` environment variable.
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
