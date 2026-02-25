import type { StandardSchemaV1 } from '@standard-schema/spec';
import type {
  HandlerResponse,
  Headers,
  Middleware,
  ReqSchema,
  ResSchema,
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
export const validate = <
  TReq extends ReqSchema = ReqSchema,
  TResBody extends HandlerResponse = HandlerResponse,
  TRes extends ResSchema = ResSchema,
>(
  config: ValidationConfig<TReq, TResBody>
): Middleware => {
  const reqSchemas = config?.req;
  const resSchemas = config?.res;

  return async ({ reqCtx, next }) => {
    const typedReqCtx = reqCtx as TypedRequestContext<TReq, TRes>;
    typedReqCtx.valid = {
      ...(reqSchemas && { req: {} as ValidatedRequest<TReq> }),
      ...(resSchemas && { res: {} as ValidatedResponse<TRes> }),
    } as TypedRequestContext<TReq, TRes>['valid'];

    if (reqSchemas) {
      await validateRequestData(typedReqCtx, reqSchemas);
    }

    await next();

    if (resSchemas) {
      await validateResponseData<TResBody, TRes>(
        typedReqCtx as TypedRequestContext<ReqSchema, TRes>,
        resSchemas
      );
    }
  };
};

async function validateRequestData<TReq extends ReqSchema>(
  typedReqCtx: TypedRequestContext<TReq>,
  reqSchemas: NonNullable<ValidationConfig<TReq, HandlerResponse>['req']>
): Promise<void> {
  const schemaEntries: [string, StandardSchemaV1][] = [];
  const dataEntries: [string, unknown][] = [];

  if (reqSchemas.body) {
    const bodyData = await extractBody(typedReqCtx.req);
    schemaEntries.push(['body', reqSchemas.body]);
    dataEntries.push(['body', bodyData]);
  }

  if (reqSchemas.headers) {
    const headers = Object.fromEntries(typedReqCtx.req.headers.entries());
    schemaEntries.push(['headers', reqSchemas.headers]);
    dataEntries.push(['headers', headers]);
  }

  if (reqSchemas.path) {
    schemaEntries.push(['path', reqSchemas.path]);
    dataEntries.push(['path', typedReqCtx.params]);
  }

  if (reqSchemas.query) {
    const query = Object.fromEntries(
      new URL(typedReqCtx.req.url).searchParams.entries()
    );
    schemaEntries.push(['query', reqSchemas.query]);
    dataEntries.push(['query', query]);
  }

  const stitchedSchema = createObjectSchema(schemaEntries);
  const stitchedData = Object.fromEntries(dataEntries);

  const result = await stitchedSchema['~standard'].validate(stitchedData);

  if ('issues' in result) {
    throw new RequestValidationError(
      'Validation failed for request',
      result.issues
    );
  }

  const validated = result.value as Record<string, unknown>;
  const mutableReq = (typedReqCtx.valid as { req: Record<string, unknown> })
    .req;
  if (reqSchemas.body) mutableReq.body = validated.body;
  if (reqSchemas.headers) mutableReq.headers = validated.headers;
  if (reqSchemas.path) mutableReq.path = validated.path;
  if (reqSchemas.query) mutableReq.query = validated.query;
}

async function validateResponseData<
  TResBody extends HandlerResponse,
  TRes extends ResSchema,
>(
  typedReqCtx: TypedRequestContext<ReqSchema, TRes>,
  resSchemas: NonNullable<ValidationConfig<ReqSchema, TResBody>['res']>
): Promise<void> {
  const response = typedReqCtx.res;
  const schemaEntries: [string, StandardSchemaV1][] = [];
  const dataEntries: [string, unknown][] = [];

  if (resSchemas.body && response.body) {
    const bodyData = await extractBody(response);
    schemaEntries.push(['body', resSchemas.body]);
    dataEntries.push(['body', bodyData]);
  }

  if (resSchemas.headers) {
    const headers = Object.fromEntries(response.headers.entries());
    schemaEntries.push(['headers', resSchemas.headers]);
    dataEntries.push(['headers', headers]);
  }

  const stitchedSchema = createObjectSchema(schemaEntries);
  const stitchedData = Object.fromEntries(dataEntries);

  const result = await stitchedSchema['~standard'].validate(stitchedData);

  if ('issues' in result) {
    throw new ResponseValidationError(
      'Validation failed for response',
      result.issues
    );
  }

  const validated = result.value as Record<string, unknown>;
  const mutableValid = typedReqCtx.valid as { res: Record<string, unknown> };
  if (resSchemas.body) mutableValid.res.body = validated.body;
  if (resSchemas.headers)
    mutableValid.res.headers = validated.headers as Headers;
}

function createObjectSchema(
  entries: [string, StandardSchemaV1][]
): StandardSchemaV1 {
  return {
    '~standard': {
      version: 1,
      vendor: 'powertools',
      validate: async (data): Promise<StandardSchemaV1.Result<unknown>> => {
        const dataObj = data as Record<string, unknown>;
        const validated: Record<string, unknown> = {};
        const allIssues: StandardSchemaV1.Issue[] = [];

        for (const [key, schema] of entries) {
          const result = await schema['~standard'].validate(dataObj[key]);

          for (const issue of result.issues ?? []) {
            allIssues.push({
              message: issue.message,
              path: [key, ...(issue.path || [])],
            });
          }

          if ('value' in result) {
            validated[key] = result.value;
          }
        }

        if (allIssues.length > 0) {
          return { issues: allIssues };
        }

        return { value: validated };
      },
    },
  };
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
