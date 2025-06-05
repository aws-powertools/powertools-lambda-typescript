class KafkaConsumerProtobufMissingSchemaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'KafkaConsumerProtobufMissingSchemaError';
  }
}

class KafkaConsumerDeserializationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'KafkaConsumerDeserializationError';
  }
}

class KafkaConsumerAvroMissingSchemaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'KafkaConsumerAvroMissingSchemaError';
  }
}

export {
  KafkaConsumerAvroMissingSchemaError,
  KafkaConsumerDeserializationError,
  KafkaConsumerProtobufMissingSchemaError,
};
