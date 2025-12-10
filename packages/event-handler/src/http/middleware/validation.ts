import type { StandardSchemaV1 } from '@standard-schema/spec';
import type {
  HandlerResponse,
  Middleware,
  TypedRequestContext,
  ValidatedRequest,
  ValidatedResponse,
  ValidationConfig,
} from '../../types/http.js';
import { RequestValidationError, ResponseValidationError } from '../errors.js';

/**
 * Creates a validation middleware from the provided validation configuration.
 *
 * @param config - Validation configuration for request and response
 * @returns Middleware function that validates request/response
 */
export const createValidationMiddleware = <
  TReqBody = unknown,
  TResBody extends HandlerResponse = HandlerResponse,
>(
  config: ValidationConfig<TReqBody, TResBody>
): Middleware => {
  const reqSchemas = config?.req;
  const resSchemas = config?.res;

  return async ({ reqCtx, next }) => {
    const typedReqCtx = reqCtx as TypedRequestContext<TReqBody, TResBody>;
    typedReqCtx.valid = {
      req: {} as ValidatedRequest<TReqBody>,
      res: {} as ValidatedResponse<TResBody>,
    };

    if (reqSchemas) {
      await validateRequestData(typedReqCtx, reqSchemas);
    }

    await next();

    if (resSchemas) {
      await validateResponseData(typedReqCtx, resSchemas);
    }
  };
};

async function validateRequestData<TReqBody>(
  typedReqCtx: TypedRequestContext<TReqBody, HandlerResponse>,
  reqSchemas: NonNullable<ValidationConfig<TReqBody, HandlerResponse>['req']>
): Promise<void> {
  if (reqSchemas.body) {
    const bodyData = await extractBody(typedReqCtx.req);
    typedReqCtx.valid.req.body = await validateRequest<TReqBody>(
      reqSchemas.body,
      bodyData,
      'body'
    );
  }

  if (reqSchemas.headers) {
    const headers = Object.fromEntries(typedReqCtx.req.headers.entries());
    typedReqCtx.valid.req.headers = await validateRequest(
      reqSchemas.headers,
      headers,
      'headers'
    );
  }

  if (reqSchemas.path) {
    typedReqCtx.valid.req.path = await validateRequest(
      reqSchemas.path,
      typedReqCtx.params,
      'path'
    );
  }

  if (reqSchemas.query) {
    const query = Object.fromEntries(
      new URL(typedReqCtx.req.url).searchParams.entries()
    );
    typedReqCtx.valid.req.query = await validateRequest(
      reqSchemas.query,
      query,
      'query'
    );
  }
}

async function validateResponseData<TResBody extends HandlerResponse>(
  typedReqCtx: TypedRequestContext<unknown, TResBody>,
  resSchemas: NonNullable<ValidationConfig<unknown, TResBody>['res']>
): Promise<void> {
  const response = typedReqCtx.res;

  if (resSchemas.body && response.body) {
    const bodyData = await extractBody(response);
    typedReqCtx.valid.res.body = await validateResponse<TResBody>(
      resSchemas.body,
      bodyData,
      'body'
    );
  }

  if (resSchemas.headers) {
    const headers = Object.fromEntries(response.headers.entries());
    typedReqCtx.valid.res.headers = await validateResponse(
      resSchemas.headers,
      headers,
      'headers'
    );
  }
}

async function extractBody(source: Request | Response): Promise<unknown> {
  const cloned = source.clone();
  const contentType = source.headers.get('content-type');

  if (contentType?.includes('application/json')) {
    try {
      return await cloned.json();
    } catch {
      if (source instanceof Request) {
        throw new RequestValidationError(
          'Validation failed for request body',
          [],
          {
            cause: new Error('Invalid JSON body'),
          }
        );
      }
      throw new ResponseValidationError(
        'Validation failed for response body',
        [],
        {
          cause: new Error('Invalid JSON body'),
        }
      );
    }
  }

  return await cloned.text();
}

async function validateRequest<T>(
  schema: StandardSchemaV1,
  data: unknown,
  component: 'body'
): Promise<T>;
async function validateRequest(
  schema: StandardSchemaV1,
  data: unknown,
  component: 'headers' | 'path' | 'query'
): Promise<Record<string, string>>;
async function validateRequest<T>(
  schema: StandardSchemaV1,
  data: unknown,
  component: 'body' | 'headers' | 'path' | 'query'
): Promise<T | Record<string, string>> {
  const result = await schema['~standard'].validate(data);

  if ('issues' in result) {
    const message = `Validation failed for request ${component}`;
    throw new RequestValidationError(message, result.issues);
  }

  return result.value as T | Record<string, string>;
}

async function validateResponse<T>(
  schema: StandardSchemaV1,
  data: unknown,
  component: 'body'
): Promise<T>;
async function validateResponse(
  schema: StandardSchemaV1,
  data: unknown,
  component: 'headers'
): Promise<Record<string, string>>;
async function validateResponse<T>(
  schema: StandardSchemaV1,
  data: unknown,
  component: 'body' | 'headers'
): Promise<T | Record<string, string>> {
  const result = await schema['~standard'].validate(data);

  if ('issues' in result) {
    const message = `Validation failed for response ${component}`;
    throw new ResponseValidationError(message, result.issues);
  }

  return result.value as T | Record<string, string>;
}
