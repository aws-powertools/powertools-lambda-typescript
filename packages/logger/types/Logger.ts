import { ConfigServiceInterface } from '../src/config';
import { LogFormatterInterface } from '../src/formatter';
import { Environment, LogAttributes, LogAttributesWithMessage, LogLevel } from './Log';

type LoggerOptions = {
  logLevel?: LogLevel
  serviceName?: string
  sampleRateValue?: number
  logFormatter?: LogFormatterInterface
  customConfigService?: ConfigServiceInterface
  customAttributes?: LogAttributes
  environment?: Environment
};

type LambdaFunctionContext = {
  name: string
  memoryLimitInMB: number
  version: string
  coldStart: boolean
  arn: string
  awsRequestId: string
};

type PowertoolAttributes = LogAttributes & {
  environment?: Environment
  serviceName: string
  sampleRateValue?: number
  lambdaFunctionContext: LambdaFunctionContext
  xRayTraceId?: string
  awsRegion: string
};

type UnformattedAttributes = PowertoolAttributes & {
  environment?: Environment
  error?: Error
  serviceName: string
  sampleRateValue?: number
  lambdaContext?: LambdaFunctionContext
  xRayTraceId?: string
  awsRegion: string
  logLevel: LogLevel
  timestamp: Date
  message: string
};

type LoggerInput = string | LogAttributesWithMessage;
type LoggerExtraInput = Array<Error | LogAttributes>;

export {
  LoggerInput,
  LoggerExtraInput,
  LambdaFunctionContext,
  UnformattedAttributes,
  PowertoolAttributes,
  LoggerOptions
};