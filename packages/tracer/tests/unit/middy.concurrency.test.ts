import context from '@aws-lambda-powertools/testing-utils/context';
import middy from '@middy/core';
import type { Context } from 'aws-lambda';
import { Segment, Subsegment } from 'aws-xray-sdk-core';
import { describe, expect, it, vi } from 'vitest';
import { Tracer } from '../../src/index.js';
import { captureLambdaHandler } from '../../src/middleware/middy.js';

/**
 * When multiple invocations are multiplexed into the same execution
 * environment (e.g. Lambda Managed Instances with
 * `perExecutionEnvironmentMaxConcurrency` > 1), the same middleware instance
 * handles overlapping invocations. Per-invocation state must therefore live
 * in `request.internal` rather than in factory-closure variables, so each
 * invocation closes the subsegment it opened and restores the facade segment
 * it captured - regardless of interleaving or completion order.
 *
 * Note: correct *attribution* of annotations/metadata under concurrent
 * invocations (aws-powertools/powertools-lambda-typescript#5434) is not
 * covered here as it requires per-invocation context isolation in the X-Ray
 * SDK and cannot be provided from within a middy middleware.
 */
describe('Middy middleware: concurrent invocations', () => {
  const setupOverlappingInvocations = () => {
    const tracer = new Tracer({ serviceName: 'concurrency-test' });
    vi.spyOn(tracer, 'annotateColdStart').mockImplementation(() => ({}));
    vi.spyOn(tracer, 'addServiceNameAnnotation').mockImplementation(
      () => ({})
    );
    const setSegmentSpy = vi
      .spyOn(tracer.provider, 'setSegment')
      .mockImplementation(() => ({}));

    const facadeSegmentA = new Segment('facadeA');
    const handlerSubsegmentA = new Subsegment('## index.handlerA');
    vi.spyOn(facadeSegmentA, 'addNewSubsegment').mockImplementation(
      () => handlerSubsegmentA
    );
    const facadeSegmentB = new Segment('facadeB');
    const handlerSubsegmentB = new Subsegment('## index.handlerB');
    vi.spyOn(facadeSegmentB, 'addNewSubsegment').mockImplementation(
      () => handlerSubsegmentB
    );
    vi.spyOn(tracer.provider, 'getSegment')
      .mockImplementationOnce(() => facadeSegmentA)
      .mockImplementationOnce(() => facadeSegmentB);
    const closeSpyA = vi.spyOn(handlerSubsegmentA, 'close');
    const closeSpyB = vi.spyOn(handlerSubsegmentB, 'close');

    // Gates to interleave the two invocations: each handler blocks until released
    const gates = [
      Promise.withResolvers<void>(),
      Promise.withResolvers<void>(),
    ];
    const handler = middy(
      async (event: { idx: number }, _context: Context) => {
        await gates[event.idx].promise;
      }
    ).use(captureLambdaHandler(tracer, { captureResponse: false }));

    return {
      handler,
      gates,
      facadeSegmentA,
      facadeSegmentB,
      handlerSubsegmentA,
      handlerSubsegmentB,
      closeSpyA,
      closeSpyB,
      setSegmentSpy,
    };
  };

  it('closes the subsegment opened by the same invocation when invocations overlap', async () => {
    // Prepare
    const {
      handler,
      gates,
      facadeSegmentA,
      facadeSegmentB,
      closeSpyA,
      closeSpyB,
      setSegmentSpy,
    } = setupOverlappingInvocations();

    // Act
    // Invocation A enters the handler and blocks, then invocation B enters
    // while A is still in flight, then A completes, then B completes.
    const invocationA = handler({ idx: 0 }, context);
    const invocationB = handler({ idx: 1 }, context);
    gates[0].resolve();
    await invocationA;
    gates[1].resolve();
    await invocationB;

    // Assess
    // Each invocation must close its own subsegment exactly once ...
    expect(closeSpyA).toHaveBeenCalledTimes(1);
    expect(closeSpyB).toHaveBeenCalledTimes(1);
    // ... and restore the facade segment it captured at open time
    expect(setSegmentSpy).toHaveBeenCalledTimes(4);
    expect(setSegmentSpy).toHaveBeenNthCalledWith(3, facadeSegmentA);
    expect(setSegmentSpy).toHaveBeenNthCalledWith(4, facadeSegmentB);
  });

  it('closes the right subsegments when invocations complete in reverse order', async () => {
    // Prepare
    const {
      handler,
      gates,
      facadeSegmentA,
      facadeSegmentB,
      closeSpyA,
      closeSpyB,
      setSegmentSpy,
    } = setupOverlappingInvocations();

    // Act
    // Invocation A enters first but finishes last; invocation B enters
    // second and finishes first.
    const invocationA = handler({ idx: 0 }, context);
    const invocationB = handler({ idx: 1 }, context);
    gates[1].resolve();
    await invocationB;
    gates[0].resolve();
    await invocationA;

    // Assess
    expect(closeSpyA).toHaveBeenCalledTimes(1);
    expect(closeSpyB).toHaveBeenCalledTimes(1);
    expect(setSegmentSpy).toHaveBeenCalledTimes(4);
    expect(setSegmentSpy).toHaveBeenNthCalledWith(3, facadeSegmentB);
    expect(setSegmentSpy).toHaveBeenNthCalledWith(4, facadeSegmentA);
  });
});
