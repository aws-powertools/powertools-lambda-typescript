import { ConfigServiceInterface } from "../src/config";
import { Handler } from 'aws-lambda';
import { LambdaInterface } from '../examples/utils/lambda';

type ClassThatTraces = {
    putAnnotation: (key: string, value: string | number | boolean) => void,
    putMetadata: (key: string, value: any, namespace?: string | undefined) => void
};

type TracerOptions = {
    disabled?: boolean
    serviceName?: string
    customConfigService?: ConfigServiceInterface
};

type HandlerMethodDecorator = (target: LambdaInterface, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<Handler>) => TypedPropertyDescriptor<Handler> | void;

export {
    ClassThatTraces,
    TracerOptions,
    HandlerMethodDecorator
}