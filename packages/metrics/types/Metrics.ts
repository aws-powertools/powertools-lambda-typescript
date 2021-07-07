import { ConfigServiceInterface } from '../src/config';
import { Handler } from 'aws-lambda';
import { LambdaInterface } from '../src/lambda';
import { MetricUnit } from './MetricUnit';

type Dimensions = {[key: string]: string};

type MetricsOptions = {
  customConfigService?: ConfigServiceInterface
  namespace?: string
  service?: string
  singleMetric?: boolean
};

type EmfOutput = {

  [key: string]: string | number | object
  '_aws': {
    Timestamp: number
    CloudWatchMetrics: {
      Namespace: string
      Dimensions: [string[]]
      Metrics: { Name: string; Unit:MetricUnit }[]
    }[]
  }
};

type HandlerMethodDecorator = (target: LambdaInterface, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<Handler>) => TypedPropertyDescriptor<Handler> | void;

type DecoratorOptions = {
  raiseOnEmptyMetrics?: boolean
  defaultDimensions?: Dimensions
  captureColdStartMetric?: boolean
};

export {
  DecoratorOptions,
  Dimensions,
  EmfOutput,
  MetricsOptions,
  HandlerMethodDecorator
};