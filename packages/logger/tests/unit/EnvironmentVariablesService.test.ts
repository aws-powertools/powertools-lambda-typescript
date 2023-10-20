/**
 * Test Logger EnvironmentVariablesService class
 *
 * @group unit/logger/config
 */
import { EnvironmentVariablesService } from '../../src/config/EnvironmentVariablesService.js';

describe('Class: EnvironmentVariablesService', () => {
  const ENVIRONMENT_VARIABLES = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ENVIRONMENT_VARIABLES };
  });

  afterAll(() => {
    process.env = ENVIRONMENT_VARIABLES;
  });

  describe('Method: getAwsLogLevel', () => {
    it('returns the value of the environment variable AWS_LAMBDA_LOG_LEVEL and aliases it as needed', () => {
      // Prepare
      process.env.AWS_LAMBDA_LOG_LEVEL = 'FATAL';
      const service = new EnvironmentVariablesService();

      // Act
      const value = service.getAwsLogLevel();

      // Assess
      expect(value).toEqual('CRITICAL');
    });
  });

  describe('Method: getAwsRegion', () => {
    test('it returns the value of the environment variable AWS_REGION', () => {
      // Prepare
      process.env.AWS_REGION = 'us-east-1';
      const service = new EnvironmentVariablesService();

      // Act
      const value = service.getAwsRegion();

      // Assess
      expect(value).toEqual('us-east-1');
    });
  });

  describe('Method: getCurrentEnvironment', () => {
    test('it returns the value of the environment variable AWS_REGION', () => {
      // Prepare
      process.env.ENVIRONMENT = 'stage';
      const service = new EnvironmentVariablesService();

      // Act
      const value = service.getCurrentEnvironment();

      // Assess
      expect(value).toEqual('stage');
    });
  });

  describe('Method: getFunctionMemory', () => {
    test('it returns the value of the environment variable AWS_LAMBDA_FUNCTION_MEMORY_SIZE', () => {
      // Prepare
      process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE = '123456';
      const service = new EnvironmentVariablesService();

      // Act
      const value = service.getFunctionMemory();

      // Assess
      expect(value).toBe(123456);
    });
  });

  describe('Method: getFunctionName', () => {
    test('it returns the value of the environment variable AWS_LAMBDA_FUNCTION_NAME', () => {
      // Prepare
      process.env.AWS_LAMBDA_FUNCTION_NAME = 'my-lambda-function';
      const service = new EnvironmentVariablesService();

      // Act
      const value = service.getFunctionName();

      // Assess
      expect(value).toEqual('my-lambda-function');
    });
  });

  describe('Method: getFunctionVersion', () => {
    test('it returns the value of the environment variable AWS_LAMBDA_FUNCTION_VERSION', () => {
      // Prepare
      process.env.AWS_LAMBDA_FUNCTION_VERSION = '1.4.0';
      const service = new EnvironmentVariablesService();

      // Act
      const value = service.getFunctionVersion();

      // Assess
      expect(value).toEqual('1.4.0');
    });
  });

  describe('Method: getLogEvent', () => {
    test('it returns true if the environment variable POWERTOOLS_LOGGER_LOG_EVENT is "true"', () => {
      // Prepare
      process.env.POWERTOOLS_LOGGER_LOG_EVENT = 'true';
      const service = new EnvironmentVariablesService();

      // Act
      const value = service.getLogEvent();

      // Assess
      expect(value).toEqual(true);
    });

    test('it returns false if the environment variable POWERTOOLS_LOGGER_LOG_EVENT is "false"', () => {
      // Prepare
      process.env.POWERTOOLS_LOGGER_LOG_EVENT = 'false';
      const service = new EnvironmentVariablesService();

      // Act
      const value = service.getLogEvent();

      // Assess
      expect(value).toEqual(false);
    });

    test('it returns false if the environment variable POWERTOOLS_LOGGER_LOG_EVENT is "somethingsilly"', () => {
      // Prepare
      process.env.POWERTOOLS_LOGGER_LOG_EVENT = 'somethingsilly';
      const service = new EnvironmentVariablesService();

      // Act
      const value = service.getLogEvent();

      // Assess
      expect(value).toEqual(false);
    });
  });

  describe('Method: getLogLevel', () => {
    test('it returns the value of the environment variable LOG_LEVEL when POWERTOOLS_LOG_LEVEL is not set', () => {
      // Prepare
      process.env.POWERTOOLS_LOG_LEVEL = undefined;
      process.env.LOG_LEVEL = 'ERROR';
      const service = new EnvironmentVariablesService();

      // Act
      const value = service.getLogLevel();

      // Assess
      expect(value).toEqual('ERROR');
    });

    test('it returns the value of the environment variable POWERTOOLS_LOG_LEVEL when LOG_LEVEL one is also set', () => {
      // Prepare
      process.env.LOG_LEVEL = 'WARN';
      process.env.POWERTOOLS_LOG_LEVEL = 'INFO';
      const service = new EnvironmentVariablesService();

      // Act
      const value = service.getLogLevel();

      // Assess
      expect(value).toEqual('INFO');
    });

    test('it returns an empty value if neither POWERTOOLS_LOG_LEVEL nor LOG_LEVEL are set', () => {
      // Prepare
      process.env.LOG_LEVEL = undefined;
      process.env.POWERTOOLS_LOG_LEVEL = undefined;
      const service = new EnvironmentVariablesService();

      // Act
      const value = service.getLogLevel();

      // Assess
      expect(value).toEqual('');
    });
  });

  describe('Method: getSampleRateValue', () => {
    test('it returns the value of the environment variable POWERTOOLS_LOGGER_SAMPLE_RATE', () => {
      // Prepare
      process.env.POWERTOOLS_LOGGER_SAMPLE_RATE = '0.01';
      const service = new EnvironmentVariablesService();

      // Act
      const value = service.getSampleRateValue();

      // Assess
      expect(value).toEqual(0.01);
    });
  });
});
