import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { HttpRouteOptions, Middleware } from '../../types/http.js';
import { RequestValidationError, ResponseValidationError } from '../errors.js';

/**
 * Creates a validation middleware from the provided validation configuration.
 *
 * @param config - Validation configuration for request and response
 * @returns Middleware function that validates request/response
 */
export const createValidationMiddleware = (
  config: HttpRouteOptions['validation']
): Middleware => {
  const reqSchemas = config?.req;
  const resSchemas = config?.res;

  return async ({ reqCtx, next }) => {
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

        await validateRequest(reqSchemas.body, bodyData, 'body');
      }
      if (reqSchemas.headers) {
        const headers = Object.fromEntries(reqCtx.req.headers.entries());
        await validateRequest(reqSchemas.headers, headers, 'headers');
      }
      if (reqSchemas.path) {
        await validateRequest(reqSchemas.path, reqCtx.params, 'path');
      }
      if (reqSchemas.query) {
        const query = Object.fromEntries(
          new URL(reqCtx.req.url).searchParams.entries()
        );
        await validateRequest(reqSchemas.query, query, 'query');
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

        await validateResponse(resSchemas.body, bodyData, 'body');
      }

      if (resSchemas.headers) {
        const headers = Object.fromEntries(response.headers.entries());
        await validateResponse(resSchemas.headers, headers, 'headers');
      }
    }
  };
};

async function validateRequest(
  schema: StandardSchemaV1,
  data: unknown,
  component: 'body' | 'headers' | 'path' | 'query'
): Promise<void> {
  try {
    const result = await schema['~standard'].validate(data);

    if ('issues' in result) {
      const message = `Validation failed for request ${component}`;
      const error = new Error('Validation failed');
      throw new RequestValidationError(message, component, error);
    }
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
): Promise<void> {
  try {
    const result = await schema['~standard'].validate(data);

    if ('issues' in result) {
      const message = `Validation failed for response ${component}`;
      const error = new Error('Validation failed');
      throw new ResponseValidationError(message, component, error);
    }
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
