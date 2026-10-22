/**
 * Types of Kafka schema formats.
 */
const SchemaType = {
  JSON: 'json',
  AVRO: 'avro',
  PROTOBUF: 'protobuf',
} as const;

/**
 * Wire formats supported for Kafka payloads.
 */
const WireFormat = {
  CONFLUENT: 'confluent',
} as const;

export { SchemaType, WireFormat };
