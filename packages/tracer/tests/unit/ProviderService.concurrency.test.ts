import { InvokeStore } from '@aws/lambda-invoke-store';
import { sequence } from '@aws-lambda-powertools/testing-utils';
import { Segment, Subsegment } from 'aws-xray-sdk-core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Tracer } from '../../src/index.js';
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
  beforeEach(() => {
    InvokeStore._testing?.reset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("closes each request's subsegment when the response arrives on another invocation's context", async () => {
    // Prepare
    const tracer = new Tracer({ serviceName: 'fetch-concurrency-test' });
    const fetchSubsegments = trackFetchSubsegments();
    const requests: ReturnType<typeof mockFetchRequest>[] = [];
    // Open a fetch request inside the calling invocation's context, the way a
    // handler that awaits `fetch` would: a handler subsegment on the facade
    // segment is made active, and the request opens a subsegment under it.
    const openRequest = (idx: number, host: string) => {
      const handlerSegment = new Segment('facade').addNewSubsegment(
        `## handler-${idx}`
      );
      tracer.setSegment(handlerSegment);
      requests[idx] = mockFetchRequest({
        origin: `https://${host}`,
        path: '/blogs',
      });
    };

    // Act
    // Both invocations open a request while the other is still in flight, then
    // invocation A delivers both responses from its own context. Under the
    // Lambda Managed Instances runtime the `undici` response event runs on the
    // async chain of the connection, which is rooted in the invocation that
    // opened it and reused by the other, so a response can surface in a
    // different invocation's context than the one that made the request.
    await sequence(
      {
        sideEffects: [
          () => {
            openRequest(0, 'aws.amazon.com');
          },
          () => {
            mockFetchResponse(requests[1], { statusCode: 500 });
            mockFetchResponse(requests[0], { statusCode: 200 });
          },
        ],
        return: () => {},
      },
      {
        sideEffects: [
          () => {
            openRequest(1, 'docs.aws.amazon.com');
          },
          () => {},
        ],
        return: () => {},
      },
      { useInvokeStore: true }
    );

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
