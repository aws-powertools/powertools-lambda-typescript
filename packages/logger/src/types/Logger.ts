import {
  AsyncHandler,
  LambdaInterface,
  SyncHandler,
} from '@aws-lambda-powertools/commons';
import { Handler } from 'aws-lambda';
import { ConfigServiceInterface } from '../config/ConfigServiceInterface.js';
import { LogFormatterInterface } from '../formatter/LogFormatterInterface.js';
import {
  Environment,
  LogAttributes,
  LogAttributesWithMessage,
  LogLevel,
} from './Log.js';

type ClassThatLogs = {
  [key in Exclude<Lowercase<LogLevel>, 'silent'>]: (
    input: LogItemMessage,
    ...extraInput: LogItemExtraInput
  ) => void;
};

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

type LambdaFunctionContext = {
  functionName: string;
  memoryLimitInMB: number;
  functionVersion: string;
  coldStart: boolean;
  invokedFunctionArn: string;
  awsRequestId: string;
};

type PowertoolLogData = LogAttributes & {
  environment?: Environment;
  serviceName: string;
  sampleRateValue?: number;
  lambdaFunctionContext: LambdaFunctionContext;
  xRayTraceId?: string;
  awsRegion: string;
};

type UnformattedAttributes = {
  environment?: Environment;
  error?: Error;
  serviceName: string;
  sampleRateValue?: number;
  lambdaContext?: LambdaFunctionContext;
  xRayTraceId?: string;
  awsRegion: string;
  logLevel: LogLevel;
  timestamp: Date;
  message: string;
};

type LogItemMessage = string | LogAttributesWithMessage;
type LogItemExtraInput = [Error | string] | LogAttributes[];

type HandlerMethodDecorator = (
  target: LambdaInterface,
  propertyKey: string | symbol,
  descriptor:
    | TypedPropertyDescriptor<SyncHandler<Handler>>
    | TypedPropertyDescriptor<AsyncHandler<Handler>>
) => void;

export {
  ClassThatLogs,
  LogItemMessage,
  LogItemExtraInput,
  HandlerMethodDecorator,
  LambdaFunctionContext,
  UnformattedAttributes,
  PowertoolLogData,
  ConstructorOptions,
  HandlerOptions,
};

export const enum LogJsonIndent {
  PRETTY = 4,
  COMPACT = 0,
}
