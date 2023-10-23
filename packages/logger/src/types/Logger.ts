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
  clearState?: boolean;
};

type ConstructorOptions = {
  logLevel?: LogLevel;
  serviceName?: string;
  sampleRateValue?: number;
  logFormatter?: LogFormatterInterface;
  customConfigService?: ConfigServiceInterface;
  persistentLogAttributes?: LogAttributes;
  environment?: Environment;
};

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
};
