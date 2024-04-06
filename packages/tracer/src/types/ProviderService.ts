import type { Namespace } from 'cls-hooked';
import type { Segment, Subsegment } from 'aws-xray-sdk-core';

type ContextMissingStrategy =
  | 'LOG_ERROR'
  | 'RUNTIME_ERROR'
  | 'IGNORE_ERROR'
  | ((msg: string) => void);

interface ProviderServiceInterface {
  getNamespace(): Namespace;

  getSegment(): Segment | Subsegment | undefined;

  setSegment(segment: Segment | Subsegment): void;

  setLogger(logObj: unknown): void;

  setDaemonAddress(address: string): void;

  setContextMissingStrategy(strategy: ContextMissingStrategy): void;

  captureAWS<T>(awsservice: T): T;

  captureAWSClient<T>(awsservice: T): T;

  captureAWSv3Client<T>(awsservice: T): T;

  captureAsyncFunc(
    name: string,
    fcn: (subsegment?: Subsegment) => unknown,
    parent?: Segment | Subsegment
  ): unknown;

  captureFunc(
    name: string,
    fcn: (subsegment?: Subsegment) => unknown,
    parent?: Segment | Subsegment
  ): unknown;

  captureHTTPsGlobal(): void;

  /**
   * Instrument `fetch` requests with AWS X-Ray
   */
  instrumentFetch(): void;

  putAnnotation(key: string, value: string | number | boolean): void;

  putMetadata(key: string, value: unknown, namespace?: string): void;
}

/**
 * Subsegment that contains information for a request made to a remote service
 */
interface HttpSubsegment extends Subsegment {
  namespace: 'remote';
  http: {
    request?: {
      url: string;
      method?: string;
    };
    response?: {
      status: number;
      content_length?: number;
    };
  };
}

export type {
  ProviderServiceInterface,
  ContextMissingStrategy,
  HttpSubsegment,
};
