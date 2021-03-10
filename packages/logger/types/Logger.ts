import { LogFormatterInterface } from '../src/formatter';
import { ConfigServiceInterface } from '../src/config';
import { Environment, LogAttributes, LogLevel } from './Log';
import { Context } from 'aws-lambda';

type LoggerOptions = {
  logLevel?: LogLevel
  serviceName?: string
  sampleRateValue?: number
  logFormatter?: LogFormatterInterface
  customConfigService?: ConfigServiceInterface
  customAttributes?: LogAttributes
  environment?: Environment
};

type DefaultLoggerAttributes = LogAttributes | {[key in keyof Context]: Context[key]} | {
  awsRequestId?: string
  environment?: Environment
  serviceName?: string
  sampleRateValue?: number
  functionName?: string
  xRayTraceId?: string
  memoryLimitInMB?: number
  coldStart?: boolean
  awsRegion?: string
  functionVersion?: string
  invokedFunctionArn?: string
  logLevel?: LogLevel
  timestamp?: Date
  message?: string
};

type UnformattedAttributes = DefaultLoggerAttributes & {
  awsRequestId?: string
  environment?: Environment
  serviceName: string
  sampleRateValue?: number
  functionName: string
  xRayTraceId?: string
  memoryLimitInMB?: number
  invokedFunctionArn?: string
  awsRegion: string
  coldStart: boolean
  functionVersion: string
  logLevel: LogLevel
  timestamp: Date
  message: string
};

export {
  UnformattedAttributes,
  DefaultLoggerAttributes,
  LoggerOptions
};