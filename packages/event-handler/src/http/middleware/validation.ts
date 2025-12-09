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
    const bodyData = await extractRequestBody(typedReqCtx.req);
    const validatedBody = await validateRequest(
      reqSchemas.body,
      bodyData,
      'body'
    );
    typedReqCtx.valid.req.body = validatedBody as TReqBody;
  }

  if (reqSchemas.headers) {
    const headers = Object.fromEntries(typedReqCtx.req.headers.entries());
    typedReqCtx.valid.req.headers = (await validateRequest(
      reqSchemas.headers,
      headers,
      'headers'
    )) as Record<string, string>;
  }

  if (reqSchemas.path) {
    typedReqCtx.valid.req.path = (await validateRequest(
      reqSchemas.path,
      typedReqCtx.params,
      'path'
    )) as Record<string, string>;
  }

  if (reqSchemas.query) {
    const query = Object.fromEntries(
      new URL(typedReqCtx.req.url).searchParams.entries()
    );
    typedReqCtx.valid.req.query = (await validateRequest(
      reqSchemas.query,
      query,
      'query'
    )) as Record<string, string>;
  }
}

async function validateResponseData<TResBody extends HandlerResponse>(
  typedReqCtx: TypedRequestContext<unknown, TResBody>,
  resSchemas: NonNullable<ValidationConfig<unknown, TResBody>['res']>
): Promise<void> {
  const response = typedReqCtx.res;

  if (resSchemas.body && response.body) {
    const bodyData = await extractResponseBody(response);
    typedReqCtx.valid.res.body = (await validateResponse(
      resSchemas.body,
      bodyData,
      'body'
    )) as TResBody;
  }

  if (resSchemas.headers) {
    const headers = Object.fromEntries(response.headers.entries());
    typedReqCtx.valid.res.headers = (await validateResponse(
      resSchemas.headers,
      headers,
      'headers'
    )) as Record<string, string>;
  }
}

async function extractRequestBody(req: Request): Promise<unknown> {
  const clonedRequest = req.clone();
  const contentType = req.headers.get('content-type');

  if (contentType?.includes('application/json')) {
    try {
      return await clonedRequest.json();
    } catch {
      return await req.clone().text();
    }
  }

  return await clonedRequest.text();
}

async function extractResponseBody(response: Response): Promise<unknown> {
  const clonedResponse = response.clone();
  const contentType = response.headers.get('content-type');

  return contentType?.includes('application/json')
    ? await clonedResponse.json()
    : await clonedResponse.text();
}

async function validateRequest(
  schema: StandardSchemaV1,
  data: unknown,
  component: 'body' | 'headers' | 'path' | 'query'
): Promise<unknown> {
  const result = await schema['~standard'].validate(data);

  if ('issues' in result) {
    const message = `Validation failed for request ${component}`;
    const error = new Error('Validation failed');
    throw new RequestValidationError(message, component, error);
  }

  return result.value;
}

async function validateResponse(
  schema: StandardSchemaV1,
  data: unknown,
  component: 'body' | 'headers'
): Promise<unknown> {
  const result = await schema['~standard'].validate(data);

  if ('issues' in result) {
    const message = `Validation failed for response ${component}`;
    const error = new Error('Validation failed');
    throw new ResponseValidationError(message, component, error);
  }

  return result.value;
}
