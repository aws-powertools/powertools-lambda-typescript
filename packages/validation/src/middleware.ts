import type {
  MiddlewareFn,
  MiddyLikeRequest,
} from '@aws-lambda-powertools/commons/types';
import { SchemaValidationError } from './errors.js';
import type { ValidatorOptions } from './types.js';
import { getErrorCause } from './utils.js';
import { validate } from './validate.js';

/**
 * Middy.js middleware to validate your event and response payloads using JSON schema.
 *
 * Both inbound and outbound schemas are optional. If only one is provided, only that one will be validated.
 *
 * @example
 * ```typescript
 * import { validation } from '@aws-lambda-powertools/validation/middleware';
 * import middy from '@middy/core';
 *
 * const inboundSchema = {
 *   type: 'object',
 *   properties: {
 *     foo: { type: 'string' },
 *   },
 *   required: ['foo'],
 *   additionalProperties: false,
 * };
 *
 * const outboundSchema = {
 *   type: 'object',
 *   properties: {
 *     bar: { type: 'number' },
 *   },
 *   required: ['bar'],
 *   additionalProperties: false,
 * };
 *
 * export const handler = middy()
 *   .use(validation({ inboundSchema, outboundSchema }))
 *   .handler(async (event) => {
 *     // Your handler logic here
 *     return { bar: 42 };
 *   });
 * ```
 *
 * Since the Validation utility is built on top of Ajv, you can also provide custom formats and external references
 * to the validation process. This allows you to extend the validation capabilities of Ajv to suit your specific needs.
 *
 * @example
 * ```typescript
 * import { validator } from '@aws-lambda-powertools/validation/middleware';
 * import middy from '@middy/core';
 *
 * const formats = {
 *   ageRange: (value: number) => return value >= 0 && value <= 120,
 * };
 *
 * const definitionSchema = {
 *   $id: 'https://example.com/schemas/definitions.json',
 *   definitions: {
 *     user: {
 *       type: 'object',
 *       properties: {
 *         name: { type: 'string' },
 *         age: { type: 'number', format: 'ageRange' },
 *       },
 *       required: ['name', 'age'],
 *       additionalProperties: false,
 *     }
 *   }
 * } as const;
 *
 * const schema = {
 *   $id: 'https://example.com/schemas/user.json',
 *   type: 'object',
 *   properties: {
 *     user: { $ref: 'definitions.json#/definitions/user' },
 *   },
 *   required: ['user'],
 *   additionalProperties: false,
 * } as const;
 *
 * export const handler = middy()
 *   .use(validation({
 *     inboundSchema,
 *     outboundSchema,
 *     externalRefs: [definitionSchema],
 *     formats,
 *    }))
 *   .handler(async (event) => {
 *     // Your handler logic here
 *     return { bar: 42 };
 *   });
 * ```
 *
 * Additionally, you can provide an existing Ajv instance to reuse the same instance across multiple validations. If
 * you don't provide an Ajv instance, a new one will be created for each validation.
 *
 * @param options.inboundSchema - The JSON schema for inbound validation.
 * @param options.outboundSchema - The JSON schema for outbound validation.
 * @param options.envelope - Optional JMESPath expression to use as envelope for the payload.
 * @param options.formats - Optional formats for validation.
 * @param options.externalRefs - Optional external references for validation.
 * @param options.ajv - Optional Ajv instance to use for validation, if not provided a new instance will be created.
 */
const validator = (options: ValidatorOptions) => {
  const before: MiddlewareFn = async (request) => {
    if (options.inboundSchema) {
      const originalEvent = structuredClone(request.event);
      try {
        request.event = validate({
          payload: originalEvent,
          schema: options.inboundSchema,
          envelope: options.envelope,
          formats: options.formats,
          externalRefs: options.externalRefs,
          ajv: options.ajv,
        });
      } catch (error) {
        throw new SchemaValidationError('Inbound schema validation failed', {
          cause: getErrorCause(error),
        });
      }
    }
  };

  const after = async (handler: MiddyLikeRequest) => {
    if (options.outboundSchema) {
      try {
        handler.response = validate({
          payload: handler.response,
          schema: options.outboundSchema,
          formats: options.formats,
          externalRefs: options.externalRefs,
          ajv: options.ajv,
        });
      } catch (error) {
        throw new SchemaValidationError('Outbound schema validation failed', {
          cause: getErrorCause(error),
        });
      }
    }
  };

  return {
    before,
    after,
  };
};

export { validator };
