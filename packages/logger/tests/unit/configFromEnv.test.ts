import { beforeEach, describe, expect, it } from 'vitest';
import { EnvironmentVariablesService } from '../../src/config/EnvironmentVariablesService.js';

describe('Class: EnvironmentVariablesService', () => {
  const ENVIRONMENT_VARIABLES = process.env;

  beforeEach(() => {
    process.env = { ...ENVIRONMENT_VARIABLES };
  });

  it('returns the value of the environment variable AWS_LAMBDA_LOG_LEVEL and aliases it as needed', () => {
    // Prepare
    process.env.AWS_LAMBDA_LOG_LEVEL = 'FATAL';
    const service = new EnvironmentVariablesService();

    // Act
    const value = service.getAwsLogLevel();

    // Assess
    // The Advanced Logging Controls feature in AWS Lambda supports the `FATAL` log level, which we don't support
    // and instead map to `CRITICAL` as per the existing log levels. In this test, we expect the value to be `CRITICAL`.
    expect(value).toEqual('CRITICAL');
  });

  it('returns the value of the environment variable AWS_REGION', () => {
    // Prepare
    process.env.AWS_REGION = 'us-east-1';
    const service = new EnvironmentVariablesService();

    // Act
    const value = service.getAwsRegion();

    // Assess
    expect(value).toEqual('us-east-1');
  });

  it('returns the value of the environment variable AWS_REGION', () => {
    // Prepare
    process.env.ENVIRONMENT = 'stage';
    const service = new EnvironmentVariablesService();

    // Act
    const value = service.getCurrentEnvironment();

    // Assess
    expect(value).toEqual('stage');
  });

  it('returns the value of the environment variable AWS_LAMBDA_FUNCTION_MEMORY_SIZE', () => {
    // Prepare
    process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE = '123456';
    const service = new EnvironmentVariablesService();

    // Act
    const value = service.getFunctionMemory();

    // Assess
    expect(value).toBe(123456);
  });

  it('returns the value of the environment variable AWS_LAMBDA_FUNCTION_NAME', () => {
    // Prepare
    process.env.AWS_LAMBDA_FUNCTION_NAME = 'my-lambda-function';
    const service = new EnvironmentVariablesService();

    // Act
    const value = service.getFunctionName();

    // Assess
    expect(value).toEqual('my-lambda-function');
  });

  it('returns the value of the environment variable AWS_LAMBDA_FUNCTION_VERSION', () => {
    // Prepare
    process.env.AWS_LAMBDA_FUNCTION_VERSION = '1.4.0';
    const service = new EnvironmentVariablesService();

    // Act
    const value = service.getFunctionVersion();

    // Assess
    expect(value).toEqual('1.4.0');
  });

  it('returns true if the environment variable POWERTOOLS_LOGGER_LOG_EVENT is "true"', () => {
    // Prepare
    process.env.POWERTOOLS_LOGGER_LOG_EVENT = 'true';
    const service = new EnvironmentVariablesService();

    // Act
    const value = service.getLogEvent();

    // Assess
    expect(value).toEqual(true);
  });

  it('returns false if the environment variable POWERTOOLS_LOGGER_LOG_EVENT is "false"', () => {
    // Prepare
    process.env.POWERTOOLS_LOGGER_LOG_EVENT = 'false';
    const service = new EnvironmentVariablesService();

    // Act
    const value = service.getLogEvent();

    // Assess
    expect(value).toEqual(false);
  });

  it('returns false if the environment variable POWERTOOLS_LOGGER_LOG_EVENT is "somethingsilly"', () => {
    // Prepare
    process.env.POWERTOOLS_LOGGER_LOG_EVENT = 'somethingsilly';
    const service = new EnvironmentVariablesService();

    // Act
    const value = service.getLogEvent();

    // Assess
    expect(value).toEqual(false);
  });

  it('returns the value of the environment variable LOG_LEVEL when POWERTOOLS_LOG_LEVEL is not set', () => {
    // Prepare
    process.env.POWERTOOLS_LOG_LEVEL = undefined;
    process.env.LOG_LEVEL = 'ERROR';
    const service = new EnvironmentVariablesService();

    // Act
    const value = service.getLogLevel();

    // Assess
    expect(value).toEqual('ERROR');
  });

  it('returns the value of the environment variable POWERTOOLS_LOG_LEVEL when LOG_LEVEL one is also set', () => {
    // Prepare
    process.env.LOG_LEVEL = 'WARN';
    process.env.POWERTOOLS_LOG_LEVEL = 'INFO';
    const service = new EnvironmentVariablesService();

    // Act
    const value = service.getLogLevel();

    // Assess
    expect(value).toEqual('INFO');
  });

  it('returns an empty value if neither POWERTOOLS_LOG_LEVEL nor LOG_LEVEL are set', () => {
    // Prepare
    process.env.LOG_LEVEL = undefined;
    process.env.POWERTOOLS_LOG_LEVEL = undefined;
    const service = new EnvironmentVariablesService();

    // Act
    const value = service.getLogLevel();

    // Assess
    expect(value).toEqual('');
  });

  it('returns the value of the environment variable POWERTOOLS_LOGGER_SAMPLE_RATE', () => {
    // Prepare
    process.env.POWERTOOLS_LOGGER_SAMPLE_RATE = '0.01';
    const service = new EnvironmentVariablesService();

    // Act
    const value = service.getSampleRateValue();

    // Assess
    expect(value).toEqual(0.01);
  });

  it('returns the value of the TZ environment variable when set', () => {
    // Prepare
    process.env.TZ = 'Europe/London';
    const service = new EnvironmentVariablesService();

    // Act
    const value = service.getTimezone();

    // Assess
    expect(value).toEqual('Europe/London');
  });

  it('returns the default UTC value when no TZ is set', () => {
    // Prepare
    const service = new EnvironmentVariablesService();

    // Act
    const value = service.getTimezone();

    // Assess
    expect(value).toEqual('UTC');
  });
});
