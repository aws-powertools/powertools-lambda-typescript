import { SchemaValidationError } from './errors.js';
import type { ValidatorOptions } from './types.js';
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
    if (!descriptor.value) {
      return descriptor;
    }
    const {
      inboundSchema,
      outboundSchema,
      envelope,
      formats,
      externalRefs,
      ajv,
    } = options;
    if (!inboundSchema && !outboundSchema) {
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
          throw new SchemaValidationError('Inbound validation failed', {
            cause: error,
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
          throw new SchemaValidationError('Outbound Validation failed', {
            cause: error,
          });
        }
      }
      return result;
    };
    return descriptor;
  };
}

export { validator };
