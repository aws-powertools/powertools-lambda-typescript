import { deserialize } from '@aws-lambda-powertools/kafka/deserializer/avro';
import type { MSKEvent } from '@aws-lambda-powertools/kafka/types';
import { MetricResolution, Metrics } from '@aws-lambda-powertools/metrics';
import { Tracer } from '@aws-lambda-powertools/tracer';
import type { Context } from 'aws-lambda';

const metrics = new Metrics();
const tracer = new Tracer();

const schema = `{
  "type": "record",
  "name": "CustomerProfile",
  "namespace": "com.example",
  "fields": [
    {"name": "user_id", "type": "string"},
    {"name": "full_name", "type": "string"},
    {"name": "email", "type": {
      "type": "record",
      "name": "EmailAddress",
      "fields": [
        {"name": "address", "type": "string"},
        {"name": "verified", "type": "boolean"},
        {"name": "primary", "type": "boolean"}
      ]
    }},
    {"name": "age", "type": "int"},
    {"name": "address", "type": {
      "type": "record",
      "name": "Address",
      "fields": [
        {"name": "street", "type": "string"},
        {"name": "city", "type": "string"},
        {"name": "state", "type": "string"},
        {"name": "country", "type": "string"},
        {"name": "zip_code", "type": "string"}
      ]
    }},
    {"name": "phone_numbers", "type": {
      "type": "array",
      "items": {
        "type": "record",
        "name": "PhoneNumber",
        "fields": [
          {"name": "number", "type": "string"},
          {"name": "type", "type": {"type": "enum", "name": "PhoneType", "symbols": ["HOME", "WORK", "MOBILE"]}}
        ]
      }
    }},
    {"name": "preferences", "type": {
      "type": "map",
      "values": "string"
    }},
    {"name": "account_status", "type": {"type": "enum", "name": "AccountStatus", "symbols": ["ACTIVE", "INACTIVE", "SUSPENDED"]}}
  ]
}`;

export const handler = async (event: MSKEvent, context: Context) => {
  const segment = tracer.getSegment();
  const subsegment = segment?.addNewSubsegment('ProcessRecords');

  const startTime = performance.now();
  for (const recordsArray of Object.values(event.records)) {
    for (const record of recordsArray) {
      const deserialized = await deserialize(record.value, schema);
    }
  }
  const executionTime = performance.now() - startTime;
  metrics.addMetric(
    `AVRO_VALUE_ACCESS_${context.memoryLimitInMB}`,
    'Milliseconds',
    executionTime,
    MetricResolution.High
  );

  subsegment?.close();
  metrics.publishStoredMetrics();
};
