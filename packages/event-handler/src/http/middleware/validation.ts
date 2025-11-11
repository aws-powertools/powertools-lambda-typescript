import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { Middleware, RestRouteOptions } from '../../types/rest.js';
import { RequestValidationError, ResponseValidationError } from '../errors.js';

/**
 * Creates a validation middleware from the provided validation configuration.
 *
 * @param config - Validation configuration for request and response
 * @returns Middleware function that validates request/response
 */
export const createValidationMiddleware = (
  config: RestRouteOptions['validation']
): Middleware => {
  const reqSchemas = config?.req;
  const resSchemas = config?.res;

  return async ({ reqCtx, next }) => {
    // Validate request
    if (reqSchemas) {
      if (reqSchemas.body) {
        let bodyData: unknown = reqCtx.event.body;
        const contentType = reqCtx.req.headers.get('content-type');
        if (
          contentType?.includes('application/json') &&
          typeof bodyData === 'string'
        ) {
          try {
            bodyData = JSON.parse(bodyData);
          } catch {
            // If parsing fails, validate the raw string
          }
        }
        await validateComponent(reqSchemas.body, bodyData, 'body', true);
      }
      if (reqSchemas.headers) {
        const headers = Object.fromEntries(reqCtx.req.headers.entries());
        await validateComponent(reqSchemas.headers, headers, 'headers', true);
      }
      if (reqSchemas.path) {
        await validateComponent(reqSchemas.path, reqCtx.params, 'path', true);
      }
      if (reqSchemas.query) {
        const query = Object.fromEntries(
          new URL(reqCtx.req.url).searchParams.entries()
        );
        await validateComponent(reqSchemas.query, query, 'query', true);
      }
    }

    // Execute handler
    await next();

    // Validate response
    if (resSchemas) {
      const response = reqCtx.res;

      if (resSchemas.body) {
        const clonedResponse = response.clone();
        const contentType = response.headers.get('content-type');

        let bodyData: unknown;
        if (contentType?.includes('application/json')) {
          bodyData = await clonedResponse.json();
        } else {
          bodyData = await clonedResponse.text();
        }

        await validateComponent(resSchemas.body, bodyData, 'body', false);
      }

      if (resSchemas.headers) {
        const headers = Object.fromEntries(response.headers.entries());
        await validateComponent(resSchemas.headers, headers, 'headers', false);
      }
    }
  };
};

async function validateComponent(
  schema: StandardSchemaV1,
  data: unknown,
  component: 'body' | 'headers' | 'path' | 'query',
  isRequest: boolean
): Promise<void> {
  const result = await schema['~standard'].validate(data);

  if ('issues' in result) {
    const message = `Validation failed for ${isRequest ? 'request' : 'response'} ${component}`;
    const error = new Error('Validation failed');

    if (isRequest) {
      throw new RequestValidationError(message, component, error);
    }
    throw new ResponseValidationError(
      message,
      component as 'body' | 'headers',
      error
    );
  }
}
