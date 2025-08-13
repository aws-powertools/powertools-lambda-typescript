import { Logger } from '../../src/Logger.js';
import { describe, it, expect, vi, afterEach } from 'vitest';

describe('Logger PowertoolsLogData environment variables', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each([
    [undefined, ''],
    ['us-west-2', 'us-west-2'],
  ])('sets awsRegion to %s when AWS_REGION env var is %s', (envValue, expected) => {
    // Prepare
    vi.stubEnv('AWS_REGION', envValue);
    // Act
    const logger = new Logger();
    // Assess
    expect(logger['powertoolsLogData'].awsRegion).toBe(expected);
  });

  it.each([
    [undefined, ''],
    ['prd', 'prd'],
  ])('sets environment to %s when ENVIRONMENT env var is %s', (envValue, expected) => {
    // Prepare
    vi.stubEnv('ENVIRONMENT', envValue);
    // Act
    const logger = new Logger();
    // Assess
    expect(logger['powertoolsLogData'].environment).toBe(expected);
  });

  it.each([
    [undefined, 'service_undefined'],
    ['my-service', 'my-service'],
  ])('sets serviceName to %s when POWERTOOLS_SERVICE_NAME env var is %s', (envValue, expected) => {
    // Prepare
    vi.stubEnv('POWERTOOLS_SERVICE_NAME', envValue);
    // Act
    const logger = new Logger();
    // Assess
    expect(logger['powertoolsLogData'].serviceName).toBe(expected);
  });
});