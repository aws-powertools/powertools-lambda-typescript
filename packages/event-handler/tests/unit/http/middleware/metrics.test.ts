import { Metrics } from '@aws-lambda-powertools/metrics';
import context from '@aws-lambda-powertools/testing-utils/context';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestError } from '../../../../src/http/errors.js';
import { metrics as metricsMiddleware } from '../../../../src/http/middleware/metrics.js';
import { Router } from '../../../../src/http/Router.js';
import {
  createTestALBEvent,
  createTestEvent,
  createTestEventV2,
} from '../helpers.js';

describe('Metrics Middleware', () => {
  let app: Router;

  beforeEach(() => {
    vi.stubEnv('POWERTOOLS_DEV', 'true');
    vi.stubEnv('POWERTOOLS_METRICS_DISABLED', 'false');
    vi.clearAllMocks();
    app = new Router();
  });

  it('emits latency, fault=0, error=0 with route dimension for successful requests', async () => {
    // Prepare
    const metrics = new Metrics({ namespace: 'test' });
    app.use(metricsMiddleware(metrics));
    app.get('/test', async () => ({ ok: true }));

    // Act
    await app.resolve(createTestEvent('/test', 'GET'), context);

    // Assess
    expect(console.log).toHaveEmittedEMFWith(
      expect.objectContaining({
        route: 'GET /test',
        statusCode: '200',
        fault: 0,
        error: 0,
      })
    );
    expect(console.log).toHaveEmittedMetricWith(
      expect.objectContaining({
        Dimensions: [['service', 'route']],
        Metrics: expect.arrayContaining([
          { Name: 'latency', Unit: 'Milliseconds' },
          { Name: 'fault', Unit: 'Count' },
          { Name: 'error', Unit: 'Count' },
        ]),
      })
    );
  });

  it('emits error=1, fault=0 for 4xx responses', async () => {
    // Prepare
    const metrics = new Metrics({ namespace: 'test' });
    app.use(metricsMiddleware(metrics));
    app.get('/error', () => {
      throw new BadRequestError('bad');
    });

    // Act
    await app.resolve(createTestEvent('/error', 'GET'), context);

    // Assess
    expect(console.log).toHaveEmittedEMFWith(
      expect.objectContaining({
        route: 'GET /error',
        statusCode: '400',
        fault: 0,
        error: 1,
      })
    );
    expect(console.log).toHaveEmittedMetricWith(
      expect.objectContaining({
        Dimensions: [['service', 'route']],
        Metrics: expect.arrayContaining([
          { Name: 'latency', Unit: 'Milliseconds' },
          { Name: 'fault', Unit: 'Count' },
          { Name: 'error', Unit: 'Count' },
        ]),
      })
    );
  });

  it('emits fault=1, error=0 for 5xx responses', async () => {
    // Prepare
    const metrics = new Metrics({ namespace: 'test' });
    app.use(metricsMiddleware(metrics));
    app.get('/fault', () => {
      throw new Error('unexpected');
    });

    // Act
    await app.resolve(createTestEvent('/fault', 'GET'), context);

    // Assess
    expect(console.log).toHaveEmittedEMFWith(
      expect.objectContaining({
        route: 'GET /fault',
        statusCode: '500',
        fault: 1,
        error: 0,
      })
    );
    expect(console.log).toHaveEmittedMetricWith(
      expect.objectContaining({
        Dimensions: [['service', 'route']],
        Metrics: expect.arrayContaining([
          { Name: 'latency', Unit: 'Milliseconds' },
          { Name: 'fault', Unit: 'Count' },
          { Name: 'error', Unit: 'Count' },
        ]),
      })
    );
  });

  it('emits metrics with the route pattern for dynamic routes', async () => {
    // Prepare
    const metrics = new Metrics({ namespace: 'test' });
    app.use(metricsMiddleware(metrics));
    app.get('/users/:id', async () => ({ ok: true }));

    // Act
    await app.resolve(createTestEvent('/users/123', 'GET'), context);

    // Assess
    expect(console.log).toHaveEmittedEMFWith(
      expect.objectContaining({
        route: 'GET /users/:id',
      })
    );
    expect(console.log).toHaveEmittedMetricWith(
      expect.objectContaining({
        Dimensions: [['service', 'route']],
        Metrics: expect.arrayContaining([
          { Name: 'latency', Unit: 'Milliseconds' },
          { Name: 'fault', Unit: 'Count' },
          { Name: 'error', Unit: 'Count' },
        ]),
      })
    );
  });

  it('adds httpMethod and path metadata for all requests', async () => {
    // Prepare
    const metrics = new Metrics({ namespace: 'test' });
    app.use(metricsMiddleware(metrics));
    app.get('/test', async () => ({ ok: true }));

    // Act
    await app.resolve(createTestEvent('/test', 'GET'), context);

    // Assess
    expect(console.log).toHaveEmittedEMFWith(
      expect.objectContaining({
        httpMethod: 'GET',
        path: '/test',
      })
    );
  });

  it('uses NOT_FOUND as route dimension for 404 responses', async () => {
    // Prepare
    const metrics = new Metrics({ namespace: 'test' });
    app.use(metricsMiddleware(metrics));

    // Act
    await app.resolve(createTestEvent('/nonexistent', 'GET'), context);

    // Assess
    expect(console.log).toHaveEmittedEMFWith(
      expect.objectContaining({
        route: 'NOT_FOUND',
        statusCode: '404',
        httpMethod: 'GET',
        path: '/nonexistent',
        error: 1,
      })
    );
  });

  it('adds ipAddress from identity.sourceIp for API Gateway V1 events', async () => {
    // Prepare
    const metrics = new Metrics({ namespace: 'test' });
    app.use(metricsMiddleware(metrics));
    app.get('/test', async () => ({ ok: true }));

    // Act
    await app.resolve(createTestEvent('/test', 'GET'), context);

    // Assess
    expect(console.log).toHaveEmittedEMFWith(
      expect.objectContaining({
        ipAddress: '192.0.2.1',
      })
    );
  });

  it('adds ipAddress from http.sourceIp for API Gateway V2 events', async () => {
    // Prepare
    const metrics = new Metrics({ namespace: 'test' });
    app.use(metricsMiddleware(metrics));
    app.get('/test', async () => ({ ok: true }));

    // Act
    await app.resolve(createTestEventV2('/test', 'GET'), context);

    // Assess
    expect(console.log).toHaveEmittedEMFWith(
      expect.objectContaining({
        ipAddress: '127.0.0.1',
      })
    );
  });

  it('falls back to X-Forwarded-For for ALB events', async () => {
    // Prepare
    const metrics = new Metrics({ namespace: 'test' });
    app.use(metricsMiddleware(metrics));
    app.get('/test', async () => ({ ok: true }));

    // Act
    await app.resolve(
      createTestALBEvent('/test', 'GET', {
        'X-Forwarded-For': '203.0.113.50, 70.41.3.18',
      }),
      context
    );

    // Assess
    expect(console.log).toHaveEmittedEMFWith(
      expect.objectContaining({
        ipAddress: '203.0.113.50',
      })
    );
  });

  it('adds userAgent metadata from request headers', async () => {
    // Prepare
    const metrics = new Metrics({ namespace: 'test' });
    app.use(metricsMiddleware(metrics));
    app.get('/test', async () => ({ ok: true }));

    // Act
    await app.resolve(
      createTestEvent('/test', 'GET', {
        'User-Agent': 'test-agent/1.0',
      }),
      context
    );

    // Assess
    expect(console.log).toHaveEmittedEMFWith(
      expect.objectContaining({
        userAgent: 'test-agent/1.0',
      })
    );
  });

  it('adds apiGwRequestId, apiGwApiId, and apiGwExtendedRequestId metadata for API Gateway V1 events', async () => {
    // Prepare
    const metrics = new Metrics({ namespace: 'test' });
    app.use(metricsMiddleware(metrics));
    app.get('/test', async () => ({ ok: true }));

    // Act
    await app.resolve(createTestEvent('/test', 'GET'), context);

    // Assess
    expect(console.log).toHaveEmittedEMFWith(
      expect.objectContaining({
        apiGwRequestId: 'test-request-id-v1',
        apiGwApiId: 'api-id-v1',
        apiGwExtendedRequestId: 'test-extended-request-id',
      })
    );
  });

  it('does not add apiGwExtendedRequestId metadata when extendedRequestId is undefined for V1 events', async () => {
    // Prepare
    const metrics = new Metrics({ namespace: 'test' });
    app.use(metricsMiddleware(metrics));
    app.get('/test', async () => ({ ok: true }));
    const event = createTestEvent('/test', 'GET');
    event.requestContext.extendedRequestId = undefined;

    // Act
    await app.resolve(event, context);

    // Assess
    expect(console.log).toHaveEmittedEMFWith(
      expect.objectContaining({
        apiGwRequestId: 'test-request-id-v1',
        apiGwApiId: 'api-id-v1',
      })
    );
    expect(console.log).not.toHaveEmittedEMFWith(
      expect.objectContaining({
        apiGwExtendedRequestId: 'test-extended-request-id',
      })
    );
  });

  it('adds apiGwRequestId and apiGwApiId metadata for API Gateway V2 events', async () => {
    // Prepare
    const metrics = new Metrics({ namespace: 'test' });
    app.use(metricsMiddleware(metrics));
    app.get('/test', async () => ({ ok: true }));

    // Act
    await app.resolve(createTestEventV2('/test', 'GET'), context);

    // Assess
    expect(console.log).toHaveEmittedEMFWith(
      expect.objectContaining({
        apiGwRequestId: 'test-request-id',
        apiGwApiId: 'api-id',
      })
    );
    expect(console.log).not.toHaveEmittedEMFWith(
      expect.objectContaining({
        apiGwExtendedRequestId: 'test-extended-request-id',
      })
    );
  });

  it('does not add API Gateway metadata for ALB events', async () => {
    // Prepare
    const metrics = new Metrics({ namespace: 'test' });
    app.use(metricsMiddleware(metrics));
    app.get('/test', async () => ({ ok: true }));

    // Act
    await app.resolve(createTestALBEvent('/test', 'GET'), context);

    // Assess
    expect(console.log).not.toHaveEmittedEMFWith(
      expect.objectContaining({
        apiGwRequestId: 'test-request-id',
      })
    );
    expect(console.log).not.toHaveEmittedEMFWith(
      expect.objectContaining({
        apiGwApiId: 'api-id',
      })
    );
    expect(console.log).not.toHaveEmittedEMFWith(
      expect.objectContaining({
        apiGwExtendedRequestId: 'test-extended-request-id',
      })
    );
  });

  it('extracts client IP from X-Forwarded-For with IPv6 address for ALB events', async () => {
    // Prepare
    const metrics = new Metrics({ namespace: 'test' });
    app.use(metricsMiddleware(metrics));
    app.get('/test', async () => ({ ok: true }));

    // Act
    await app.resolve(
      createTestALBEvent('/test', 'GET', {
        'X-Forwarded-For': '2001:db8:85a3::8a2e:370:7334',
      }),
      context
    );

    // Assess
    expect(console.log).toHaveEmittedEMFWith(
      expect.objectContaining({
        ipAddress: '2001:db8:85a3::8a2e:370:7334',
      })
    );
  });

  it('does not add ipAddress for ALB events when X-Forwarded-For is missing', async () => {
    // Prepare
    const metrics = new Metrics({ namespace: 'test' });
    app.use(metricsMiddleware(metrics));
    app.get('/test', async () => ({ ok: true }));

    // Act
    await app.resolve(createTestALBEvent('/test', 'GET'), context);

    // Assess
    expect(console.log).not.toHaveEmittedEMFWith(
      expect.objectContaining({
        ipAddress: '127.0.0.1',
      })
    );
  });
});
