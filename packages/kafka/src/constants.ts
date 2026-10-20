/**
 * Types of Kafka schema formats.
 */
const SchemaType = {
  JSON: 'json',
  AVRO: 'avro',
  PROTOBUF: 'protobuf',
} as const;

export { SchemaType };
