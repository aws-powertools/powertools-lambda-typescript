import type { Ajv } from 'ajv';
import { SchemaValidationError } from './errors.js';
import { validate } from './validate.js';
export interface ValidatorOptions {
  inboundSchema?: object;
  outboundSchema?: object;
  envelope?: string;
  formats?: Record<
    string,
    | string
    | RegExp
    | {
        type?: 'string' | 'number';
        validate: (data: string) => boolean;
        async?: boolean;
      }
  >;
  externalRefs?: object[];
  ajv?: Ajv;
}

type AsyncMethod = (...args: unknown[]) => Promise<unknown>;

export function validator(options: ValidatorOptions): MethodDecorator {
  return (
    _target,
    _propertyKey,
    descriptor: TypedPropertyDescriptor<AsyncMethod>
  ) => {
    if (!descriptor.value) {
      return descriptor;
    }

    if (!options.inboundSchema && !options.outboundSchema) {
      return descriptor;
    }

    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]): Promise<unknown> {
      let validatedInput = args[0];

      if (options.inboundSchema) {
        try {
          validatedInput = validate({
            payload: args[0],
            schema: options.inboundSchema,
            envelope: options.envelope,
            formats: options.formats,
            externalRefs: options.externalRefs,
            ajv: options.ajv,
          });
        } catch (error) {
          throw new SchemaValidationError('Inbound validation failed', error);
        }
      }

      const result = await originalMethod.apply(this, [
        validatedInput,
        ...args.slice(1),
      ]);
      if (options.outboundSchema) {
        try {
          return validate({
            payload: result,
            schema: options.outboundSchema,
            formats: options.formats,
            externalRefs: options.externalRefs,
            ajv: options.ajv,
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
