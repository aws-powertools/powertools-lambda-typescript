import { describe } from 'node:test';
import { expect, expectTypeOf, it } from 'vitest';
import { z } from 'zod';
import { EventBridgeEnvelope, SqsEnvelope } from '../../src/envelopes/index.js';
import { parse } from '../../src/parser.js';
import type { EventBridgeEvent, SqsEvent } from '../../src/types/schema.js';
import { getTestEvent } from '../unit/helpers/utils.js';

describe('Parser types', () => {
  const userSchema = z.object({
    name: z.string(),
    age: z.number(),
  });
  type User = z.infer<typeof userSchema>;
  const input = { name: 'John', age: 30 };

  const eventBridgeBaseEvent = getTestEvent<EventBridgeEvent>({
    eventsPath: 'eventbridge',
    filename: 'base',
  });

  const sqsBaseEvent = getTestEvent<SqsEvent>({
    eventsPath: 'sqs',
    filename: 'base',
  });
  it('infers return type for schema and safeParse', () => {
    // Act
    const result = parse(input, undefined, userSchema, true);

    // Assert
    if (result.success) {
      expectTypeOf(result.data).toEqualTypeOf<User>();
    } else {
      expectTypeOf(result.originalEvent).toEqualTypeOf<User | undefined>();
    }
  });

  it('infers return type for schema', () => {
    // Act
    const result = parse(input, undefined, userSchema);

    // Assert
    expectTypeOf(result).toEqualTypeOf<User>();
  });

  it('infers return type for schema and envelope', () => {
    // Prepare
    const event = structuredClone(eventBridgeBaseEvent);
    event.detail = input;

    // Act
    const result = parse(event, EventBridgeEnvelope, userSchema);

    // Assert
    expectTypeOf(result).toEqualTypeOf<User>();
  });

  it('infert return type for schema, object envelope and safeParse', () => {
    // Prepare
    const event = structuredClone(eventBridgeBaseEvent);
    event.detail = input;

    // Act
    const result = parse(event, EventBridgeEnvelope, userSchema, true);

    // Assert
    if (result.success) {
      expectTypeOf(result.data).toEqualTypeOf<User>();
      expect(result.data).toEqual(input);
    } else {
      throw new Error('Parsing failed');
    }
  });

  it('infers return type for schema, array envelope and safeParse', () => {
    // Prepare
    const event = structuredClone(sqsBaseEvent);
    event.Records[0].body = JSON.stringify(input);

    // Act
    const result = parse(input, SqsEnvelope, userSchema, true);

    // Assert
    if (result.success) {
      expectTypeOf(result.data).toEqualTypeOf<User[]>();
    }
  });
});
