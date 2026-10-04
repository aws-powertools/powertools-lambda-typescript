import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { EventBridgeWithMetadataEnvelope } from '../../../src/envelopes/eventbridge-with-metadata.js';
import { ParseError } from '../../../src/errors.js';
import { parse } from '../../../src/parser.js';
import { makeEventBridgeWithMetadataRecord } from '../helpers/utils.js';

describe('Envelope: EventBridge WITH_METADATA', () => {
  const schema = z.object({ orderId: z.string().transform(Number) });

  it.each([1, 3])('parses and transforms %i records in order', (count) => {
    // Prepare
    const event = Array.from({ length: count }, (_, index) =>
      makeEventBridgeWithMetadataRecord({ orderId: `${index}` })
    );
    const expected = Array.from({ length: count }, (_, index) => ({
      orderId: index,
    }));

    // Act
    const result = parse(event, EventBridgeWithMetadataEnvelope, schema);
    const safeResult = parse(
      event,
      EventBridgeWithMetadataEnvelope,
      schema,
      true
    );

    // Assess
    expect(result).toEqual(expected);
    expect(safeResult).toEqual({ success: true, data: expected });
    expect(event[0].Data.detail).toEqual({ orderId: '0' });
  });

  it.each([
    {
      name: 'invalid detail',
      event: [
        makeEventBridgeWithMetadataRecord({ orderId: '1' }),
        makeEventBridgeWithMetadataRecord({ orderId: 2 }),
      ],
      path: [1, 'Data', 'detail', 'orderId'],
    },
    {
      name: 'invalid metadata',
      event: [
        {
          ...makeEventBridgeWithMetadataRecord({ orderId: '1' }),
          SystemMetadata: {},
        },
      ],
      path: [0, 'SystemMetadata', 'aws:DeliveryType'],
    },
    {
      name: 'invalid producer metadata',
      event: [
        {
          ...makeEventBridgeWithMetadataRecord({ orderId: '1' }),
          Metadata: { tenant: 123 },
        },
      ],
      path: [0, 'Metadata', 'tenant'],
    },
    {
      name: 'invalid data',
      event: [
        { ...makeEventBridgeWithMetadataRecord({ orderId: '1' }), Data: null },
      ],
      path: [0, 'Data'],
    },
    { name: 'empty batch', event: [], path: [] },
    {
      name: 'single object',
      event: makeEventBridgeWithMetadataRecord({ orderId: '1' }),
      path: [],
    },
  ])(
    'fails the whole batch for $name and preserves the issue path',
    ({ event, path }) => {
      // Act
      const result = EventBridgeWithMetadataEnvelope.safeParse(event, schema);

      // Assess
      expect(result).toEqual({
        success: false,
        originalEvent: event,
        error: expect.objectContaining({
          name: 'ParseError',
          cause: expect.objectContaining({
            issues: expect.arrayContaining([expect.objectContaining({ path })]),
          }),
        }),
      });
      if (!result.success) {
        expect(result.originalEvent).toBe(event);
        expect(result.error.cause).toBeInstanceOf(z.ZodError);
      }
      expect(() =>
        EventBridgeWithMetadataEnvelope.parse(event, schema)
      ).toThrow(ParseError);
      expect(result).not.toHaveProperty('data');
    }
  );

  it('retains validation errors for multiple invalid records', () => {
    // Prepare
    const event = [
      makeEventBridgeWithMetadataRecord({}),
      makeEventBridgeWithMetadataRecord({}),
    ];

    // Act
    const result = EventBridgeWithMetadataEnvelope.safeParse(event, schema);

    // Assess
    expect(result.success).toBe(false);
    if (!result.success) {
      const cause = result.error.cause;
      expect(cause).toBeInstanceOf(z.ZodError);
      if (cause instanceof z.ZodError) {
        expect(cause.issues.map((issue) => issue.path)).toEqual([
          [0, 'Data', 'detail', 'orderId'],
          [1, 'Data', 'detail', 'orderId'],
        ]);
      }
    }
  });

  it.each([new SyntaxError('invalid JSON'), 'transform failed'])(
    'preserves a thrown transform cause %s',
    (cause) => {
      // Prepare
      const event = [makeEventBridgeWithMetadataRecord({ orderId: '1' })];
      const throwingSchema = z.unknown().transform(() => {
        throw cause;
      });

      // Act
      const result = parse(
        event,
        EventBridgeWithMetadataEnvelope,
        throwingSchema,
        true
      );

      // Assess
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ParseError);
        expect(result.error.cause).toBe(cause);
        expect(result.originalEvent).toBe(event);
      }
      expect(() =>
        EventBridgeWithMetadataEnvelope.parse(event, throwingSchema)
      ).toThrow(expect.objectContaining({ cause }));
    }
  );
});
