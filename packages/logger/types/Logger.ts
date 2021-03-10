import { LogFormatterInterface } from '../src/formatter';
import { ConfigServiceInterface } from '../src/config';
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

type LoggerAttributes = {
  serviceName: string
  sampleRateValue?: number
  functionName: string
  xRayTraceId?: string
  coldStart: boolean
  memoryLimitInMB: number
  env: string
  awsRegion: string
  functionVersion: string
  logLevel: LogLevel
};

export {
  LoggerAttributes,
  LoggerOptions
};