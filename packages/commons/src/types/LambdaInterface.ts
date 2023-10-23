import type { Handler } from 'aws-lambda';

type SyncHandler<T extends Handler> = (
  event: Parameters<T>[0],
  context: Parameters<T>[1],
  callback: Parameters<T>[2]
) => void;

type AsyncHandler<T extends Handler> = (
  event: Parameters<T>[0],
  context: Parameters<T>[1]
) => Promise<NonNullable<Parameters<Parameters<T>[2]>[1]>>;

interface LambdaInterface {
  handler: SyncHandler<Handler> | AsyncHandler<Handler>;
}

type HandlerMethodDecorator = (
  target: LambdaInterface,
  propertyKey: string | symbol,
  descriptor:
    | TypedPropertyDescriptor<SyncHandler<Handler>>
    | TypedPropertyDescriptor<AsyncHandler<Handler>>
) => void;

export type {
  AsyncHandler,
  SyncHandler,
  LambdaInterface,
  HandlerMethodDecorator,
};
