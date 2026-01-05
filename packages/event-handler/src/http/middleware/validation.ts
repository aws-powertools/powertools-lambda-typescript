import type { StandardSchemaV1 } from '@standard-schema/spec';
import type {
  HandlerResponse,
  Middleware,
  ReqSchema,
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
  TReq extends ReqSchema = ReqSchema,
  TResBody extends HandlerResponse = HandlerResponse,
>(
  config: ValidationConfig<TReq, TResBody>
): Middleware => {
  const reqSchemas = config?.req;
  const resSchemas = config?.res;

  return async ({ reqCtx, next }) => {
    const typedReqCtx = reqCtx as TypedRequestContext<TReq, TResBody>;
    typedReqCtx.valid = {
      req: {} as ValidatedRequest<TReq>,
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

async function validateRequestData<TReq extends ReqSchema>(
  typedReqCtx: TypedRequestContext<TReq, HandlerResponse>,
  reqSchemas: NonNullable<ValidationConfig<TReq, HandlerResponse>['req']>
): Promise<void> {
  if (reqSchemas.body) {
    const bodyData = await extractBody(typedReqCtx.req);
    typedReqCtx.valid.req.body = await validateRequest<TReq['body']>(
      reqSchemas.body,
      bodyData,
      'body'
    );
  }

  if (reqSchemas.headers) {
    const headers = Object.fromEntries(typedReqCtx.req.headers.entries());
    typedReqCtx.valid.req.headers = await validateRequest<TReq['headers']>(
      reqSchemas.headers,
      headers,
      'headers'
    );
  }

  if (reqSchemas.path) {
    typedReqCtx.valid.req.path = await validateRequest<TReq['path']>(
      reqSchemas.path,
      typedReqCtx.params,
      'path'
    );
  }

  if (reqSchemas.query) {
    const query = Object.fromEntries(
      new URL(typedReqCtx.req.url).searchParams.entries()
    );
    typedReqCtx.valid.req.query = await validateRequest<TReq['query']>(
      reqSchemas.query,
      query,
      'query'
    );
  }
}

async function validateResponseData<TResBody extends HandlerResponse>(
  typedReqCtx: TypedRequestContext<ReqSchema, TResBody>,
  resSchemas: NonNullable<ValidationConfig<ReqSchema, TResBody>['res']>
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
  component: 'body' | 'headers' | 'path' | 'query'
): Promise<T> {
  const result = await schema['~standard'].validate(data);

  if ('issues' in result) {
    const message = `Validation failed for request ${component}`;
    throw new RequestValidationError(message, result.issues);
  }

  return result.value as T;
}

async function validateResponse<T>(
  schema: StandardSchemaV1,
  data: unknown,
  component: 'body' | 'headers'
): Promise<T> {
  const result = await schema['~standard'].validate(data);

  if ('issues' in result) {
    const message = `Validation failed for response ${component}`;
    throw new ResponseValidationError(message, result.issues);
  }

  return result.value as T;
}
