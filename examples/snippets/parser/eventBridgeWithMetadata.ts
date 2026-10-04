import { parse } from '@aws-lambda-powertools/parser';
import { EventBridgeWithMetadataEnvelope } from '@aws-lambda-powertools/parser/envelopes';
import {
  EventBridgeSchema,
  EventBridgeWithMetadataRecordSchema,
} from '@aws-lambda-powertools/parser/schemas';
import { z } from 'zod';

const orderSchema = z.object({ orderId: z.string() });

// Extract details from a nonempty batch, even when it contains only one record.
export const handler = async (event: unknown) => {
  const orders = parse(event, EventBridgeWithMetadataEnvelope, orderSchema);
  return orders.map((order) => order.orderId);
};

// Return a failed result with the original event instead of throwing.
export const safeHandler = async (event: unknown) => {
  const result = parse(
    event,
    EventBridgeWithMetadataEnvelope,
    orderSchema,
    true
  );
  if (!result.success) {
    console.error('Invalid delivery', result.error, result.originalEvent);
    return;
  }
  return result.data;
};

// Extend the record schema when you also need delivery metadata.
const recordSchema = EventBridgeWithMetadataRecordSchema.extend({
  Data: EventBridgeSchema.extend({ detail: orderSchema }),
});
const batchSchema = recordSchema.array().nonempty();

export const metadataHandler = async (event: unknown) => {
  const records = batchSchema.parse(event);
  return records.map((record) => ({
    orderId: record.Data.detail.orderId,
    deliveryType: record.SystemMetadata['aws:DeliveryType'],
    // Keep sequence numbers as strings to avoid precision loss.
    sequence: record.SystemMetadata['aws:SequenceNumber'],
  }));
};

// Use the record schema for single-object delivery with MaxBatchSize: 1.
export const singleRecordHandler = async (event: unknown) =>
  recordSchema.parse(event);
