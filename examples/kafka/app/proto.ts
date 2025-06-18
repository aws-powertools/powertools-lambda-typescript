import { deserialize } from '@aws-lambda-powertools/kafka/deserializer/protobuf';
import type { MSKEvent } from '@aws-lambda-powertools/kafka/types';
import { MetricResolution, Metrics } from '@aws-lambda-powertools/metrics';
import { Tracer } from '@aws-lambda-powertools/tracer';
import type { Context } from 'aws-lambda';
import * as proto from './schema.generated.js';

const tracer = new Tracer();
const metrics = new Metrics();

export const handler = async (event: MSKEvent, context: Context) => {
  const segment = tracer.getSegment();
  const subsegment = segment?.addNewSubsegment('ProcessRecords');

  const startTime = performance.now();
  for (const recordsArray of Object.values(event.records)) {
    for (const record of recordsArray) {
      const deserialized = deserialize(
        record.value,
        proto.com.example.CustomerProfile
      );
    }
  }
  const executionTime = performance.now() - startTime;
  metrics.addMetric(
    `PROTOBUF_VALUE_ACCESS_${context.memoryLimitInMB}`,
    'Milliseconds',
    executionTime,
    MetricResolution.High
  );

  subsegment?.close();
  metrics.publishStoredMetrics();
};
