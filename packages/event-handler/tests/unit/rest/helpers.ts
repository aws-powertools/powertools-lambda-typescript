import { Writable } from 'node:stream';
import type {
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2,
  APIGatewayProxyResult,
  APIGatewayProxyStructuredResultV2,
  Context,
} from 'aws-lambda';
import type { Router } from '../../../src/rest/Router.js';
import type {
  HandlerResponse,
  ResponseStream as IResponseStream,
  Middleware,
} from '../../../src/types/rest.js';

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

export const createTestEventV2 = (
  rawPath: string,
  method: string,
  headers: Record<string, string> = {}
): APIGatewayProxyEventV2 => ({
  version: '2.0',
  routeKey: `${method} ${rawPath}`,
  rawPath,
  rawQueryString: '',
  headers,
  requestContext: {
    accountId: '123456789012',
    apiId: 'api-id',
    domainName: 'api.example.com',
    domainPrefix: 'api',
    http: {
      method,
      path: rawPath,
      protocol: 'HTTP/1.1',
      sourceIp: '127.0.0.1',
      userAgent: 'test-agent',
    },
    requestId: 'test-request-id',
    routeKey: `${method} ${rawPath}`,
    stage: '$default',
    time: '01/Jan/2024:00:00:00 +0000',
    timeEpoch: 1704067200000,
  },
  isBase64Encoded: false,
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

export class ResponseStream extends Writable implements IResponseStream {
  // biome-ignore lint/correctness/noUnusedPrivateClassMembers: This is how the Lambda RIC implements it
  #contentType: string | undefined;
  readonly #chunks: Buffer[] = [];
  public _onBeforeFirstWrite?: (
    write: (data: Uint8Array | string) => void
  ) => void;
  #firstWrite = true;

  setContentType(contentType: string) {
    this.#contentType = contentType;
  }

  _write(chunk: Buffer, _encoding: string, callback: () => void): void {
    /* v8 ignore else -- @preserve */
    if (this.#firstWrite && this._onBeforeFirstWrite) {
      this._onBeforeFirstWrite((data: Uint8Array | string) => {
        this.#chunks.push(Buffer.from(data));
      });
      this.#firstWrite = false;
    }
    this.#chunks.push(chunk);
    callback();
  }

  public getBuffer(): Buffer {
    return Buffer.concat(this.#chunks);
  }
}

// Create a handler function from the Router instance
export const createHandler = (app: Router) => {
  function handler(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult>;
  function handler(
    event: APIGatewayProxyEventV2,
    context: Context
  ): Promise<APIGatewayProxyStructuredResultV2>;
  function handler(
    event: unknown,
    context: Context
  ): Promise<APIGatewayProxyResult | APIGatewayProxyStructuredResultV2>;
  function handler(event: unknown, context: Context) {
    return app.resolve(event, context);
  }
  return handler;
};

// Create a handler function from the Router instance with a custom scope
export const createHandlerWithScope = (app: Router, scope: unknown) => {
  function handler(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult>;
  function handler(
    event: APIGatewayProxyEventV2,
    context: Context
  ): Promise<APIGatewayProxyStructuredResultV2>;
  function handler(
    event: unknown,
    context: Context
  ): Promise<APIGatewayProxyResult | APIGatewayProxyStructuredResultV2>;
  function handler(event: unknown, context: Context) {
    return app.resolve(event, context, { scope });
  }
  return handler;
};

// Create a test Lambda class with all HTTP method decorators
export const createTestLambdaClass = (
  app: Router,
  expectedResponse: unknown
) => {
  class Lambda {
    @app.get('/test')
    public getTest() {
      return expectedResponse;
    }

    @app.post('/test')
    public postTest() {
      return expectedResponse;
    }

    @app.put('/test')
    public putTest() {
      return expectedResponse;
    }

    @app.patch('/test')
    public patchTest() {
      return expectedResponse;
    }

    @app.delete('/test')
    public deleteTest() {
      return expectedResponse;
    }

    @app.head('/test')
    public headTest() {
      return expectedResponse;
    }

    @app.options('/test')
    public optionsTest() {
      return expectedResponse;
    }

    public handler = createHandler(app);
  }

  return Lambda;
};
