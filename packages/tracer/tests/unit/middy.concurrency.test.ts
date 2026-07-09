import context from '@aws-lambda-powertools/testing-utils/context';
import middy from '@middy/core';
import type { Context } from 'aws-lambda';
import { Segment, Subsegment } from 'aws-xray-sdk-core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Tracer } from '../../src/index.js';
import { captureLambdaHandler } from '../../src/middleware/middy.js';

// Must run before aws-xray-sdk-core is imported so the SDK initializes in
// Lambda mode with its real CLS context, which is what these tests exercise:
// in Lambda mode the SDK enters a single process-wide CLS context at init,
// so per-invocation isolation must be provided by the middleware itself.
vi.hoisted(() => {
  vi.stubEnv('LAMBDA_TASK_ROOT', '/var/task');
  vi.stubEnv('AWS_XRAY_CONTEXT_MISSING', 'IGNORE_ERROR');
  vi.stubEnv(
    '_X_AMZN_TRACE_ID',
    'Root=1-abcdef12-3456abcdef123456abcdef12;Parent=1234abcd1234abcd;Sampled=1'
  );
});

type SubsegmentWithAnnotations = Subsegment & {
  annotations?: Record<string, unknown>;
};

/**
 * Track every handler subsegment created by the middleware, in creation
 * order, regardless of which parent it was attached to; `annotations` is
 * not part of the SDK's public type but is where `addAnnotation()` writes.
 */
const trackHandlerSubsegments = (): SubsegmentWithAnnotations[] => {
  const handlerSubsegments: SubsegmentWithAnnotations[] = [];
  for (const proto of [Segment.prototype, Subsegment.prototype]) {
    const original = proto.addNewSubsegment;
    vi.spyOn(proto, 'addNewSubsegment').mockImplementation(function (
      this: Segment | Subsegment,
      name: string
    ) {
      const subsegment = original.call(this, name);
      if (name.startsWith('## ')) {
        handlerSubsegments.push(subsegment);
      }
      return subsegment;
    });
  }
  return handlerSubsegments;
};

describe('Middy middleware: concurrent invocations', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('records annotations on the subsegment of the invocation that produced them when invocations overlap', async () => {
    // Prepare
    const tracer = new Tracer({ serviceName: 'concurrency-test' });
    const handlerSubsegments = trackHandlerSubsegments();
    // Gates to interleave the two invocations: each handler blocks until released
    const gates = [
      Promise.withResolvers<void>(),
      Promise.withResolvers<void>(),
    ];
    const handler = middy(
      async (event: { idx: number; name: string }, _context: Context) => {
        await gates[event.idx].promise;
        tracer.putAnnotation('invocation', event.name);
      }
    ).use(captureLambdaHandler(tracer, { captureResponse: false }));

    // Act
    // Invocation A enters the handler and blocks, then invocation B enters
    // while A is still in flight, then A resumes and annotates, then B does
    // the same.
    const invocationA = handler({ idx: 0, name: 'A' }, context);
    const invocationB = handler({ idx: 1, name: 'B' }, context);
    gates[0].resolve();
    await invocationA;
    gates[1].resolve();
    await invocationB;

    // Assess
    // Each invocation's annotation must land on the subsegment opened by
    // that invocation's `before` hook
    expect(handlerSubsegments).toHaveLength(2);
    expect(handlerSubsegments[0].annotations).toStrictEqual(
      expect.objectContaining({ invocation: 'A' })
    );
    expect(handlerSubsegments[1].annotations).toStrictEqual(
      expect.objectContaining({ invocation: 'B' })
    );
    // Each invocation must have closed its own subsegment
    expect(handlerSubsegments[0].isClosed()).toBe(true);
    expect(handlerSubsegments[1].isClosed()).toBe(true);
  });

  it('stays isolated when invocations complete in reverse order', async () => {
    // Prepare
    const tracer = new Tracer({ serviceName: 'concurrency-test' });
    const handlerSubsegments = trackHandlerSubsegments();
    const gates = [
      Promise.withResolvers<void>(),
      Promise.withResolvers<void>(),
    ];
    const handler = middy(
      async (event: { idx: number; name: string }, _context: Context) => {
        await gates[event.idx].promise;
        tracer.putAnnotation('invocation', event.name);
      }
    ).use(captureLambdaHandler(tracer, { captureResponse: false }));

    // Act
    // Invocation A enters first but finishes last; invocation B enters
    // second, finishes first, and tears down its CLS context while A is
    // still in flight (out-of-order exit).
    const invocationA = handler({ idx: 0, name: 'A' }, context);
    const invocationB = handler({ idx: 1, name: 'B' }, context);
    gates[1].resolve();
    await invocationB;
    gates[0].resolve();
    await invocationA;

    // Assess
    expect(handlerSubsegments).toHaveLength(2);
    expect(handlerSubsegments[0].annotations).toStrictEqual(
      expect.objectContaining({ invocation: 'A' })
    );
    expect(handlerSubsegments[1].annotations).toStrictEqual(
      expect.objectContaining({ invocation: 'B' })
    );
    expect(handlerSubsegments[0].isClosed()).toBe(true);
    expect(handlerSubsegments[1].isClosed()).toBe(true);
  });
});
