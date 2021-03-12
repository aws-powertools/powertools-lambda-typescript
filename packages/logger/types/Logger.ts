import { ConfigServiceInterface } from '../src/config';
import { LogFormatterInterface } from '../src/formatter';
import { Environment, LogAttributes, LogLevel } from './Log';

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

type LoggerData = LogAttributes & {
  environment?: Environment
  serviceName: string
  sampleRateValue: number
  lambdaFunctionContext: LambdaFunctionContext
  xRayTraceId?: string
  awsRegion: string
};

type UnformattedAttributes = LoggerData & {
  environment?: Environment
  serviceName: string
  sampleRateValue: number
  lambdaContext?: LambdaFunctionContext
  xRayTraceId?: string
  awsRegion: string
  logLevel: LogLevel
  timestamp: Date
  message: string
};

export {
  LambdaFunctionContext,
  UnformattedAttributes,
  LoggerData,
  LoggerOptions
};