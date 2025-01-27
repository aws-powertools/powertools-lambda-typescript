import middy from '@middy/core';
import type { Context } from 'aws-lambda';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { EventBridgeEnvelope } from '../../src/envelopes/event-bridge.js';
import { SqsEnvelope } from '../../src/envelopes/sqs.js';
import { ParseError } from '../../src/errors.js';
import { parser } from '../../src/middleware/parser.js';
import type {
  EventBridgeEvent,
  ParsedResult,
  SqsEvent,
} from '../../src/types/index.js';
import { getTestEvent } from './helpers/utils.js';

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
    expect(
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
    expect(
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
    expect(
      middy((event) => event).use(parser({ schema: z.number() }))(
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
      event as unknown as ParsedResult<unknown, z.infer<typeof schema>>,
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
      event as unknown as ParsedResult<unknown, string>,
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
});
