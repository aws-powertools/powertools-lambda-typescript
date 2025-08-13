import { Logger } from '../../src/Logger.js';
import { describe, it, expect, vi } from 'vitest';

describe('Logger PowertoolsLogData AWS_REGION', () => {
  it.each([
    [undefined, ''],
    ['us-west-2', 'us-west-2'],
  ])('should set awsRegion to %s when AWS_REGION env var is %s', (envValue, expected) => {
    vi.stubEnv('AWS_REGION', envValue);
    const logger = new Logger();
    expect(logger['powertoolsLogData'].awsRegion).toBe(expected);
    vi.unstubAllEnvs();
  });
});

describe('Logger PowertoolsLogData ENVIRONMENT', () => {
  it.each([
    [undefined, ''],
    ['prd', 'prd'],
  ])('should set environment to %s when ENVIRONMENT env var is %s', (envValue, expected) => {
    vi.stubEnv('ENVIRONMENT', envValue);
    const logger = new Logger();
    expect(logger['powertoolsLogData'].environment).toBe(expected);
    vi.unstubAllEnvs();
  });
});

describe('Logger PowertoolsLogData POWERTOOLS_SERVICE_NAME', () => {
  it.each([
    [undefined, 'service_undefined'],
    ['my-service', 'my-service'],
  ])('should set serviceName to %s when POWERTOOLS_SERVICE_NAME env var is %s', (envValue, expected) => {
    vi.stubEnv('POWERTOOLS_SERVICE_NAME', envValue);
    const logger = new Logger();
    expect(logger['powertoolsLogData'].serviceName).toBe(expected);
    vi.unstubAllEnvs();
  });
});