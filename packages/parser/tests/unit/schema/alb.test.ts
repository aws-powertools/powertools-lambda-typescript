import { describe, expect, it } from 'vitest';
import { AlbSchema } from '../../../src/schemas/alb.js';
import type { ALBEvent } from '../../../src/types/schema.js';
import { getTestEvent, omit } from '../helpers/utils.js';

describe('Schema: ALB', () => {
  const eventsPath = 'alb';
  const baseEvent = getTestEvent<ALBEvent>({
    eventsPath,
    filename: 'base',
  });

  it('parses an ALB event', () => {
    // Prepare
    const event = structuredClone(baseEvent);

    // Act
    const result = AlbSchema.parse(event);

    // Assess
    expect(result).toStrictEqual(event);
  });

  it('parses an ALB event with a base64 encoded body', () => {
    // Prepare
    const event = structuredClone(baseEvent);
    event.body = 'aGVsbG8gd29ybGQ='; // base64 encoded 'hello world'
    // @ts-expect-error - we know the headers exist
    event.headers['content-type'] = 'application/octet-stream';
    event.isBase64Encoded = true;

    // Act
    const result = AlbSchema.parse(event);

    // Assess
    expect(result).toStrictEqual(event);
  });

  it('parses an ALB event with multi-value headers and query string parameters', () => {
    // Prepare
    const event = getTestEvent<ALBEvent>({
      eventsPath,
      filename: 'multi-fields',
    });

    // Act
    const result = AlbSchema.parse(event);

    // Assess
    expect(result).toStrictEqual(event);
  });

  it('throws if the event is not an ALB event', () => {
    // Prepare
    const event = omit(['path'], structuredClone(baseEvent));

    // Act & Assess
    expect(() => AlbSchema.parse(event)).toThrow();
  });
});
