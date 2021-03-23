import { ConfigServiceInterface } from '../src/config';
import { Handler } from 'aws-lambda';
import { LambdaInterface } from '../src/lambda';
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
  isContextEnabled?: boolean
};

type LambdaFunctionContext = {
  name: string
  memoryLimitInMB: number
  version: string
  coldStart: boolean
  arn: string
  awsRequestId: string
};

type PowertoolLogAttributes = LogAttributes & {
  environment?: Environment
  serviceName: string
  sampleRateValue?: number
  lambdaFunctionContext: LambdaFunctionContext
  xRayTraceId?: string
  awsRegion: string
};

type UnformattedAttributes = PowertoolLogAttributes & {
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

type HandlerMethodDecorator = (target: LambdaInterface, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<Handler>) => TypedPropertyDescriptor<Handler> | void;

export {
  HandlerMethodDecorator,
  LoggerInput,
  LoggerExtraInput,
  LambdaFunctionContext,
  UnformattedAttributes,
  PowertoolLogAttributes,
  LoggerOptions
};