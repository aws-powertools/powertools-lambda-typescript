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

    // Validate request
    if (reqSchemas) {
      if (reqSchemas.body) {
        const clonedRequest = reqCtx.req.clone();
        const contentType = reqCtx.req.headers.get('content-type');
        let bodyData: unknown;

        if (contentType?.includes('application/json')) {
          try {
            bodyData = await clonedRequest.json();
          } catch {
            // If JSON parsing fails, get as text and let validator handle it
            bodyData = await reqCtx.req.clone().text();
          }
        } else {
          bodyData = await clonedRequest.text();
        }

        const validatedBody = await validateRequest(
          reqSchemas.body,
          bodyData,
          'body'
        );
        (typedReqCtx.valid.req as ValidatedRequest<TReqBody>).body =
          validatedBody as TReqBody;
      }
      if (reqSchemas.headers) {
        const headers = Object.fromEntries(reqCtx.req.headers.entries());
        typedReqCtx.valid.req.headers = (await validateRequest(
          reqSchemas.headers,
          headers,
          'headers'
        )) as Record<string, string>;
      }
      if (reqSchemas.path) {
        typedReqCtx.valid.req.path = (await validateRequest(
          reqSchemas.path,
          reqCtx.params,
          'path'
        )) as Record<string, string>;
      }
      if (reqSchemas.query) {
        const query = Object.fromEntries(
          new URL(reqCtx.req.url).searchParams.entries()
        );
        typedReqCtx.valid.req.query = (await validateRequest(
          reqSchemas.query,
          query,
          'query'
        )) as Record<string, string>;
      }
    }

    // Execute handler
    await next();

    // Validate response
    if (resSchemas) {
      const response = reqCtx.res;

      if (resSchemas.body && response.body) {
        const clonedResponse = response.clone();
        const contentType = response.headers.get('content-type');
        const bodyData = contentType?.includes('application/json')
          ? await clonedResponse.json()
          : await clonedResponse.text();

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
  };
};

async function validateRequest(
  schema: StandardSchemaV1,
  data: unknown,
  component: 'body' | 'headers' | 'path' | 'query'
): Promise<unknown> {
  try {
    const result = await schema['~standard'].validate(data);

    if ('issues' in result) {
      const message = `Validation failed for request ${component}`;
      const error = new Error('Validation failed');
      throw new RequestValidationError(message, component, error);
    }

    return result.value;
  } catch (error) {
    // Handle schemas that throw errors instead of returning issues
    if (error instanceof RequestValidationError) {
      throw error;
    }
    const message = `Validation failed for request ${component}`;
    throw new RequestValidationError(
      message,
      component,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

async function validateResponse(
  schema: StandardSchemaV1,
  data: unknown,
  component: 'body' | 'headers'
): Promise<unknown> {
  try {
    const result = await schema['~standard'].validate(data);

    if ('issues' in result) {
      const message = `Validation failed for response ${component}`;
      const error = new Error('Validation failed');
      throw new ResponseValidationError(message, component, error);
    }

    return result.value;
  } catch (error) {
    // Handle schemas that throw errors instead of returning issues
    if (error instanceof ResponseValidationError) {
      throw error;
    }
    const message = `Validation failed for response ${component}`;
    throw new ResponseValidationError(
      message,
      component,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}
