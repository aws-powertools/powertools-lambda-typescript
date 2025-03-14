import { SchemaValidationError } from './errors.js';
import type { ValidatorOptions } from './types.js';
import { getErrorCause } from './utils.js';
import { validate } from './validate.js';

/**
 * Class method decorator to validate the input and output of a method using JSON Schema.
 *
 * @example
 * ```typescript
 * import { validator } from '@aws-lambda-powertools/validation/decorator';
 * import type { Context } from 'aws-lambda';
 *
 * const inboundSchema = {
 *   type: 'object',
 *   properties: {
 *     value: { type: 'number' },
 *   },
 *   required: ['value'],
 *   additionalProperties: false,
 * };
 *
 * const outboundSchema = {
 *   type: 'object',
 *   properties: {
 *     result: { type: 'number' },
 *   },
 *   required: ['result'],
 *   additionalProperties: false,
 * };
 *
 * class Lambda {
 *   ⁣@validator({
 *     inboundSchema,
 *     outboundSchema,
 *   })
 *   async handler(event: { value: number }, _context: Context) {
 *     // Your handler logic here
 *     return { result: event.value * 2 };
 *   }
 * }
 *
 * const lambda = new Lambda();
 * export const handler = lambda.handler.bind(lambda);
 * ```
 *
 * When validating nested payloads, you can also provide an optional JMESPath expression to extract a specific part of the payload
 * before validation using the `envelope` parameter. This is useful when the payload is nested or when you want to validate only a specific part of it.
 *
 * @example
 * ```typescript
 * import { validator } from '@aws-lambda-powertools/validation/decorator';
 *
 * class Lambda {
 *   ⁣@validator({
 *     inboundSchema: {
 *       type: 'number',
 *     },
 *     envelope: 'nested',
 *   })
 *   async handler(event: number, _context: Context) {
 *     return { result: event * 2 };
 *   }
 * }
 *
 * const lambda = new Lambda();
 * export const handler = lambda.handler.bind(lambda);
 * ```
 *
 * Since the Validation utility is built on top of Ajv, you can also provide custom formats and external references
 * to the validation process. This allows you to extend the validation capabilities of Ajv to suit your specific needs.
 *
 * @example
 * ```typescript
 * import { validate } from '@aws-lambda-powertools/validation';
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
 * const payload = {
 *   user: {
 *     name: 'Alice',
 *     age: 25,
 *   },
 * };
 *
 * class Lambda {
 *   ⁣@validator({
 *     inboundSchema: schema,
 *     externalRefs: [definitionSchema],
 *     formats,
 *   })
 *   async handler(event: { value: number }, _context: Context) {
 *     // Your handler logic here
 *     return { result: event.value * 2 };
 *   }
 * }
 *
 * const lambda = new Lambda();
 * export const handler = lambda.handler.bind(lambda);
 * ```
 *
 * Additionally, you can provide an existing Ajv instance to reuse the same instance across multiple validations. If
 * you don't provide an Ajv instance, a new one will be created for each validation.
 *
 * @param options - The validation options
 * @param options.inboundSchema - The JSON schema for inbound validation.
 * @param options.outboundSchema - The JSON schema for outbound validation.
 * @param options.envelope - Optional JMESPath expression to use as envelope for the payload.
 * @param options.formats - Optional formats for validation.
 * @param options.externalRefs - Optional external references for validation.
 * @param options.ajv - Optional Ajv instance to use for validation, if not provided a new instance will be created.
 */
function validator(options: ValidatorOptions) {
  return (
    _target: unknown,
    _propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) => {
    const {
      inboundSchema,
      outboundSchema,
      envelope,
      formats,
      externalRefs,
      ajv,
    } = options;
    if (!options.inboundSchema && !outboundSchema) {
      return descriptor;
    }
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: unknown[]) {
      let validatedInput = args[0];
      if (inboundSchema) {
        try {
          validatedInput = validate({
            payload: validatedInput,
            schema: inboundSchema,
            envelope: envelope,
            formats: formats,
            externalRefs: externalRefs,
            ajv: ajv,
          });
        } catch (error) {
          throw new SchemaValidationError('Inbound schema validation failed', {
            cause: getErrorCause(error),
          });
        }
      }
      const result = await originalMethod.apply(this, [
        validatedInput,
        ...args.slice(1),
      ]);
      if (outboundSchema) {
        try {
          return validate({
            payload: result,
            schema: outboundSchema,
            formats: formats,
            externalRefs: externalRefs,
            ajv: ajv,
          });
        } catch (error) {
          throw new SchemaValidationError('Outbound schema validation failed', {
            cause: getErrorCause(error),
          });
        }
      }
      return result;
    };
    return descriptor;
  };
}

export { validator };
