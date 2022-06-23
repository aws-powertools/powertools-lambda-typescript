/**
 * Test Logger EnvironmentVariablesService class
 *
 * @group unit/logger/all
 */

import { EnvironmentVariablesService } from '../../../src/config';

describe('Class: EnvironmentVariablesService', () => {

  const ENVIRONMENT_VARIABLES = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ENVIRONMENT_VARIABLES };
  });

  afterAll(() => {
    process.env = ENVIRONMENT_VARIABLES;
  });

  describe('Method: get', () => {

    test('When the variable IS present, it returns the value of a runtime variable', () => {

      // Prepare
      process.env.CUSTOM_VARIABLE = 'my custom value';
      const service = new EnvironmentVariablesService();

      // Act
      const value = service.get('CUSTOM_VARIABLE');

      // Assess
      expect(value).toEqual('my custom value');

    });

    test('When the variable IS NOT present, it returns an empty string', () => {

      // Prepare
      delete process.env.CUSTOM_VARIABLE;
      const service = new EnvironmentVariablesService();

      // Act
      const value = service.get('CUSTOM_VARIABLE');

      // Assess
      expect(value).toEqual('');

    });

  });

  describe('Method: getAwsRegion', () => {

    test('It returns the value of the environment variable AWS_REGION', () => {

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

    test('It returns the value of the environment variable AWS_REGION', () => {

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

    test('It returns the value of the environment variable AWS_LAMBDA_FUNCTION_MEMORY_SIZE', () => {

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

    test('It returns the value of the environment variable AWS_LAMBDA_FUNCTION_NAME', () => {

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

    test('It returns the value of the environment variable AWS_LAMBDA_FUNCTION_VERSION', () => {

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

    test('It returns true if the environment variable POWERTOOLS_LOGGER_LOG_EVENT is "true"', () => {

      // Prepare
      process.env.POWERTOOLS_LOGGER_LOG_EVENT = 'true';
      const service = new EnvironmentVariablesService();

      // Act
      const value = service.getLogEvent();

      // Assess
      expect(value).toEqual(true);
    });

    test('It returns true if the environment variable POWERTOOLS_LOGGER_LOG_EVENT is "TRUE"', () => {

      // Prepare
      process.env.POWERTOOLS_LOGGER_LOG_EVENT = 'TRUE';
      const service = new EnvironmentVariablesService();

      // Act
      const value = service.getLogEvent();

      // Assess
      expect(value).toEqual(true);
    });

    test('It returns true if the environment variable POWERTOOLS_LOGGER_LOG_EVENT is "1"', () => {

      // Prepare
      process.env.POWERTOOLS_LOGGER_LOG_EVENT = '1';
      const service = new EnvironmentVariablesService();

      // Act
      const value = service.getLogEvent();

      // Assess
      expect(value).toEqual(true);
    });

    test('It returns false if the environment variable POWERTOOLS_LOGGER_LOG_EVENT is "false"', () => {

      // Prepare
      process.env.POWERTOOLS_LOGGER_LOG_EVENT = 'false';
      const service = new EnvironmentVariablesService();

      // Act
      const value = service.getLogEvent();

      // Assess
      expect(value).toEqual(false);
    });

    test('It returns false if the environment variable POWERTOOLS_LOGGER_LOG_EVENT is "0"', () => {

      // Prepare
      process.env.POWERTOOLS_LOGGER_LOG_EVENT = '0';
      const service = new EnvironmentVariablesService();

      // Act
      const value = service.getLogEvent();

      // Assess
      expect(value).toEqual(false);
    });

    test('It returns false if the environment variable POWERTOOLS_LOGGER_LOG_EVENT is "somethingsilly"', () => {

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

    test('It returns the value of the environment variable LOG_LEVEL', () => {

      // Prepare
      process.env.LOG_LEVEL = 'ERROR';
      const service = new EnvironmentVariablesService();

      // Act
      const value = service.getLogLevel();

      // Assess
      expect(value).toEqual('ERROR');
    });

  });

  describe('Method: getSampleRateValue', () => {

    test('It returns the value of the environment variable POWERTOOLS_LOGGER_SAMPLE_RATE', () => {

      // Prepare
      process.env.POWERTOOLS_LOGGER_SAMPLE_RATE = '0.01';
      const service = new EnvironmentVariablesService();

      // Act
      const value = service.getSampleRateValue();

      // Assess
      expect(value).toEqual(0.01);
    });

  });

  describe('Method: getServiceName', () => {

    test('It returns the value of the environment variable POWERTOOLS_SERVICE_NAME', () => {

      // Prepare
      process.env.POWERTOOLS_SERVICE_NAME = 'shopping-cart-api';
      const service = new EnvironmentVariablesService();

      // Act
      const value = service.getServiceName();

      // Assess
      expect(value).toEqual('shopping-cart-api');
    });

  });

  describe('Method: getXrayTraceId', () => {

    test('It returns the value of the environment variable _X_AMZN_TRACE_ID', () => {

      // Prepare
      process.env._X_AMZN_TRACE_ID = 'abcd123456789';
      const service = new EnvironmentVariablesService();

      // Act
      const value = service.getXrayTraceId();

      // Assess
      expect(value).toEqual('abcd123456789');
    });

  });

});