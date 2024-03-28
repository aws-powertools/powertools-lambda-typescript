import { Namespace } from 'cls-hooked';
import type {
  ProviderServiceInterface,
  ContextMissingStrategy,
} from '../types/ProviderServiceInterface.js';
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

const decoder = new TextDecoder();

/**
 * The `fetch` implementation based on `undici` includes the headers as an array of encoded key-value pairs.
 * This function finds the header with the given key and decodes the value.
 *
 * The function walks through the array of encoded headers and decodes the key of each pair.
 * If the key matches the given key, the function returns the decoded value of the next element in the array.
 *
 * @param encodedHeaders - The array of encoded headers
 * @param key - The key to search for
 */
const findHeaderAndDecode = (
  encodedHeaders: Uint8Array[],
  key: string
): string | null => {
  let foundIndex = -1;
  for (let i = 0; i < encodedHeaders.length; i += 2) {
    const header = decoder.decode(encodedHeaders[i]);
    if (header.toLowerCase() === key) {
      foundIndex = i;
      break;
    }
  }

  if (foundIndex === -1) {
    return null;
  }

  return decoder.decode(encodedHeaders[foundIndex + 1]);
};

export interface HttpSubsegment extends Subsegment {
  http: {
    request?: {
      url: string;
      method: string;
    };
    response?: {
      status: number;
      content_length?: number;
    };
  };
}

const isHttpSubsegment = (
  subsegment: Segment | Subsegment | undefined
): subsegment is HttpSubsegment => {
  return (
    subsegment !== undefined && 'http' in subsegment && 'parent' in subsegment
  );
};

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

  /**
   * Instrument `fetch` requests with AWS X-Ray
   */
  public captureNativeFetch(): void {
    const onRequestStart = (message: unknown): void => {
      const { request } = message as {
        request: {
          origin: string;
        };
      };

      const parentSubsegment = this.getSegment();
      if (parentSubsegment) {
        const origin = new URL(request.origin);
        const subsegment = parentSubsegment.addNewSubsegment(origin.hostname);
        subsegment.addAttribute('namespace', 'remote');
        (subsegment as HttpSubsegment).http = {};

        this.setSegment(subsegment);
      }
    };

    const onResponse = (message: unknown): void => {
      const { request, response } = message as {
        request: {
          origin: string;
          method: string;
        };
        response: {
          statusCode: number;
          headers: Uint8Array[];
        };
      };

      const subsegment = this.getSegment();
      if (isHttpSubsegment(subsegment)) {
        const origin = new URL(request.origin);
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
      }
    };

    const onRequestEnd = (): void => {
      const subsegment = this.getSegment();
      if (isHttpSubsegment(subsegment)) {
        subsegment.close();
        this.setSegment(subsegment.parent);
      }
    };

    subscribe('undici:request:create', onRequestStart);
    subscribe('undici:request:headers', onResponse);
    subscribe('undici:request:trailers', onRequestEnd);
  }

  public getNamespace(): Namespace {
    return getNamespace();
  }

  public getSegment(): Segment | Subsegment | undefined {
    return getSegment();
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
