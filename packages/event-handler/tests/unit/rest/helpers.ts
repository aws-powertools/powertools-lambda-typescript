import type { APIGatewayProxyEvent } from 'aws-lambda';
import { HttpResponseStream } from '../../../src/rest/utils.js';
import type { HandlerResponse, Middleware } from '../../../src/types/rest.js';

export const createTestEvent = (
  path: string,
  httpMethod: string,
  headers: Record<string, string> = {}
): APIGatewayProxyEvent => ({
  path,
  httpMethod,
  headers,
  body: null,
  multiValueHeaders: {},
  isBase64Encoded: false,
  pathParameters: null,
  queryStringParameters: null,
  multiValueQueryStringParameters: null,
  stageVariables: null,
  requestContext: {
    httpMethod,
    path,
    domainName: 'api.example.com',
  } as APIGatewayProxyEvent['requestContext'],
  resource: '',
});

export const createTrackingMiddleware = (
  name: string,
  executionOrder: string[]
): Middleware => {
  return async ({ next }) => {
    executionOrder.push(`${name}-start`);
    await next();
    executionOrder.push(`${name}-end`);
  };
};

export const createThrowingMiddleware = (
  name: string,
  executionOrder: string[],
  errorMessage: string
): Middleware => {
  return () => {
    executionOrder.push(name);
    throw new Error(errorMessage);
  };
};

export const createReturningMiddleware = (
  name: string,
  executionOrder: string[],
  response: HandlerResponse
): Middleware => {
  return () => {
    executionOrder.push(name);
    return Promise.resolve(response);
  };
};

export const createNoNextMiddleware = (
  name: string,
  executionOrder: string[]
): Middleware => {
  return () => {
    executionOrder.push(name);
    return Promise.resolve();
    // Intentionally doesn't call next()
  };
};

export const createSettingHeadersMiddleware = (headers: {
  [key: string]: string;
}): Middleware => {
  return async ({ reqCtx, next }) => {
    await next();
    Object.entries(headers).forEach(([key, value]) => {
      reqCtx.res.headers.set(key, value);
    });
  };
};

export const createHeaderCheckMiddleware = (headers: {
  [key: string]: string;
}): Middleware => {
  return async ({ reqCtx, next }) => {
    reqCtx.res.headers.forEach((value, key) => {
      headers[key] = value;
    });
    await next();
  };
};

// Mock ResponseStream that extends the actual ResponseStream class
export class MockResponseStream extends HttpResponseStream {
  public chunks: Buffer[] = [];
  public _onBeforeFirstWrite?: (
    write: (data: Uint8Array | string) => void
  ) => void;
  #firstWrite = true;

  _write(chunk: Buffer, _encoding: string, callback: () => void): void {
    if (this.#firstWrite && this._onBeforeFirstWrite) {
      this._onBeforeFirstWrite((data: Uint8Array | string) => {
        this.chunks.push(Buffer.from(data));
      });
      this.#firstWrite = false;
    }
    this.chunks.push(chunk);
    callback();
  }
}

// Helper to parse streaming response format
export function parseStreamOutput(chunks: Buffer[]) {
  const output = Buffer.concat(chunks);
  const nullBytes = Buffer.from([0, 0, 0, 0, 0, 0, 0, 0]);
  const separatorIndex = output.indexOf(nullBytes);

  if (separatorIndex === -1) {
    return { prelude: null, body: output.toString() };
  }

  const preludeBuffer = output.subarray(0, separatorIndex);
  const bodyBuffer = output.subarray(separatorIndex + 8);

  return {
    prelude: JSON.parse(preludeBuffer.toString()),
    body: bodyBuffer.toString(),
  };
}
