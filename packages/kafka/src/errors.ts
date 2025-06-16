/**
 * Error thrown when a required Protobuf schema is missing during Kafka message consumption.
 */
class KafkaConsumerProtobufMissingSchemaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'KafkaConsumerProtobufMissingSchemaError';
  }
}

/**
 * Error thrown when deserialization of a Kafka message fails.
 */
class KafkaConsumerDeserializationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'KafkaConsumerDeserializationError';
  }
}

/**
 * Error thrown when a required Avro schema is missing during Kafka message consumption.
 */
class KafkaConsumerAvroMissingSchemaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'KafkaConsumerAvroMissingSchemaError';
  }
}

class KafkaConsumerParserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'KafkaConsumerParserError';
  }
}

export {
  KafkaConsumerAvroMissingSchemaError,
  KafkaConsumerDeserializationError,
  KafkaConsumerProtobufMissingSchemaError,
  KafkaConsumerParserError,
};
