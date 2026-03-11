import { Metrics } from '@aws-lambda-powertools/metrics';
import context from '@aws-lambda-powertools/testing-utils/context';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestError } from '../../../../src/http/errors.js';
import { metrics as metricsMiddleware } from '../../../../src/http/middleware/metrics.js';
import { Router } from '../../../../src/http/Router.js';
import { createTestEvent } from '../helpers.js';

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
});
