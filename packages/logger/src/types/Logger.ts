import type { HandlerMethodDecorator } from '@aws-lambda-powertools/commons/types';
import type { ConfigServiceInterface } from './ConfigServiceInterface.js';
import type {
  Environment,
  LogAttributes,
  LogAttributesWithMessage,
  LogLevel,
  LogFormatterInterface,
} from './Log.js';
import type { Context } from 'aws-lambda';

type LogFunction = {
  [key in Exclude<Lowercase<LogLevel>, 'silent'>]: (
    input: LogItemMessage,
    ...extraInput: LogItemExtraInput
  ) => void;
};

type InjectLambdaContextOptions = {
  logEvent?: boolean;
  /**
   * @deprecated Use `resetKeys` instead.
   */
  clearState?: boolean;
  /**
   * If `true`, the logger will reset the keys added via {@link `appendKeys()`}
   */
  resetKeys?: boolean;
};

/**
 * A custom JSON replacer function that can be passed to the Logger constructor.
 *
 * @param key - The key of the value being stringified.
 * @param value - The value being stringified.
 */
type CustomJsonReplacerFn = (key: string, value: unknown) => unknown;

type BaseConstructorOptions = {
  logLevel?: LogLevel;
  serviceName?: string;
  sampleRateValue?: number;
  logFormatter?: LogFormatterInterface;
  customConfigService?: ConfigServiceInterface;
  environment?: Environment;
  /**
   * A custom JSON replacer function that can be passed to the Logger constructor.
   */
  jsonReplacerFn?: CustomJsonReplacerFn;
};

type PersistentKeysOption = {
  /**
   * Keys that will be added in all log items.
   */
  persistentKeys?: LogAttributes;
  /**
   * @deprecated Use `persistentKeys` instead.
   */
  persistentLogAttributes?: never;
};

type DeprecatedOption = {
  /**
   * @deprecated Use `persistentKeys` instead.
   */
  persistentLogAttributes?: LogAttributes;
  /**
   * Keys that will be added in all log items.
   */
  persistentKeys?: never;
};

/**
 * Options for the Logger class constructor.
 *
 * @type {Object} ConstructorOptions
 * @property {LogLevel} [logLevel] - The log level.
 * @property {string} [serviceName] - The service name.
 * @property {number} [sampleRateValue] - The sample rate value.
 * @property {LogFormatterInterface} [logFormatter] - The custom log formatter.
 * @property {ConfigServiceInterface} [customConfigService] - The custom config service.
 * @property {Environment} [environment] - The environment.
 * @property {LogAttributes} [persistentKeys] - Keys that will be added in all log items.
 */
type ConstructorOptions = BaseConstructorOptions &
  (PersistentKeysOption | DeprecatedOption);

type LambdaFunctionContext = Pick<
  Context,
  | 'functionName'
  | 'memoryLimitInMB'
  | 'functionVersion'
  | 'invokedFunctionArn'
  | 'awsRequestId'
> & {
  coldStart: boolean;
};

type PowertoolsLogData = LogAttributes & {
  environment?: Environment;
  serviceName: string;
  sampleRateValue: number;
  lambdaContext?: LambdaFunctionContext;
  xRayTraceId?: string;
  awsRegion: string;
};

type UnformattedAttributes = PowertoolsLogData & {
  error?: Error;
  logLevel: LogLevel;
  timestamp: Date;
  message: string;
};

type LogItemMessage = string | LogAttributesWithMessage;
type LogItemExtraInput = [Error | string] | LogAttributes[];

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
  warn(input: LogItemMessage, ...extraInput: LogItemExtraInput): void;
};

export type {
  LogFunction,
  LoggerInterface,
  LogItemMessage,
  LogItemExtraInput,
  LambdaFunctionContext,
  UnformattedAttributes,
  PowertoolsLogData,
  ConstructorOptions,
  InjectLambdaContextOptions,
  CustomJsonReplacerFn,
};
