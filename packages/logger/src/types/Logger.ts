import { ConfigServiceInterface } from './ConfigServiceInterface.js';
import { LogFormatterInterface } from './LogFormatterInterface.js';
import type {
  Environment,
  LogAttributes,
  LogAttributesWithMessage,
  LogLevel,
} from './Log.js';
import type { Context } from 'aws-lambda';

type ClassThatLogs = {
  [key in Exclude<Lowercase<LogLevel>, 'silent'>]: (
    input: LogItemMessage,
    ...extraInput: LogItemExtraInput
  ) => void;
};

// TODO: see if we can rename this
type HandlerOptions = {
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

type LoggerInterface = ClassThatLogs & {
  addContext(context: Context): void;
  addPersistentLogAttributes(attributes?: LogAttributes): void;
  appendKeys(attributes?: LogAttributes): void;
};

export {
  LoggerInterface,
  ClassThatLogs,
  LogItemMessage,
  LogItemExtraInput,
  LambdaFunctionContext,
  UnformattedAttributes,
  PowertoolsLogData,
  ConstructorOptions,
  HandlerOptions,
};
