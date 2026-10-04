import { z } from 'zod';
import { EventBridgeSchema } from './eventbridge.js';

/**
 * Validates system metadata for an EventBridge WITH_METADATA delivery.
 *
 * Only `aws:DeliveryType` is required. All metadata values, including sequence
 * numbers that can exceed JavaScript's safe integer range, remain strings.
 *
 * @see https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-custom-bus-addressing.html
 */
const EventBridgeWithMetadataSystemMetadataSchema = z.object({
  'aws:DeliveryType': z.enum(['LIVE', 'REPLAY']),
  ContentType: z.string().optional(),
  EventGroupId: z.string().optional(),
  DeduplicationId: z.string().optional(),
  'aws:EventId': z.string().optional(),
  'aws:IngestionTime': z.string().optional(),
  'aws:SequenceNumber': z.string().optional(),
  'aws:Source': z.string().optional(),
  'aws:DetailType': z.string().optional(),
  'aws:SchemaId': z.string().optional(),
  'aws:RegistryType': z.string().optional(),
});

/**
 * Validates one WITH_METADATA record containing a standard EventBridge event.
 *
 * Use this schema directly for single-object delivery with `MaxBatchSize: 1`.
 * Arbitrary `PutRawEvents` payloads are outside this schema's scope.
 */
const EventBridgeWithMetadataRecordSchema = z.object({
  Data: EventBridgeSchema,
  Metadata: z.record(z.string(), z.string()).optional(),
  SystemMetadata: EventBridgeWithMetadataSystemMetadataSchema,
});

/**
 * Validates a nonempty batch of WITH_METADATA records.
 *
 * Extend {@link EventBridgeWithMetadataRecordSchema | `EventBridgeWithMetadataRecordSchema`}
 * before creating an array schema to validate application details and retain metadata.
 */
const EventBridgeWithMetadataSchema =
  EventBridgeWithMetadataRecordSchema.array().nonempty();

export {
  EventBridgeWithMetadataRecordSchema,
  EventBridgeWithMetadataSchema,
  EventBridgeWithMetadataSystemMetadataSchema,
};
