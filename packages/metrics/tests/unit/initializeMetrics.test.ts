import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_NAMESPACE } from '../../src/constants.js';
import { MetricUnit, Metrics } from '../../src/index.js';
import type { ConfigServiceInterface } from '../../src/types/index.js';

describe('Initialize Metrics', () => {
  const ENVIRONMENT_VARIABLES = process.env;

  beforeEach(() => {
    process.env = { ...ENVIRONMENT_VARIABLES, POWERTOOLS_DEV: 'true' };
    vi.resetAllMocks();
  });

  it('uses the default service name when none is provided', () => {
    // Prepare
    process.env.POWERTOOLS_SERVICE_NAME = undefined;
    const metrics = new Metrics({ singleMetric: true });

    // Act
    metrics.addMetric('test', MetricUnit.Count, 1);

    // Assess
    expect(console.log).toHaveBeenCalledTimes(1);
    expect(console.log).toHaveEmittedEMFWith(
      expect.objectContaining({ service: 'service_undefined' })
    );
  });

  it('uses the service name provided in the constructor', () => {
    // Prepare
    process.env.POWERTOOLS_SERVICE_NAME = undefined;
    const metrics = new Metrics({
      singleMetric: true,
      serviceName: 'hello-world-from-constructor',
    });

    // Act
    metrics.addMetric('test', MetricUnit.Count, 1);

    // Assess
    expect(console.log).toHaveBeenCalledTimes(1);
    expect(console.log).toHaveEmittedEMFWith(
      expect.objectContaining({ service: 'hello-world-from-constructor' })
    );
  });

  it('uses the service name provided in the environment variables', () => {
    // Prepare
    process.env.POWERTOOLS_SERVICE_NAME = 'hello-world-from-env';
    const metrics = new Metrics({ singleMetric: true });

    // Act
    metrics.addMetric('test', MetricUnit.Count, 1);

    // Assess
    expect(console.log).toHaveBeenCalledTimes(1);
    expect(console.log).toHaveEmittedEMFWith(
      expect.objectContaining({ service: 'hello-world-from-env' })
    );
  });

  it('uses the default namespace when none is provided', () => {
    // Prepare
    const metrics = new Metrics({ singleMetric: true });

    // Act
    metrics.addMetric('test', MetricUnit.Count, 1);

    // Assess
    expect(console.log).toHaveBeenCalledTimes(1);
    expect(console.log).toHaveEmittedMetricWith(
      expect.objectContaining({ Namespace: DEFAULT_NAMESPACE })
    );
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledWith(
      'Namespace should be defined, default used'
    );
  });

  it('uses the namespace provided in the constructor', () => {
    // Prepare
    const metrics = new Metrics({
      singleMetric: true,
      namespace: 'hello-world-namespace',
    });

    // Act
    metrics.addMetric('test', MetricUnit.Count, 1);

    // Assess
    expect(console.log).toHaveBeenCalledTimes(1);
    expect(console.log).toHaveEmittedMetricWith(
      expect.objectContaining({ Namespace: 'hello-world-namespace' })
    );
  });

  it('uses the namespace provided in the environment variables', () => {
    // Prepare
    process.env.POWERTOOLS_METRICS_NAMESPACE = 'hello-world-namespace-from-env';
    const metrics = new Metrics({ singleMetric: true });

    // Act
    metrics.addMetric('test', MetricUnit.Count, 1);

    // Assess
    expect(console.log).toHaveBeenCalledTimes(1);
    expect(console.log).toHaveEmittedMetricWith(
      expect.objectContaining({ Namespace: 'hello-world-namespace-from-env' })
    );
  });

  it('uses the custom config service provided', () => {
    // Prepare
    const configService = {
      getNamespace(): string {
        return 'custom-namespace';
      },
      getServiceName(): string {
        return 'custom-service';
      },
      isDevMode(): boolean {
        return false;
      },
      isValueTrue(value: string): boolean {
        return value === 'true';
      },
    };
    const metrics = new Metrics({
      singleMetric: true,
      customConfigService: configService as unknown as ConfigServiceInterface,
    });

    // Act
    metrics.addMetric('test', MetricUnit.Count, 1);

    // Assess
    expect(console.log).toHaveEmittedNthEMFWith(
      1,
      expect.objectContaining({ service: 'custom-service' })
    );
    expect(console.log).toHaveEmittedNthMetricWith(
      1,
      expect.objectContaining({ Namespace: 'custom-namespace' })
    );
  });

  it("doesn't use the global console object by default", () => {
    // Prepare
    process.env.POWERTOOLS_DEV = undefined;
    const metrics = new Metrics();

    // Assess
    // biome-ignore lint/complexity/useLiteralKeys: we need to access the internal console object
    expect(metrics['console']).not.toEqual(console);
  });
});
