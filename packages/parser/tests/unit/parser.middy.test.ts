import middy from '@middy/core';
import type { Context } from 'aws-lambda';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { EventBridgeEnvelope } from '../../src/envelopes/index.js';
import { ParseError } from '../../src/errors.js';
import { parser } from '../../src/middleware/parser.js';
import { EventBridgeSchema } from '../../src/schemas/index.js';
import type { EventBridgeEvent } from '../../src/types/index.js';
import { getTestEvent } from './helpers/utils.js';

describe('Middleware: parser', () => {
  const event = {
    ...getTestEvent<EventBridgeEvent>({
      eventsPath: 'eventbridge',
      filename: 'base',
    }),
    detail: {
      name: 'John',
      age: 42,
    },
  };
  const TestSchema = z.object({
    name: z.string(),
    age: z.number(),
  });

  it('parses the event using the provided schema', async () => {
    // Prepare
    const schema = EventBridgeSchema.extend({
      detail: TestSchema,
    });
    const handler = middy(async (event) => event).use(parser({ schema }));

    // Act
    const response = await handler(event, {} as Context);

    // Assess
    expect(response).toEqual(event);
  });

  it('extracts the paylaod from the envelope', async () => {
    // Prepare
    const handler = middy(async (event) => event).use(
      parser({
        schema: TestSchema,
        envelope: EventBridgeEnvelope,
      })
    );

    // Act
    // @ts-expect-error - this is an issue we are tracking #3226
    const response = await handler(event, {} as Context);

    // Assess
    expect(response).toEqual(event.detail);
  });

  it.each([
    {
      case: 'with valid event',
      event,
      expected: { success: true, data: event },
    },
    {
      case: 'with invalid event',
      event: { foo: 'bar' },
      expected: {
        success: false,
        error: expect.any(ParseError),
        originalEvent: { foo: 'bar' },
      },
    },
    {
      options: { envelope: EventBridgeEnvelope },
      case: 'with envelope',
      event,
      expected: { success: true, data: event.detail },
    },
    {
      options: { envelope: EventBridgeEnvelope },
      case: 'with envelope and invalid event',
      event: { foo: 'bar' },
      expected: {
        success: false,
        error: expect.any(ParseError),
        originalEvent: { foo: 'bar' },
      },
    },
  ])(
    'parses the event with safeParse $case',
    async ({ options, event, expected }) => {
      // Prepare
      const schema = options?.envelope
        ? TestSchema
        : EventBridgeSchema.extend({
            detail: TestSchema,
          });
      const handler = middy(async (event) => event).use(
        parser({ schema, safeParse: true, ...options })
      );

      // Act
      // @ts-expect-error - We are testing events that might not be valid
      const response = await handler(event, {} as Context);

      // Assess
      expect(response).toEqual(expected);
    }
  );
});
