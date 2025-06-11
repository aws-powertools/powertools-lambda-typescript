# AWS Powertools for AWS Lambda TypeScript - Kafka Example

This project demonstrates how to use AWS Lambda Powertools for TypeScript with Amazon MSK (Managed Streaming for Kafka) to process events from Kafka topics. It includes examples of handling different message serialization formats: JSON, Avro, and Protocol Buffers (Protobuf).

## Overview

This example showcases three different Lambda functions that consume messages from Kafka topics:

1. **JSON Deserialization**: Processes Kafka messages with JSON payload format
2. **Avro Deserialization**: Processes Kafka messages with Apache Avro serialization format
3. **Protocol Buffers Deserialization**: Processes Kafka messages with Protocol Buffers serialization format

Each function uses the `@aws-lambda-powertools/kafka` library to easily deserialize and process Kafka records.

## Project Structure

```bash
examples/kafka/
├── app/
│   ├── avro.ts         # Lambda handler for Avro deserialization
│   ├── json.ts         # Lambda handler for JSON deserialization
│   ├── proto.ts        # Lambda handler for Protocol Buffers deserialization
│   ├── product.generated.ts # Generated Protocol Buffers TypeScript code
└── template.yaml           # AWS SAM template for deploying the functions
```

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
- [AWS CLI](https://aws.amazon.com/cli/)
- An AWS account with appropriate permissions

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/aws-powertools/powertools-lambda-typescript.git
   ```

2. Navigate to the project directory:

   ```bash
   cd powertools-lambda-typescript
   ```

3. Install dependencies:

   ```bas
   npm install
   ```

4. Build the project:

   ```bash
   npm run build
   ```

## Deployment

Deploy the application using the AWS SAM CLI:

```bash
cd examples/kafka
sam build
sam deploy --guided
```

Follow the prompts to configure your deployment.

## Usage Examples

### JSON Format

The JSON example processes messages that have a simple JSON structure:

```json
{
  "id": 1,
  "name": "Product Name",
  "price": 29.99
}
```

### Avro Format

The Avro example handles messages with Avro serialization. It uses the following schema:

```json
{
  "type": "record",
  "name": "Product",
  "fields": [
    { "name": "id", "type": "int" },
    { "name": "name", "type": "string" },
    { "name": "price", "type": "double" }
  ]
}
```

### Protocol Buffers Format

The Protobuf example handles messages serialized with Protocol Buffers. The schema is defined in a `.proto` file (which would need to be created), and the TypeScript code is generated from that schema.

## How It Works

1. **Event Source**: Configure your Lambda functions with an MSK or self-managed Kafka cluster as an event source.
2. **Deserializing Records**: The `kafkaConsumer` utility from Powertools handles deserializing the records based on the specified format.
3. **Processing**: Each record is processed within the handler function, with logging provided by Powertools Logger.

## Configuration

The SAM template (`template.yaml`) defines three Lambda functions, each with different environments:

- **JsonDeserializationFunction**: Handles JSON-formatted Kafka messages
- **AvroDeserializationFunction**: Handles Avro-formatted Kafka messages
- **ProtobufDeserializationFunction**: Handles Protobuf-formatted Kafka messages

## Customization

To customize the examples:

1. Modify the schema definitions to match your data structures
2. Update the handler logic to process the records according to your requirements
3. For Protobuf, ensure you have the proper `.proto` file and generate TypeScript code

## Resources

- [AWS Lambda Powertools for TypeScript Documentation](https://docs.powertools.aws.dev/lambda/typescript/)
- [Amazon MSK Documentation](https://docs.aws.amazon.com/msk/)
- [AWS Lambda Developer Guide](https://docs.aws.amazon.com/lambda/)
- [Apache Avro Documentation](https://avro.apache.org/docs/)
- [Protocol Buffers Documentation](https://developers.google.com/protocol-buffers)
