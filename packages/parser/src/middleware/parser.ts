import { MiddyLikeRequest } from '@aws-lambda-powertools/commons/types';
import { MiddlewareObj } from '@middy/core';
import { ZodSchema } from 'zod';
import { Envelope } from '../envelopes/Envelope.js';

interface ParserOptions {
  schema: ZodSchema;
  envelope?: Envelope;
}

const parser = (options: ParserOptions): MiddlewareObj => {
  const before = (request: MiddyLikeRequest): void => {
    const { schema, envelope } = options;
    if (envelope) {
      request.event = envelope.parse(request.event, schema);
    } else {
      request.event = schema.parse(request.event);
    }
  };

  const after = (_request: MiddyLikeRequest): void => {};

  const onError = (_request: MiddyLikeRequest): void => {};

  return {
    before,
    after,
    onError,
  };
};

export { parser };
