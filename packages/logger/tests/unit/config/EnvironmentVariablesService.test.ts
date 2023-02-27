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

    test('it returns the value of the environment variable LOG_LEVEL', () => {

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

  describe('Method: isDevMode', () => {

    test('it returns true if the environment variable POWERTOOLS_DEV is "true"', () => {

      // Prepare
      process.env.POWERTOOLS_DEV = 'true';
      const service = new EnvironmentVariablesService();

      // Act
      const value = service.isDevMode();

      // Assess
      expect(value).toEqual(true);

    });

    test('it returns false if the environment variable POWERTOOLS_DEV is "false"', () => {

      // Prepare
      process.env.POWERTOOLS_DEV = 'false';
      const service = new EnvironmentVariablesService();

      // Act
      const value = service.isDevMode();

      // Assess
      expect(value).toEqual(false);

    });

    test('it returns false if the environment variable POWERTOOLS_DEV is NOT set', () => {

      // Prepare
      process.env.POWERTOOLS_DEV = 'somethingsilly';
      const service = new EnvironmentVariablesService();

      // Act
      const value = service.isDevMode();

      // Assess
      expect(value).toEqual(false);

    });

    test('it returns false if the environment variable POWERTOOLS_DEV is "somethingsilly"', () => {

      // Prepare
      process.env.POWERTOOLS_DEV = 'somethingsilly';
      const service = new EnvironmentVariablesService();

      // Act
      const value = service.isDevMode();

      // Assess
      expect(value).toEqual(false);

    });

  });

  describe('Method: isValueTrue', () => {

    const valuesToTest: Array<Array<string | boolean>> = [
      [ '1', true ],
      [ 'y', true ],
      [ 'yes', true ],
      [ 't', true ],
      [ 'TRUE', true ],
      [ 'on', true ],
      [ '', false ],
      [ 'false', false ],
      [ 'fasle', false ],
      [ 'somethingsilly', false ],
      [ '0', false ]
    ];

    test.each(valuesToTest)('it takes string "%s" and returns %s', (input, output) => {
      // Prepare
      const service = new EnvironmentVariablesService();
      // Act
      const value = service.isValueTrue(input as string);
      // Assess
      expect(value).toBe(output);
    });
    
  });

});