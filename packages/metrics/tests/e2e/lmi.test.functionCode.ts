import { randomUUID } from 'node:crypto';
import {
  captureJsonStdout,
  createPeerBarrier,
} from '@aws-lambda-powertools/testing-utils/lmi/handler';
import { Metrics, MetricUnit } from '../../src/index.js';
import type { EmfOutput } from '../../src/types/index.js';

// Module scope: identifies the execution environment across invocations
const executionEnvId = randomUUID();

// The EMF payloads Metrics emits, returned in the response payload since on
// LMI the test cannot read them from the Invoke API or CloudWatch in time
const capturedPayloads = captureJsonStdout<EmfOutput>();

const metrics = new Metrics({ namespace: process.env.EXPECTED_NAMESPACE });

// Shared by invocations multiplexed into this execution environment: each one
// blocks until a second invocation is in flight, proving a genuine overlap
const awaitPeer = createPeerBarrier();

export const handler = async (event: {
  invocationId: string;
  metricValue: number;
  role: 'warmup' | 'test';
}) => {
  // Stored before the barrier so that overlapping invocations hold their
  // metric and metadata in the store at the same time. Dimensions stay at the
  // defaults so that each run adds a single metric to the namespace.
  metrics.addMetadata('invocationKey', event.invocationId);
  metrics.addMetric('LmiIsolation', MetricUnit.Count, event.metricValue);

  const sawPeer = event.role === 'test' ? await awaitPeer() : false;

  metrics.publishStoredMetrics();

  return {
    invocationId: event.invocationId,
    executionEnvId,
    sawPeer,
    initializationType: process.env.AWS_LAMBDA_INITIALIZATION_TYPE ?? 'unset',
    maxConcurrency: process.env.AWS_LAMBDA_MAX_CONCURRENCY ?? 'unset',
    // Only the payloads carrying this invocation's metadata key. Under LMI
    // multiplexing this only works because addMetadata scopes metadata per
    // invocation via the InvokeStore — an empty payloads array here is the
    // signature of that scoping regressing. The metric value assertion in the
    // test then verifies addMetric isolation on independently-selected
    // payloads.
    payloads: capturedPayloads.filter(
      (payload) => payload.invocationKey === event.invocationId
    ),
  };
};
