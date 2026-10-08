import middy from '@middy/core';
import type { Context, Handler } from 'aws-lambda';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { EventBridgeEnvelope } from '../../src/envelopes/eventbridge.js';
import { EventBridgeWithMetadataEnvelope } from '../../src/envelopes/eventbridge-with-metadata.js';
import { SqsEnvelope } from '../../src/envelopes/sqs.js';
import { ParseError } from '../../src/errors.js';
import { parser } from '../../src/middleware/index.js';
import type {
  EventBridgeEvent,
  ParsedResult,
  SqsEvent,
} from '../../src/types/index.js';
import {
  getTestEvent,
  makeEventBridgeWithMetadataRecord,
} from './helpers/utils.js';

describe('Middleware: parser', () => {
  const schema = z
    .object({
      name: z.string(),
      age: z.number(),
    })
    .strict();
  const baseSqsEvent = getTestEvent<SqsEvent>({
    eventsPath: 'sqs',
    filename: 'base',
  });
  const baseEventBridgeEvent = getTestEvent<EventBridgeEvent>({
    eventsPath: 'eventbridge',
    filename: 'base',
  });
  const JSONPayload = { name: 'John', age: 18 };

  const handlerWithSchemaAndEnvelope = middy()
    .use(parser({ schema: z.string(), envelope: SqsEnvelope }))
    .handler(async (event) => event);

  it('parses an event with schema and envelope', async () => {
    // Prepare
    const event = structuredClone(baseSqsEvent);
    event.Records[1].body = 'bar';

    // Act
    const result = await handlerWithSchemaAndEnvelope(
      event as unknown as string[],
      {} as Context
    );

    // Assess
    expect(result).toStrictEqual(['Test message.', 'bar']);
  });

  it('throws when envelope does not match', async () => {
    // Prepare
    const event = structuredClone(baseEventBridgeEvent);

    // Act & Assess
    await expect(
      middy()
        .use(parser({ schema: z.string(), envelope: SqsEnvelope }))
        .handler((event) => event)(event as unknown as string[], {} as Context)
    ).rejects.toThrow();
  });

  it('throws when schema does not match', async () => {
    // Prepare
    const event = structuredClone(baseSqsEvent);
    // @ts-expect-error - setting an invalid body
    event.Records[1].body = undefined;

    // Act & Assess
    await expect(
      handlerWithSchemaAndEnvelope(event as unknown as string[], {} as Context)
    ).rejects.toThrow();
  });

  it('parses the event successfully', async () => {
    // Prepare
    const event = 42;

    // Act
    const result = await middy()
      .use(parser({ schema: z.number() }))
      .handler((event) => event)(event as unknown as number, {} as Context);

    // Assess
    expect(result).toEqual(event);
  });

  it('throws when the event does not match the schema', async () => {
    // Prepare
    const event = structuredClone(JSONPayload);

    // Act & Assess
    await expect(
      middy((event: unknown) => event).use(parser({ schema: z.number() }))(
        event as unknown as number,
        {} as Context
      )
    ).rejects.toThrow();
  });

  it('returns the payload when using safeParse', async () => {
    // Prepare
    const event = structuredClone(JSONPayload);

    // Act
    const result = await middy()
      .use(parser({ schema: schema, safeParse: true }))
      .handler((event) => event)(
      event as unknown as ParsedResult<z.infer<typeof schema>>,
      {} as Context
    );

    // Assess
    expect(result).toEqual({
      success: true,
      data: event,
    });
  });

  it('returns the error when using safeParse and the payload is invalid', async () => {
    // Prepare
    const event = structuredClone(JSONPayload);

    // Act
    const result = await middy()
      .use(parser({ schema: z.string(), safeParse: true }))
      .handler((event) => event)(
      event as unknown as ParsedResult<string>,
      {} as Context
    );

    // Assess
    expect(result).toEqual({
      success: false,
      error: expect.any(ParseError),
      originalEvent: event,
    });
  });

  it('returns the payload when using safeParse with envelope', async () => {
    // Prepare
    const detail = structuredClone(JSONPayload);
    const event = structuredClone(baseEventBridgeEvent);
    event.detail = detail;

    // Act
    const result = await middy()
      .use(
        parser({
          schema: schema,
          envelope: EventBridgeEnvelope,
          safeParse: true,
        })
      )
      .handler((event) => event)(
      event as unknown as ParsedResult<unknown, z.infer<typeof schema>>,
      {} as Context
    );

    // Assess
    expect(result).toStrictEqual({
      success: true,
      data: detail,
    });
  });

  it('returns an error when using safeParse with envelope and the payload is invalid', async () => {
    // Prepare
    const event = structuredClone(baseEventBridgeEvent);

    // Act
    const result = await middy()
      .use(
        parser({
          schema: z.string(),
          envelope: EventBridgeEnvelope,
          safeParse: true,
        })
      )
      .handler((event) => event)(
      event as unknown as ParsedResult<unknown, string>,
      {} as Context
    );

    // Assess
    expect(result).toStrictEqual({
      success: false,
      error: expect.any(ParseError),
      originalEvent: event,
    });
  });

  it('rethrows the error when errorHandler returns undefined', async () => {
    // Prepare
    const event = structuredClone(JSONPayload);

    // Act & Assess
    await expect(
      middy()
        .use(
          parser({
            schema: z.number(),
            errorHandler: (_error) => undefined,
          })
        )
        .handler((event) => event)(event as unknown as number, {} as Context)
    ).rejects.toThrow(ParseError);
  });

  it('does not rethrow the error when errorHandler returns null', async () => {
    // Prepare
    const event = structuredClone(JSONPayload);

    // Act
    const result = await middy()
      .use(
        parser({
          schema: z.number(),
          errorHandler: (_error) => null,
        })
      )
      .handler((event) => event)(event as unknown as number, {} as Context);

    // Assess
    expect(result).toBeNull();
  });

  it('calls the errorHandler and short-circuits when schema validation fails', async () => {
    // Prepare
    const event = structuredClone(JSONPayload);

    // Act
    const result = await middy()
      .use(
        parser({
          schema: z.number(),
          errorHandler: (error) => ({
            errorHandled: true,
            message: error.message,
          }),
        })
      )
      .handler((event) => event)(event as unknown as number, {} as Context);

    // Assess
    expect(result).toEqual({
      errorHandled: true,
      message: expect.any(String),
    });
  });

  it('does not call the errorHandler when schema validation succeeds', async () => {
    // Prepare
    const event = structuredClone(JSONPayload);

    // Act
    const result = await middy()
      .use(
        parser({
          schema: schema,
          errorHandler: (error) => ({
            errorHandled: true,
            message: error.message,
          }),
        })
      )
      .handler((event) => event)(
      event as unknown as z.infer<typeof schema>,
      {} as Context
    );

    // Assess
    expect(result).toEqual(event);
  });

  it('rethrows the error when no errorHandler is provided and schema validation fails', async () => {
    // Prepare
    const event = structuredClone(JSONPayload);

    // Act & Assess
    await expect(
      middy()
        .use(parser({ schema: z.number() }))
        .handler((event) => event)(event as unknown as number, {} as Context)
    ).rejects.toThrow(ParseError);
  });

  it('calls the errorHandler when schema validation fails with an envelope', async () => {
    // Prepare
    const event = structuredClone(baseEventBridgeEvent);

    // Act
    const result = await middy()
      .use(
        parser({
          schema: schema,
          envelope: EventBridgeEnvelope,
          errorHandler: (error) => ({
            errorHandled: true,
            message: error.message,
          }),
        })
      )
      .handler((event) => event)(
      event as unknown as z.infer<typeof schema>,
      {} as Context
    );

    // Assess
    expect(result).toEqual({
      errorHandled: true,
      message: expect.any(String),
    });
  });

  it('passes the original event to the errorHandler', async () => {
    // Prepare
    const event = structuredClone(JSONPayload);
    const errorHandler = vi.fn().mockReturnValue({ errorHandled: true });

    // Act
    await middy()
      .use(parser({ schema: z.number(), errorHandler }))
      .handler((event) => event)(event as unknown as number, {} as Context);

    // Assess
    expect(errorHandler).toHaveBeenCalledWith(expect.any(ParseError), event);
  });

  it('does not call the errorHandler when the handler throws a non-ParseError', async () => {
    // Prepare
    const event = structuredClone(JSONPayload);
    const errorHandler = vi.fn();

    // Act & Assess
    await expect(
      middy()
        .use(parser({ schema: schema, errorHandler }))
        .handler(() => {
          throw new Error('handler failure');
        })(event as unknown as z.infer<typeof schema>, {} as Context)
    ).rejects.toThrow('handler failure');
    expect(errorHandler).not.toHaveBeenCalled();
  });

  it('does not call the errorHandler when the handler itself throws a ParseError', async () => {
    // Prepare
    const event = structuredClone(JSONPayload);
    const errorHandler = vi.fn();

    // Act & Assess
    await expect(
      middy()
        .use(parser({ schema: schema, errorHandler }))
        .handler(() => {
          throw new ParseError('unrelated failure');
        })(event as unknown as z.infer<typeof schema>, {} as Context)
    ).rejects.toThrow('unrelated failure');
    expect(errorHandler).not.toHaveBeenCalled();
  });

  it('rejects an errorHandler that returns a Promise', async () => {
    // Prepare
    const event = structuredClone(JSONPayload);
    const typeError = expect.objectContaining({
      name: 'TypeError',
      message:
        'errorHandler must return synchronously; async errorHandler functions are not supported',
    });
    // Middy v8 preserves both the parse failure and the onError failure.
    const expectedError =
      process.env.MIDDY_TEST_VERSION === 'middy8'
        ? {
            name: 'AggregateError',
            message: 'Error thrown in onError middleware',
            errors: [expect.any(ParseError), typeError],
          }
        : typeError;

    // Act & Assess
    await expect(
      middy()
        .use(
          parser({
            schema: z.number(),
            // @ts-expect-error - errorHandler must be synchronous
            errorHandler: async (_error) => ({ errorHandled: true }),
          })
        )
        .handler((event) => event)(event as unknown as number, {} as Context)
    ).rejects.toMatchObject(expectedError);
  });

  it('still runs other middlewares onError when the errorHandler recovers', async () => {
    // Prepare
    const event = structuredClone(JSONPayload);
    const otherOnError = vi.fn();

    // Act
    // Note: middy runs onError middlewares in reverse attachment order, so `otherOnError`
    // (attached before parser) runs *after* parser's onError - it must still run even though
    // parser's onError already recovered from the error.
    const result = await middy()
      .use({ onError: otherOnError })
      .use(
        parser({
          schema: z.number(),
          errorHandler: (error) => ({
            errorHandled: true,
            message: error.message,
          }),
        })
      )
      .handler((event) => event)(event as unknown as number, {} as Context);

    // Assess
    expect(result).toEqual({
      errorHandled: true,
      message: expect.any(String),
    });
    expect(otherOnError).toHaveBeenCalledTimes(1);
  });

  it('parses transformed WITH_METADATA details with middleware', async () => {
    // Prepare
    const schema = z.object({ orderId: z.string().transform(Number) });
    const handler: Handler = middy()
      .use(parser({ schema, envelope: EventBridgeWithMetadataEnvelope }))
      .handler(async (event) => event);
    const event = [makeEventBridgeWithMetadataRecord({ orderId: '42' })];

    // Act
    const result = await handler(event, {} as Context, () => {});

    // Assess
    expect(result).toEqual([{ orderId: 42 }]);
  });

  it('returns a failed WITH_METADATA result for a throwing transform', async () => {
    // Prepare
    const cause = new SyntaxError('invalid JSON');
    const throwingSchema = z.unknown().transform(() => {
      throw cause;
    });
    const handler: Handler = middy()
      .use(
        parser({
          schema: throwingSchema,
          envelope: EventBridgeWithMetadataEnvelope,
          safeParse: true,
        })
      )
      .handler(async (event) => event);
    const event = [makeEventBridgeWithMetadataRecord({})];

    // Act
    const result = await handler(event, {} as Context, () => {});

    // Assess
    expect(result).toMatchObject({
      success: false,
      originalEvent: event,
      error: { cause },
    });
  });
});
