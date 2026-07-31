import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
import type { Context } from 'aws-lambda';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { EventBridgeEnvelope } from '../../src/envelopes/eventbridge.js';
import { ParseError } from '../../src/errors.js';
import { parser } from '../../src/index.js';
import { EventBridgeSchema } from '../../src/schemas/index.js';
import type { EventBridgeEvent, ParsedResult } from '../../src/types/index.js';
import { getTestEvent } from './helpers/utils.js';

describe('Decorator: parser', () => {
  const schema = z.object({
    name: z.string(),
    age: z.number(),
  });
  const payload = {
    name: 'John Doe',
    age: 30,
  };
  const extendedSchema = EventBridgeSchema.extend({
    detail: schema,
  });
  type event = z.infer<typeof extendedSchema>;
  const baseEvent = getTestEvent<EventBridgeEvent>({
    eventsPath: 'eventbridge',
    filename: 'base',
  });

  const nonParseErrorHandlerSpy = vi
    .fn()
    .mockReturnValue({ errorHandled: true });

  class TestClass implements LambdaInterface {
    @parser({ schema: extendedSchema })
    public async handler(event: event, _context: Context): Promise<event> {
      return event;
    }

    @parser({ schema, envelope: EventBridgeEnvelope })
    public async handlerWithParserCallsAnotherMethod(
      event: z.infer<typeof schema>,
      _context: Context
    ): Promise<unknown> {
      return this.anotherMethod(event);
    }

    @parser({
      schema,
      safeParse: true,
    })
    public async handlerWithSchemaAndSafeParse(
      event: ParsedResult<unknown, event>,
      _context: Context
    ): Promise<ParsedResult<unknown, event>> {
      return event;
    }

    @parser({
      schema,
      envelope: EventBridgeEnvelope,
      safeParse: true,
    })
    public async harndlerWithEnvelopeAndSafeParse(
      event: ParsedResult<event, event>,
      _context: Context
    ): Promise<ParsedResult> {
      return event;
    }

    @parser({
      schema,
      errorHandler: (_error) => undefined,
    })
    public async handlerWithErrorHandlerReturningUndefined(
      event: z.infer<typeof schema>,
      _context: Context
    ): Promise<unknown> {
      return event;
    }

    @parser({
      schema,
      errorHandler: (_error) => null,
    })
    public async handlerWithErrorHandlerReturningNull(
      event: z.infer<typeof schema>,
      _context: Context
    ): Promise<unknown> {
      return event;
    }

    @parser({
      schema,
      errorHandler: (error) => ({ errorHandled: true, message: error.message }),
    })
    public async handlerWithErrorHandler(
      event: z.infer<typeof schema>,
      _context: Context
    ): Promise<unknown> {
      return event;
    }

    @parser({
      schema,
      envelope: EventBridgeEnvelope,
      errorHandler: (error) => ({ errorHandled: true, message: error.message }),
    })
    public async handlerWithEnvelopeAndErrorHandler(
      event: z.infer<typeof schema>,
      _context: Context
    ): Promise<unknown> {
      return event;
    }

    @parser({
      schema,
      errorHandler: (error, event) => ({ error, event }),
    })
    public async handlerWithErrorHandlerReceivingEvent(
      event: z.infer<typeof schema>,
      _context: Context
    ): Promise<unknown> {
      return event;
    }

    @parser({
      schema,
      errorHandler: nonParseErrorHandlerSpy,
    })
    public async handlerThatThrowsNonParseError(
      _event: z.infer<typeof schema>,
      _context: Context
    ): Promise<unknown> {
      throw new Error('handler failure');
    }

    @parser({
      schema,
      errorHandler: nonParseErrorHandlerSpy,
    })
    public async handlerThatThrowsParseError(
      _event: z.infer<typeof schema>,
      _context: Context
    ): Promise<unknown> {
      throw new ParseError('unrelated failure');
    }

    private anotherMethod(event: unknown): unknown {
      return event;
    }
  }
  const lambda = new TestClass();

  it('parses the event using the schema provided', async () => {
    // Prepare
    const event = structuredClone(baseEvent);
    event.detail = payload;

    // Act
    // @ts-expect-error - extended schema
    const result = await lambda.handler(event, {} as Context);

    // Assess
    expect(result).toEqual(event);
  });

  it('preserves the class method scope when decorated', async () => {
    // Prepare
    const event = structuredClone(baseEvent);
    event.detail = payload;

    const result = await lambda.handlerWithParserCallsAnotherMethod(
      // @ts-expect-error - extended schema
      event,
      {} as Context
    );

    expect(result).toEqual(event.detail);
  });

  it('returns a parse error when schema validation fails with safeParse enabled', async () => {
    // Act & Assess
    expect(
      await lambda.handlerWithSchemaAndSafeParse(
        { foo: 'bar' } as unknown as ParsedResult<unknown, event>,
        {} as Context
      )
    ).toEqual({
      error: expect.any(ParseError),
      success: false,
      originalEvent: { foo: 'bar' },
    });
  });

  it('parses the event with envelope and safeParse', async () => {
    // Prepare
    const event = structuredClone(baseEvent);
    event.detail = payload;

    // Act
    const result = await lambda.harndlerWithEnvelopeAndSafeParse(
      event as unknown as ParsedResult<event, event>,
      {} as Context
    );

    // Assess
    expect(result).toEqual({
      success: true,
      data: event.detail,
    });
  });

  it('returns a parse error when schema/envelope validation fails with safeParse enabled', async () => {
    // Act & Assess
    expect(
      await lambda.harndlerWithEnvelopeAndSafeParse(
        { foo: 'bar' } as unknown as ParsedResult<event, event>,
        {} as Context
      )
    ).toEqual({
      error: expect.any(ParseError),
      success: false,
      originalEvent: { foo: 'bar' },
    });
  });

  it('rethrows the error when errorHandler returns undefined', () => {
    // Act & Assess
    expect(() =>
      lambda.handlerWithErrorHandlerReturningUndefined(
        { foo: 'bar' } as unknown as z.infer<typeof schema>,
        {} as Context
      )
    ).toThrow(ParseError);
  });

  it('does not rethrow the error when errorHandler returns null', async () => {
    // Act
    const result = await lambda.handlerWithErrorHandlerReturningNull(
      { foo: 'bar' } as unknown as z.infer<typeof schema>,
      {} as Context
    );

    // Assess
    expect(result).toBeNull();
  });

  it('calls the errorHandler when schema validation fails', async () => {
    // Act
    const result = await lambda.handlerWithErrorHandler(
      { foo: 'bar' } as unknown as z.infer<typeof schema>,
      {} as Context
    );

    // Assess
    expect(result).toEqual({
      errorHandled: true,
      message: expect.any(String),
    });
  });

  it('does not call the errorHandler when schema validation succeeds', async () => {
    // Prepare
    const event = { name: 'John', age: 30 };

    // Act
    const result = await lambda.handlerWithErrorHandler(
      event as unknown as z.infer<typeof schema>,
      {} as Context
    );

    // Assess
    expect(result).toEqual(event);
  });

  it('rethrows the error when no errorHandler is provided and schema validation fails', () => {
    // Act & Assess
    expect(() =>
      lambda.handler({ foo: 'bar' } as unknown as event, {} as Context)
    ).toThrow(ParseError);
  });

  it('calls the errorHandler when schema/envelope validation fails with an envelope', async () => {
    // Prepare
    const event = structuredClone(baseEvent);

    // Act
    const result = await lambda.handlerWithEnvelopeAndErrorHandler(
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
    const invalidEvent = { foo: 'bar' };

    // Act
    const result = await lambda.handlerWithErrorHandlerReceivingEvent(
      invalidEvent as unknown as z.infer<typeof schema>,
      {} as Context
    );

    // Assess
    expect(result).toEqual({
      error: expect.any(ParseError),
      event: invalidEvent,
    });
  });

  it('does not call the errorHandler when the handler throws a non-ParseError', async () => {
    // Prepare
    nonParseErrorHandlerSpy.mockClear();

    // Act & Assess
    await expect(
      lambda.handlerThatThrowsNonParseError(
        payload as unknown as z.infer<typeof schema>,
        {} as Context
      )
    ).rejects.toThrow('handler failure');
    expect(nonParseErrorHandlerSpy).not.toHaveBeenCalled();
  });

  it('does not call the errorHandler when the handler itself throws a ParseError', async () => {
    // Prepare
    nonParseErrorHandlerSpy.mockClear();

    // Act & Assess
    await expect(
      lambda.handlerThatThrowsParseError(
        payload as unknown as z.infer<typeof schema>,
        {} as Context
      )
    ).rejects.toThrow('unrelated failure');
    expect(nonParseErrorHandlerSpy).not.toHaveBeenCalled();
  });

  it('throws a TypeError when the errorHandler returns a Promise', async () => {
    // Prepare
    class AsyncErrorHandlerClass implements LambdaInterface {
      @parser({
        schema,
        // @ts-expect-error - errorHandler must be synchronous
        errorHandler: async (_error: ParseError) => ({ errorHandled: true }),
      })
      public async handler(
        event: z.infer<typeof schema>,
        _context: Context
      ): Promise<unknown> {
        return event;
      }
    }
    const asyncLambda = new AsyncErrorHandlerClass();

    // Act & Assess
    expect(() =>
      asyncLambda.handler(
        { foo: 'bar' } as unknown as z.infer<typeof schema>,
        {} as Context
      )
    ).toThrow(TypeError);
  });
});
