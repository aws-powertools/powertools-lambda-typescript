import { InvokeStore } from '@aws/lambda-invoke-store';
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
// shared by all concurrent invocations. `AWS_LAMBDA_MAX_CONCURRENCY` must be
// set before the InvokeStore instance is created so it uses per-invocation
// AsyncLocalStorage contexts, mirroring the Lambda Managed Instances runtime.
vi.hoisted(() => {
  vi.stubEnv('LAMBDA_TASK_ROOT', '/var/task');
  vi.stubEnv('AWS_XRAY_CONTEXT_MISSING', 'IGNORE_ERROR');
  vi.stubEnv(
    '_X_AMZN_TRACE_ID',
    'Root=1-abcdef12-3456abcdef123456abcdef12;Parent=1234abcd1234abcd;Sampled=1'
  );
  vi.stubEnv('AWS_LAMBDA_MAX_CONCURRENCY', '10');
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
    vi.unstubAllGlobals();
  });

  it('throws when AWS_LAMBDA_MAX_CONCURRENCY is set but the InvokeStore is not available', () => {
    // Prepare
    const tracer = new Tracer({ serviceName: 'concurrency-test' });
    vi.stubGlobal('awslambda', undefined);

    // Act & Assess
    expect(() => tracer.getSegment()).toThrow('InvokeStore is not available');
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
    const invokeStore = await InvokeStore.getInstanceAsync();

    // Act
    // Each invocation runs in its own InvokeStore context, as it does under
    // the Lambda Managed Instances runtime. Invocation A enters the handler
    // and blocks, then invocation B enters while A is still in flight, then
    // A resumes and annotates, then B does the same.
    const invocationA = invokeStore.run({}, () =>
      handler({ idx: 0, name: 'A' }, context)
    );
    const invocationB = invokeStore.run({}, () =>
      handler({ idx: 1, name: 'B' }, context)
    );
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
    const invokeStore = await InvokeStore.getInstanceAsync();

    // Act
    // Invocation A enters first but finishes last; invocation B enters
    // second, finishes first, and tears down while A is still in flight
    const invocationA = invokeStore.run({}, () =>
      handler({ idx: 0, name: 'A' }, context)
    );
    const invocationB = invokeStore.run({}, () =>
      handler({ idx: 1, name: 'B' }, context)
    );
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

  it('annotates the handler subsegment when an async before-middleware precedes captureLambdaHandler', async () => {
    // Prepare
    const tracer = new Tracer({ serviceName: 'concurrency-test' });
    const handlerSubsegments = trackHandlerSubsegments();
    const asyncMiddleware = (): middy.MiddlewareObj => ({
      before: async () => {
        // Force a real async suspension before the tracer's `before` runs,
        // so isolation can't rely on the tracer's hook being the first async
        // boundary in the invocation
        await new Promise((resolve) => setImmediate(resolve));
      },
    });
    const handler = middy(async (_event: unknown, _context: Context) => {
      tracer.putAnnotation('fromHandler', true);
    })
      .use(asyncMiddleware())
      .use(captureLambdaHandler(tracer, { captureResponse: false }));
    const invokeStore = await InvokeStore.getInstanceAsync();

    // Act
    await invokeStore.run({}, () => handler({}, context));

    // Assess
    expect(handlerSubsegments).toHaveLength(1);
    expect(handlerSubsegments[0].annotations).toStrictEqual(
      expect.objectContaining({ fromHandler: true })
    );
    expect(handlerSubsegments[0].isClosed()).toBe(true);
  });

  it('attributes errors to the invocation that threw when invocations overlap', async () => {
    // Prepare
    const tracer = new Tracer({ serviceName: 'concurrency-test' });
    const handlerSubsegments = trackHandlerSubsegments();
    const gates = [
      Promise.withResolvers<void>(),
      Promise.withResolvers<void>(),
    ];
    const handler = middy(
      async (event: { idx: number; shouldThrow?: boolean }) => {
        await gates[event.idx].promise;
        if (event.shouldThrow) {
          throw new Error('invocation error');
        }
      }
    ).use(captureLambdaHandler(tracer, { captureResponse: false }));
    const invokeStore = await InvokeStore.getInstanceAsync();

    // Act
    const invocationA = invokeStore.run({}, () =>
      handler({ idx: 0, shouldThrow: true }, context)
    );
    const invocationB = invokeStore.run({}, () => handler({ idx: 1 }, context));
    gates[0].resolve();
    await expect(invocationA).rejects.toThrow('invocation error');
    gates[1].resolve();
    await invocationB;

    // Assess
    // Only the invocation that threw carries the error
    expect(handlerSubsegments).toHaveLength(2);
    expect('cause' in handlerSubsegments[0]).toBe(true);
    expect('cause' in handlerSubsegments[1]).toBe(false);
  });
});
