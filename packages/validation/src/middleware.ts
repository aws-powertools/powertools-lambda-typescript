import { SchemaValidationError } from './errors.js';
import type { ValidatorOptions } from './types.js';
import { validate } from './validate.js';

export function validationMiddleware(options: ValidatorOptions) {
  if (!options.inboundSchema && !options.outboundSchema) {
    return {};
  }
  return {
    before: async (handler: { event: unknown }) => {
      if (options.inboundSchema) {
        try {
          handler.event = validate({
            payload: handler.event,
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
    },
    after: async (handler: { response: unknown }) => {
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
          throw new SchemaValidationError('Outbound validation failed', error);
        }
      }
    },
  };
}
