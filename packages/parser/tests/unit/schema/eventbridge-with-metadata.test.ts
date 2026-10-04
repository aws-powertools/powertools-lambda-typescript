import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { EventBridgeSchema } from '../../../src/schemas/eventbridge.js';
import {
  EventBridgeWithMetadataRecordSchema,
  EventBridgeWithMetadataSchema,
  EventBridgeWithMetadataSystemMetadataSchema,
} from '../../../src/schemas/eventbridge-with-metadata.js';
import { makeEventBridgeWithMetadataRecord, omit } from '../helpers/utils.js';

describe('Schema: EventBridge WITH_METADATA', () => {
  it.each([1, 3])('parses a batch of %i records in order', (count) => {
    // Prepare
    const event = Array.from({ length: count }, (_, index) =>
      makeEventBridgeWithMetadataRecord({ orderId: `order-${index}` })
    );

    // Act
    const result = EventBridgeWithMetadataSchema.parse(event);

    // Assess
    expect(result).toStrictEqual(event);
  });

  it.each(['900719925474099301', '10000000000000003000'])(
    'preserves sequence %s exactly',
    (sequence) => {
      // Prepare
      const event = makeEventBridgeWithMetadataRecord({ orderId: '1' });
      event.SystemMetadata['aws:SequenceNumber'] = sequence;

      // Act
      const result = EventBridgeWithMetadataRecordSchema.parse(event);

      // Assess
      expect(result.SystemMetadata['aws:SequenceNumber']).toBe(sequence);
      expect(result.Data.id).not.toBe(result.SystemMetadata['aws:EventId']);
    }
  );

  it.each(['LIVE', 'REPLAY'])(
    'accepts %s with only required system metadata',
    (deliveryType) => {
      // Prepare: synthetic omission case based on documented optionality.
      const event = {
        ...makeEventBridgeWithMetadataRecord({ orderId: '1' }),
        SystemMetadata: { 'aws:DeliveryType': deliveryType },
      };

      // Act
      const result = EventBridgeWithMetadataRecordSchema.parse(event);

      // Assess
      expect(result.SystemMetadata).toStrictEqual({
        'aws:DeliveryType': deliveryType,
      });
    }
  );

  it('retains replay names and independent event identifiers', () => {
    // Prepare
    const event = makeEventBridgeWithMetadataRecord({ orderId: '1' });
    event.Data['replay-name'] = 'orders-replay';
    event.SystemMetadata['aws:DeliveryType'] = 'REPLAY';

    // Act
    const result = EventBridgeWithMetadataRecordSchema.parse(event);

    // Assess
    expect(result).toStrictEqual(event);
  });

  it.each([undefined, {}, { tenant: 'example' }])(
    'accepts optional producer metadata %j',
    (metadata) => {
      // Prepare
      const record = omit(
        ['Metadata'],
        makeEventBridgeWithMetadataRecord({ orderId: '1' })
      );
      const event =
        metadata === undefined ? record : { ...record, Metadata: metadata };

      // Act
      const result = EventBridgeWithMetadataRecordSchema.parse(event);

      // Assess
      expect(result).toStrictEqual(event);
    }
  );

  it.each([
    [],
    {},
    null,
    undefined,
    'event',
    makeEventBridgeWithMetadataRecord({ orderId: '1' }),
  ])('rejects a non-batch input %j', (event) => {
    // Act
    const result = EventBridgeWithMetadataSchema.safeParse(event);

    // Assess
    expect(result.success).toBe(false);
  });

  it.each([
    undefined,
    null,
    [],
    'metadata',
    {},
    { 'aws:DeliveryType': 'OTHER' },
    { 'aws:DeliveryType': 1 },
  ])('rejects invalid system metadata %j', (systemMetadata) => {
    // Prepare
    const event = {
      ...makeEventBridgeWithMetadataRecord({ orderId: '1' }),
      SystemMetadata: systemMetadata,
    };

    // Act
    const result = EventBridgeWithMetadataRecordSchema.safeParse(event);

    // Assess
    expect(result.success).toBe(false);
  });

  it.each([
    'ContentType',
    'EventGroupId',
    'DeduplicationId',
    'aws:EventId',
    'aws:IngestionTime',
    'aws:SequenceNumber',
    'aws:Source',
    'aws:DetailType',
    'aws:SchemaId',
    'aws:RegistryType',
  ])('requires a string for optional field %s', (field) => {
    // Prepare
    const valid = { 'aws:DeliveryType': 'LIVE', [field]: 'value' };
    const invalid = { ...valid, [field]: 123 };

    // Act
    const accepted = EventBridgeWithMetadataSystemMetadataSchema.parse(valid);
    const rejected =
      EventBridgeWithMetadataSystemMetadataSchema.safeParse(invalid);

    // Assess
    expect(accepted).toEqual(valid);
    expect(rejected.success).toBe(false);
  });

  it.each([null, [], 'metadata', { tenant: 1 }])(
    'rejects invalid producer metadata %j',
    (metadata) => {
      // Prepare
      const event = {
        ...makeEventBridgeWithMetadataRecord({ orderId: '1' }),
        Metadata: metadata,
      };

      // Act
      const result = EventBridgeWithMetadataRecordSchema.safeParse(event);

      // Assess
      expect(result.success).toBe(false);
    }
  );

  it.each([
    null,
    undefined,
    { orderId: 'raw-event' },
    { ...makeEventBridgeWithMetadataRecord({}).Data, time: 'invalid' },
    omit(['detail-type'], makeEventBridgeWithMetadataRecord({}).Data),
  ])('rejects malformed standard event data %j', (data) => {
    // Prepare
    const event = {
      ...makeEventBridgeWithMetadataRecord({ orderId: '1' }),
      Data: data,
    };

    // Act
    const result = EventBridgeWithMetadataRecordSchema.safeParse(event);

    // Assess
    expect(result.success).toBe(false);
  });

  it('extends the record schema to parse details and retain metadata', () => {
    // Prepare
    const schema = EventBridgeWithMetadataRecordSchema.extend({
      Data: EventBridgeSchema.extend({
        detail: z.object({ orderId: z.string().transform(Number) }),
      }),
    });
    const event = makeEventBridgeWithMetadataRecord({ orderId: '42' });
    event.Metadata = { tenant: 'example' };

    // Act
    const result = schema.parse(event);

    // Assess
    expect(result.Data.detail).toEqual({ orderId: 42 });
    expect(result.Metadata).toEqual({ tenant: 'example' });
    expect(result.SystemMetadata).toEqual(event.SystemMetadata);
  });
});
