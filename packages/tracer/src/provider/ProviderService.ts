import type { Logger, Segment, Subsegment } from 'aws-xray-sdk-core';
import xraySdk from 'aws-xray-sdk-core';
import type { Namespace } from 'cls-hooked';
import type {
  ContextMissingStrategy,
  HttpSubsegment,
  ProviderServiceInterface,
} from '../types/ProviderService.js';

const {
  captureAWS,
  captureAWSClient,
  captureAWSv3Client,
  captureAsyncFunc,
  captureFunc,
  captureHTTPsGlobal,
  getNamespace,
  getSegment,
  setSegment,
  Segment: XraySegment,
  setContextMissingStrategy,
  setDaemonAddress,
  setLogger,
} = xraySdk;

import { subscribe } from 'node:diagnostics_channel';
import http from 'node:http';
import https from 'node:https';
import type { InvokeStoreBase } from '@aws/lambda-invoke-store';
import '@aws/lambda-invoke-store';
import { addUserAgentMiddleware } from '@aws-lambda-powertools/commons';
import {
  getXRayTraceIdFromEnv,
  shouldUseInvokeStore,
} from '@aws-lambda-powertools/commons/utils/env';
import type { DiagnosticsChannel } from 'undici-types';
import {
  findHeaderAndDecode,
  getRequestURL,
  isHttpSubsegment,
} from './utilities.js';

/**
 * The ProviderService class is a wrapper around the AWS X-Ray SDK for Node.js.
 *
 * The service provides exposes a selection of methods to interact with the SDK directly,
 * these methods were chosen to be the most useful in the context of a Lambda function and
 * have been tested to work with Powertools for AWS Lambda.
 *
 * If you want to use one of the other methods that are not exposed by this class,
 * you can import the methods directly from the `aws-xray-sdk-core` package, and for most cases,
 * they should work as expected. However, support for these methods is not guaranteed.
 */
class ProviderService implements ProviderServiceInterface {
  /**
   * Key used to store the active segment in the Lambda Invoke Store when
   * multiple invocations may be multiplexed into the same execution
   * environment (Lambda Managed Instances with
   * `perExecutionEnvironmentMaxConcurrency` > 1).
   *
   * In Lambda mode the X-Ray SDK keeps the active segment in a single
   * process-wide CLS context shared by all concurrent invocations, so
   * writing to it from one invocation clobbers the others. The Invoke Store
   * is scoped to the invocation by the runtime, so it provides the isolation
   * the SDK context can't.
   */
  readonly #segmentKey = Symbol('powertools.tracer.segment');

  #getInvokeStore(): InvokeStoreBase {
    const store = globalThis.awslambda?.InvokeStore;
    if (store === undefined) {
      throw new Error('InvokeStore is not available');
    }
    return store;
  }

  /**
   * @deprecated Use {@link captureAWSv3Client} instead.
   */
  /* v8 ignore next -- @preserve */ public captureAWS<T>(awssdk: T): T {
    return captureAWS(awssdk);
  }

  /**
   * @deprecated Use {@link captureAWSv3Client} instead.
   */
  /* v8 ignore next -- @preserve */ public captureAWSClient<T>(service: T): T {
    return captureAWSClient(service);
  }

  public captureAWSv3Client<T>(service: T): T {
    addUserAgentMiddleware(service, 'tracer');

    // biome-ignore lint/suspicious/noExplicitAny: Type must be aliased as any because of this https://github.com/aws/aws-xray-sdk-node/issues/439#issuecomment-859715660
    return captureAWSv3Client(service as any);
  }

  public captureAsyncFunc(
    name: string,
    fcn: (subsegment?: Subsegment) => unknown,
    _parent?: Segment | Subsegment
  ): unknown {
    return captureAsyncFunc(name, fcn);
  }

  public captureFunc(
    name: string,
    fcn: (subsegment?: Subsegment) => unknown,
    _parent?: Segment | Subsegment
  ): unknown {
    return captureFunc(name, fcn);
  }

  public captureHTTPsGlobal(): void {
    captureHTTPsGlobal(http);
    captureHTTPsGlobal(https);
  }

  public getNamespace(): Namespace {
    return getNamespace();
  }

  public getSegment(): Segment | Subsegment | undefined {
    if (shouldUseInvokeStore()) {
      // The facade segment isn't stored per-invocation: it's created by the
      // X-Ray SDK at init and lives in its process-wide context, so when the
      // current invocation hasn't set an active segment yet we fall through
      // to the SDK
      const segment = this.#getInvokeStore().get<Segment | Subsegment>(
        this.#segmentKey
      );
      if (segment !== undefined) {
        return segment;
      }
    }
    return getSegment();
  }

  /**
   * Instrument `fetch` requests with AWS X-Ray
   *
   * The instrumentation is done by subscribing to the `undici` events. When a request is created,
   * a new subsegment is created with the hostname of the request.
   *
   * Then, when the headers are received, the subsegment is updated with the request and response details.
   *
   * Finally, when the request is completed, the subsegment is closed.
   *
   * @see {@link https://nodejs.org/api/diagnostics_channel.html#diagnostics_channel_channel_publish | Diagnostics Channel - Node.js Documentation}
   */
  public instrumentFetch(): void {
    /**
     * Create a segment at the start of a request made with `undici` or `fetch`.
     *
     * That `message` must be `unknown` because that's the type expected by `subscribe`
     *
     * @param message The message received from the `undici` channel
     */
    const onRequestStart = (message: unknown): void => {
      const { request } = message as DiagnosticsChannel.RequestCreateMessage;
      const method = request.method;
      if (method === 'CONNECT') return;

      const parentSubsegment = this.getSegment();
      const requestURL = getRequestURL(request);
      if (parentSubsegment && requestURL) {
        const subsegment = parentSubsegment.addNewSubsegment(
          requestURL.hostname
        );
        subsegment.addAttribute('namespace', 'remote');

        // addHeader is not part of the type definition but it's available https://github.com/nodejs/undici/blob/main/docs/docs/api/DiagnosticsChannel.md#undicirequestcreate
        // @ts-expect-error
        request.addHeader(
          'X-Amzn-Trace-Id',
          `Root=${getXRayTraceIdFromEnv()};Parent=${subsegment.id};Sampled=${subsegment.notTraced ? '0' : '1'}`
        );

        (subsegment as HttpSubsegment).http = {
          request: {
            url: `${requestURL.protocol}//${requestURL.hostname}${requestURL.pathname}`,
            method,
          },
        };

        this.setSegment(subsegment);
      }
    };

    /**
     * Enrich the subsegment with the response details, and close it.
     * Then, set the parent segment as the active segment.
     *
     * `message` must be `unknown` because that's the type expected by `subscribe`
     *
     * @param message The message received from the `undici` channel
     */
    const onResponse = (message: unknown): void => {
      const { response } = message as DiagnosticsChannel.RequestHeadersMessage;

      const subsegment = this.getSegment();
      if (isHttpSubsegment(subsegment)) {
        const status = response.statusCode;
        const contentLenght = findHeaderAndDecode(
          response.headers,
          'content-length'
        );

        subsegment.http = {
          ...subsegment.http,
          response: {
            status,
            ...(contentLenght && {
              content_length: Number.parseInt(contentLenght, 10),
            }),
          },
        };

        if (status === 429) {
          subsegment.addThrottleFlag();
        }
        if (status >= 400 && status < 500) {
          subsegment.addErrorFlag();
        } else if (status >= 500 && status < 600) {
          subsegment.addFaultFlag();
        }

        subsegment.close();
        this.setSegment(subsegment.parent);
      }
    };

    /**
     * Add an error to the subsegment when the request fails.
     *
     * This is used to handle the case when the request fails to establish a connection with the server or timeouts.
     * In all other cases, for example, when the server returns a 4xx or 5xx status code, the error is added in the `onResponse` function.
     *
     * that `message` must be `unknown` because that's the type expected by `subscribe`
     *
     * @param message The message received from the `undici` channel
     */
    const onError = (message: unknown): void => {
      const { error } = message as DiagnosticsChannel.RequestErrorMessage;

      const subsegment = this.getSegment();
      if (isHttpSubsegment(subsegment)) {
        subsegment.addErrorFlag();
        error instanceof Error && subsegment.addError(error, true);

        subsegment.close();
        this.setSegment(subsegment.parent);
      }
    };

    subscribe('undici:request:create', onRequestStart);
    subscribe('undici:request:headers', onResponse);
    subscribe('undici:request:error', onError);
  }

  public putAnnotation(key: string, value: string | number | boolean): void {
    const segment = this.getSegment();
    if (segment === undefined) {
      console.warn(
        'No active segment or subsegment found, skipping annotation'
      );

      return;
    }
    if (segment instanceof XraySegment) {
      console.warn(
        'You cannot annotate the main segment in a Lambda execution environment'
      );

      return;
    }
    segment.addAnnotation(key, value);
  }

  public putMetadata(key: string, value: unknown, namespace?: string): void {
    const segment = this.getSegment();
    if (segment === undefined) {
      console.warn(
        'No active segment or subsegment found, skipping metadata addition'
      );

      return;
    }
    if (segment instanceof XraySegment) {
      console.warn(
        'You cannot add metadata to the main segment in a Lambda execution environment'
      );

      return;
    }

    segment.addMetadata(key, value, namespace);
  }

  public setContextMissingStrategy(strategy: ContextMissingStrategy): void {
    setContextMissingStrategy(strategy);
  }

  public setDaemonAddress(address: string): void {
    setDaemonAddress(address);
  }

  public setLogger(logObj: unknown): void {
    setLogger(logObj as Logger);
  }

  public setSegment(segment: Segment | Subsegment): void {
    if (shouldUseInvokeStore()) {
      // Writing to the SDK context here would clobber the shared slot for
      // every other in-flight invocation, so the active segment goes in the
      // invocation-scoped store instead
      this.#getInvokeStore().set(this.#segmentKey, segment);
      return;
    }
    setSegment(segment);
  }
}

export { ProviderService };
