import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
import type { Context } from 'aws-lambda';
import { describe, expect, it } from 'vitest';
import { type ZodSchema, z } from 'zod';
import { EventBridgeEnvelope } from '../../src/envelopes/index.js';
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

    private async anotherMethod<T extends ZodSchema>(
      event: z.infer<T>
    ): Promise<z.infer<T>> {
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
});
