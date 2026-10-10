import { describe, expectTypeOf, it } from 'vitest';
import { z } from 'zod';
import { EventBridgeWithMetadataEnvelope } from '../../src/envelopes/index.js';
import { parse } from '../../src/parser.js';
import type {
  EventBridgeWithMetadataRecordSchema,
  EventBridgeWithMetadataSchema,
} from '../../src/schemas/index.js';
import type {
  EventBridgeWithMetadataEvent,
  EventBridgeWithMetadataRecord,
  EventBridgeWithMetadataSystemMetadata,
  ParsedResult,
} from '../../src/types/index.js';
import type { ParserOutput } from '../../src/types/parser.js';

describe('Types: EventBridge WITH_METADATA', () => {
  it('infers transformed detail arrays for parsing and safe parsing', () => {
    // Prepare
    const schema = z.object({ orderId: z.string().transform(Number) });
    const event: unknown = [];

    // Act
    const result = parse(event, EventBridgeWithMetadataEnvelope, schema);
    const safeResult = parse(
      event,
      EventBridgeWithMetadataEnvelope,
      schema,
      true
    );

    // Assess
    expectTypeOf(result).toEqualTypeOf<{ orderId: number }[]>();
    expectTypeOf(safeResult).toEqualTypeOf<
      ParsedResult<unknown, { orderId: number }[]>
    >();
    expectTypeOf<
      ParserOutput<typeof schema, typeof EventBridgeWithMetadataEnvelope>
    >().toEqualTypeOf<{ orderId: number }[]>();
  });

  it('exports inferred record and batch types', () => {
    // Assess
    expectTypeOf<
      z.infer<typeof EventBridgeWithMetadataRecordSchema>
    >().toEqualTypeOf<EventBridgeWithMetadataRecord>();
    expectTypeOf<
      z.infer<typeof EventBridgeWithMetadataSchema>
    >().toEqualTypeOf<EventBridgeWithMetadataEvent>();
    expectTypeOf<EventBridgeWithMetadataEvent>().toEqualTypeOf<
      EventBridgeWithMetadataRecord[]
    >();
    expectTypeOf<EventBridgeWithMetadataRecord['Metadata']>().toEqualTypeOf<
      Record<string, string> | undefined
    >();
    expectTypeOf<
      EventBridgeWithMetadataSystemMetadata['aws:SequenceNumber']
    >().toEqualTypeOf<string | undefined>();
    expectTypeOf<
      EventBridgeWithMetadataSystemMetadata['aws:DeliveryType']
    >().toEqualTypeOf<'LIVE' | 'REPLAY'>();
  });
});
