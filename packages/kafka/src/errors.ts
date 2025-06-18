/**
 * Base error class for Kafka consumer-related errors.
 * All Kafka consumer errors should extend this class.
 */
class KafkaConsumerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'KafkaConsumerError';
  }
}

/**
 * Error thrown when a required Protobuf schema is missing during Kafka message consumption.
 */
class KafkaConsumerProtobufMissingSchemaError extends KafkaConsumerError {
  constructor(message: string) {
    super(message);
    this.name = 'KafkaConsumerProtobufMissingSchemaError';
  }
}

/**
 * Error thrown when deserialization of a Kafka message fails.
 */
class KafkaConsumerDeserializationError extends KafkaConsumerError {
  constructor(message: string) {
    super(message);
    this.name = 'KafkaConsumerDeserializationError';
  }
}

/**
 * Error thrown when a required Avro schema is missing during Kafka message consumption.
 */
class KafkaConsumerAvroMissingSchemaError extends KafkaConsumerError {
  constructor(message: string) {
    super(message);
    this.name = 'KafkaConsumerAvroMissingSchemaError';
  }
}

class KafkaConsumerParserError extends KafkaConsumerError {
  constructor(message: string) {
    super(message);
    this.name = 'KafkaConsumerParserError';
  }
}

export {
  KafkaConsumerError,
  KafkaConsumerAvroMissingSchemaError,
  KafkaConsumerDeserializationError,
  KafkaConsumerProtobufMissingSchemaError,
  KafkaConsumerParserError,
};
