import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { EventBridgeEnvelope } from '../../src/envelopes/eventbridge.js';
import { SqsEnvelope } from '../../src/envelopes/sqs.js';
import { ParseError } from '../../src/errors.js';
import { parse } from '../../src/parser.js';
import type { EventBridgeEvent, SqsEvent } from '../../src/types/index.js';
import { getTestEvent } from './helpers/utils.js';

describe('Parser', () => {
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

  it('parses an event with schema and envelope', async () => {
    // Prepare
    const event = structuredClone(baseSqsEvent);
    event.Records[1].body = 'bar';

    // Act

    const result = parse(event, SqsEnvelope, z.string());

    // Assess
    expect(result).toStrictEqual(['Test message.', 'bar']);
  });

  it('throws when envelope does not match', async () => {
    // Prepare
    const event = structuredClone(baseEventBridgeEvent);

    // Act & Assess
    expect(() => parse(event, SqsEnvelope, z.string())).toThrow();
  });

  it('throws when schema does not match', async () => {
    // Prepare
    const event = structuredClone(baseSqsEvent);
    // @ts-expect-error - setting an invalid body
    event.Records[1].body = undefined;

    // Act & Assess
    expect(() => parse(event, SqsEnvelope, z.string())).toThrow();
  });

  it('parses the event successfully', async () => {
    // Prepare
    const event = 42;

    // Act
    const result = parse(event, undefined, z.number());

    // Assess
    expect(result).toEqual(event);
  });

  it('throws when the event does not match the schema', async () => {
    // Prepare
    const event = structuredClone(JSONPayload);

    // Act & Assess
    expect(() => parse(event, undefined, z.number())).toThrow();
  });

  it('returns the payload when using safeParse', async () => {
    // Prepare
    const event = structuredClone(JSONPayload);

    // Act
    const result = parse(event, undefined, schema, true);

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
    const result = parse(event, undefined, z.string(), true);

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
    const result = parse(event, EventBridgeEnvelope, schema, true);

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
    const result = parse(event, EventBridgeEnvelope, z.string(), true);

    // Assess
    expect(result).toStrictEqual({
      success: false,
      error: expect.any(ParseError),
      originalEvent: event,
    });
  });
});
