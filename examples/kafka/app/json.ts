import { deserialize } from '@aws-lambda-powertools/kafka/deserializer/json';
import type { MSKEvent } from '@aws-lambda-powertools/kafka/types';
import { MetricResolution, Metrics } from '@aws-lambda-powertools/metrics';
import { Tracer } from '@aws-lambda-powertools/tracer';
import type { Context } from 'aws-lambda';

const metrics = new Metrics();
const tracer = new Tracer();

export const handler = async (event: MSKEvent, context: Context) => {
  const segment = tracer.getSegment();
  const subsegment = segment?.addNewSubsegment('ProcessRecords');

  const startTime = performance.now();
  for (const recordsArray of Object.values(event.records)) {
    for (const record of recordsArray) {
      const deserialized = await deserialize(record.value);
    }
  }
  const executionTime = performance.now() - startTime;
  metrics.addMetric(
    `JSON_VALUE_ACCESS_${context.memoryLimitInMB}`,
    'Milliseconds',
    executionTime,
    MetricResolution.High
  );

  subsegment?.close();
  metrics.publishStoredMetrics();
};
