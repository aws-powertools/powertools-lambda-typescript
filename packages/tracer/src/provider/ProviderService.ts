import type { Namespace } from 'cls-hooked';
import type {
  ProviderServiceInterface,
  ContextMissingStrategy,
  HttpSubsegment,
} from '../types/ProviderService.js';
import type { Segment, Subsegment, Logger } from 'aws-xray-sdk-core';
import xraySdk from 'aws-xray-sdk-core';
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
import { addUserAgentMiddleware } from '@aws-lambda-powertools/commons';
import { subscribe } from 'node:diagnostics_channel';
import {
  findHeaderAndDecode,
  getOriginURL,
  isHttpSubsegment,
} from './utilities.js';
import type { DiagnosticsChannel } from 'undici-types';

class ProviderService implements ProviderServiceInterface {
  public captureAWS<T>(awssdk: T): T {
    return captureAWS(awssdk);
  }

  public captureAWSClient<T>(service: T): T {
    return captureAWSClient(service);
  }

  public captureAWSv3Client<T>(service: T): T {
    addUserAgentMiddleware(service, 'tracer');

    // Type must be aliased as any because of this https://github.com/aws/aws-xray-sdk-node/issues/439#issuecomment-859715660
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    captureHTTPsGlobal(require('http'));
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    captureHTTPsGlobal(require('https'));
  }

  public getNamespace(): Namespace {
    return getNamespace();
  }

  public getSegment(): Segment | Subsegment | undefined {
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
     * @note that `message` must be `unknown` because that's the type expected by `subscribe`
     *
     * @param message The message received from the `undici` channel
     */
    const onRequestStart = (message: unknown): void => {
      const { request } = message as DiagnosticsChannel.RequestCreateMessage;

      const parentSubsegment = this.getSegment();
      if (parentSubsegment && request.origin) {
        const origin = getOriginURL(request.origin);
        const subsegment = parentSubsegment.addNewSubsegment(origin.hostname);
        subsegment.addAttribute('namespace', 'remote');
        (subsegment as HttpSubsegment).http = {};

        this.setSegment(subsegment);
      }
    };

    /**
     * Enrich the subsegment with the request and response details, and close it.
     * Then, set the parent segment as the active segment.
     *
     * @note that `message` must be `unknown` because that's the type expected by `subscribe`
     *
     * @param message The message received from the `undici` channel
     */
    const onResponse = (message: unknown): void => {
      const { request, response } =
        message as DiagnosticsChannel.RequestHeadersMessage;

      const subsegment = this.getSegment();
      if (isHttpSubsegment(subsegment) && request.origin) {
        const origin = getOriginURL(request.origin);
        const method = request.method;

        const status = response.statusCode;
        const contentLenght = findHeaderAndDecode(
          response.headers,
          'content-length'
        );

        subsegment.http = {
          request: {
            url: origin.hostname,
            method,
          },
          response: {
            status,
            ...(contentLenght && {
              content_length: parseInt(contentLenght),
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

    subscribe('undici:request:create', onRequestStart);
    subscribe('undici:request:headers', onResponse);
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
    setSegment(segment);
  }
}

export { ProviderService };
