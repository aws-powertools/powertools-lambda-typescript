import { SchemaValidationError } from './errors.js';
import { validate } from './validate.js';
import type { ValidatorOptions } from './types.js';
export function validator(options: ValidatorOptions) {
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
          throw new SchemaValidationError('Inbound validation failed', error);
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
          throw new SchemaValidationError('Outbound Validation failed', error);
        }
      }
      return result;
    };
    return descriptor;
  };
}
