import { InvokeStore } from '@aws/lambda-invoke-store';
import context from '@aws-lambda-powertools/testing-utils/context';
import middy from '@middy/core';
import { Subsegment } from 'aws-xray-sdk-core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Tracer } from '../../src/index.js';
import { captureLambdaHandler } from '../../src/middleware/middy.js';
import type { HttpSubsegment } from '../../src/types/ProviderService.js';
import {
  mockFetchRequest,
  mockFetchResponse,
} from '../helpers/mockRequests.js';

// Must run before aws-xray-sdk-core is imported, so that the SDK initializes in
// Lambda mode, and before the InvokeStore instance is created, so that it uses
// per-invocation contexts as the Lambda Managed Instances runtime does.
vi.hoisted(() => {
  vi.stubEnv('LAMBDA_TASK_ROOT', '/var/task');
  vi.stubEnv('AWS_XRAY_CONTEXT_MISSING', 'IGNORE_ERROR');
  vi.stubEnv(
    '_X_AMZN_TRACE_ID',
    'Root=1-abcdef12-3456abcdef123456abcdef12;Parent=1234abcd1234abcd;Sampled=1'
  );
  vi.stubEnv('AWS_LAMBDA_MAX_CONCURRENCY', '10');
});

/**
 * Track every subsegment opened for a `fetch` request, in creation order;
 * handler subsegments are opened on the facade segment, so a subsegment opened
 * on another subsegment belongs to a request.
 */
const trackFetchSubsegments = (): HttpSubsegment[] => {
  const fetchSubsegments: HttpSubsegment[] = [];
  const original = Subsegment.prototype.addNewSubsegment;
  vi.spyOn(Subsegment.prototype, 'addNewSubsegment').mockImplementation(
    function (this: Subsegment, name: string) {
      const subsegment = original.call(this, name);
      fetchSubsegments.push(subsegment as HttpSubsegment);

      return subsegment;
    }
  );

  return fetchSubsegments;
};

describe('Fetch instrumentation: concurrent invocations', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('closes the subsegment of each request when the response is received outside the invocation context', async () => {
    // Prepare
    const tracer = new Tracer({ serviceName: 'fetch-concurrency-test' });
    const fetchSubsegments = trackFetchSubsegments();
    const started = [
      Promise.withResolvers<void>(),
      Promise.withResolvers<void>(),
    ];
    const gates = [
      Promise.withResolvers<void>(),
      Promise.withResolvers<void>(),
    ];
    const requests: ReturnType<typeof mockFetchRequest>[] = [];
    const handler = middy(async (event: { idx: number; host: string }) => {
      requests[event.idx] = mockFetchRequest({
        origin: `https://${event.host}`,
        path: '/blogs',
      });
      started[event.idx].resolve();
      await gates[event.idx].promise;
    }).use(captureLambdaHandler(tracer, { captureResponse: false }));
    const invokeStore = await InvokeStore.getInstanceAsync();

    // Act
    const invocationA = invokeStore.run({}, () =>
      handler({ idx: 0, host: 'aws.amazon.com' }, context)
    );
    const invocationB = invokeStore.run({}, () =>
      handler({ idx: 1, host: 'docs.aws.amazon.com' }, context)
    );
    await Promise.all([started[0].promise, started[1].promise]);
    mockFetchResponse(requests[1], { statusCode: 500 });
    mockFetchResponse(requests[0], { statusCode: 200 });
    gates[0].resolve();
    await invocationA;
    gates[1].resolve();
    await invocationB;

    // Assess
    expect(fetchSubsegments).toHaveLength(2);
    expect(fetchSubsegments[0].http).toEqual({
      request: {
        url: 'https://aws.amazon.com/blogs',
        method: 'GET',
      },
      response: {
        status: 200,
      },
    });
    expect(fetchSubsegments[1].http).toEqual({
      request: {
        url: 'https://docs.aws.amazon.com/blogs',
        method: 'GET',
      },
      response: {
        status: 500,
      },
    });
    expect(fetchSubsegments[0].isClosed()).toBe(true);
    expect(fetchSubsegments[1].isClosed()).toBe(true);
    expect(fetchSubsegments[0].parent).not.toBe(fetchSubsegments[1].parent);
  });
});
