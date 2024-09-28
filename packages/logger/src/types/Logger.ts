import type { HandlerMethodDecorator } from '@aws-lambda-powertools/commons/types';
import type { Context } from 'aws-lambda';
import type { LogLevel as LogLevelList } from '../constants.js';
import type { LogFormatter } from '../formatter/LogFormatter.js';
import type { ConfigServiceInterface } from './ConfigServiceInterface.js';
import type { LogRecordOrderKeys } from './formatters.js';
import type {
  Environment,
  LogAttributes,
  LogAttributesWithMessage,
} from './logKeys.js';

/**
 * Type definition for the log level.
 *
 * It includes the lowercase and uppercase versions of each log level.
 */
type LogLevel =
  | (typeof LogLevelList)[keyof typeof LogLevelList]
  | Lowercase<(typeof LogLevelList)[keyof typeof LogLevelList]>;

/**
 * Type definition for a function that logs messages at different levels to the console.
 */
type LogFunction = {
  [key in Exclude<Lowercase<LogLevel>, 'silent'>]: (
    input: LogItemMessage,
    ...extraInput: LogItemExtraInput
  ) => void;
};

/**
 * Options for the {@link LoggerInterface.injectLambdaContext()} method.
 */
type InjectLambdaContextOptions = {
  /**
   * When `true` the logger will log the event.
   *
   * To avoid logging sensitive information, we recommend using this option only for debugging purposes in local environments.
   */
  logEvent?: boolean;
  /**
   * @deprecated Use {@link InjectLambdaContextOptions.resetKeys()}` instead.
   */
  clearState?: boolean;
  /**
   * If `true`, the logger will reset the keys added via {@link LoggerInterface.appendKeys()}
   */
  resetKeys?: boolean;
};

/**
 * A custom JSON replacer function that can be passed to the Logger constructor to extend the default serialization behavior.
 *
 * By default, we already extend the default serialization behavior to handle `BigInt` and `Error` objects, as well as remove circular references.
 * When a custom JSON replacer function is passed to the Logger constructor, it will be called **before** our custom rules for each key-value pair in the object being stringified.
 *
 * This allows you to customize the serialization while still benefiting from the default behavior.
 *
 * @param key - The key of the value being stringified.
 * @param value - The value being stringified.
 */
type CustomJsonReplacerFn = (key: string, value: unknown) => unknown;

/**
 * Base constructor options for the Logger class.
 */
type BaseConstructorOptions = {
  /**
   * The level threshold for the logger to log at.
   */
  logLevel?: LogLevel;
  /**
   * Service name to be included in log items for easier correlation.
   */
  serviceName?: string;
  /**
   * The percentage rate at which the log level is `DEBUG`.
   *
   * See {@link https://docs.powertools.aws.dev/lambda/typescript/latest/core/logger/#sampling-debug-logs | Sampling debug logs} for more information.
   */
  sampleRateValue?: number;
  /**
   * A custom config service that can be passed to the Logger constructor to extend the default behavior.
   *
   * See {@link ConfigServiceInterface} for more information.
   */
  customConfigService?: ConfigServiceInterface;
  /**
   * The environment in which the Lambda function is running.
   */
  environment?: Environment;
  /**
   * A custom JSON replacer function that can be passed to the Logger constructor to extend the default serialization behavior.
   *
   * By default, we already extend the default serialization behavior to handle `BigInt` and `Error` objects, as well as remove circular references.
   * When a custom JSON replacer function is passed to the Logger constructor, it will be called **before** our custom rules for each key-value pair in the object being stringified.
   *
   * This allows you to customize the serialization while still benefiting from the default behavior.
   */
  jsonReplacerFn?: CustomJsonReplacerFn;
};

/**
 * Options for the `persistentKeys` constructor option.
 */
type PersistentKeysOption = {
  /**
   * Keys that will be added to all log items.
   */
  persistentKeys?: LogAttributes;
  /**
   * @deprecated Use `persistentKeys` instead.
   */
  persistentLogAttributes?: never;
};

/**
 * Deprecated options for the `persistentLogAttributes` constructor option.
 *
 * Used to maintain backwards compatibility with the `persistentLogAttributes` option.
 */
type DeprecatedPersistentKeysOption = {
  /**
   * @deprecated Use `persistentKeys` instead.
   */
  persistentLogAttributes?: LogAttributes;
  /**
   * Keys that will be added to all log items.
   */
  persistentKeys?: never;
};

/**
 * Options for the `logFormatter` constructor option.
 *
 * Used to make the `logFormatter` option mutually exclusive with the `logRecordOrder` option.
 */
type LogFormatterOption = {
  /**
   * The custom log formatter to process log attributes.
   *
   * See {@link https://docs.powertools.aws.dev/lambda/typescript/latest/core/logger/#custom-log-formatter-bring-your-own-formatter | Custom Log Formatters} for more information.
   */
  logFormatter?: LogFormatter;
  /**
   * Optional list of keys to specify order of the keys in logs.
   */
  logRecordOrder?: never;
};

/**
 * Options for the `logRecordOrder` constructor option.
 *
 * Used to make the `logRecordOrder` option mutually exclusive with the `logFormatter` option.
 */
type LogRecordOrderOption = {
  /**
   * Optional list of keys to specify order of the keys in logs.
   */
  logRecordOrder?: LogRecordOrderKeys;
  /**
   * The custom log formatter.
   */
  logFormatter?: never;
};

/**
 * Options to configure the Logger.
 */
type ConstructorOptions = BaseConstructorOptions &
  (PersistentKeysOption | DeprecatedPersistentKeysOption) &
  (LogFormatterOption | LogRecordOrderOption);

type LogItemMessage = string | LogAttributesWithMessage;
type LogItemExtraInput = [Error | string] | LogAttributes[];

/**
 * Interface for the Logger class.
 */
type LoggerInterface = {
  addContext(context: Context): void;
  addPersistentLogAttributes(attributes?: LogAttributes): void;
  appendKeys(attributes?: LogAttributes): void;
  createChild(options?: ConstructorOptions): LoggerInterface;
  critical(input: LogItemMessage, ...extraInput: LogItemExtraInput): void;
  debug(input: LogItemMessage, ...extraInput: LogItemExtraInput): void;
  error(input: LogItemMessage, ...extraInput: LogItemExtraInput): void;
  getLevelName(): Uppercase<LogLevel>;
  getLogEvent(): boolean;
  getPersistentLogAttributes(): LogAttributes;
  info(input: LogItemMessage, ...extraInput: LogItemExtraInput): void;
  injectLambdaContext(
    options?: InjectLambdaContextOptions
  ): HandlerMethodDecorator;
  logEventIfEnabled(event: unknown, overwriteValue?: boolean): void;
  refreshSampleRateCalculation(): void;
  removeKeys(keys?: string[]): void;
  removePersistentLogAttributes(keys?: string[]): void;
  setLogLevel(logLevel: LogLevel): void;
  setPersistentLogAttributes(attributes?: LogAttributes): void;
  shouldLogEvent(overwriteValue?: boolean): boolean;
  trace(input: LogItemMessage, ...extraInput: LogItemExtraInput): void;
  warn(input: LogItemMessage, ...extraInput: LogItemExtraInput): void;
};

export type {
  Environment,
  LogAttributes,
  LogLevel,
  LogFunction,
  LoggerInterface,
  LogItemMessage,
  LogItemExtraInput,
  ConstructorOptions,
  InjectLambdaContextOptions,
  CustomJsonReplacerFn,
};
