/**
 * Test EnvironmentVariablesService class
 *
 * @group unit/commons/environmentService
 */
import { EnvironmentVariablesService } from '../../src/index.js';

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
    test('It returns the value of the Root X-Ray segment ID properly formatted', () => {
      // Prepare
      process.env._X_AMZN_TRACE_ID =
        'Root=1-5759e988-bd862e3fe1be46a994272793;Parent=557abcec3ee5a047;Sampled=1';
      const service = new EnvironmentVariablesService();

      // Act
      const value = service.getXrayTraceId();

      // Assess
      expect(value).toEqual('1-5759e988-bd862e3fe1be46a994272793');
    });

    test('It returns the value of the Root X-Ray segment ID properly formatted', () => {
      // Prepare
      delete process.env._X_AMZN_TRACE_ID;
      const service = new EnvironmentVariablesService();

      // Act
      const value = service.getXrayTraceId();

      // Assess
      expect(value).toEqual(undefined);
    });
  });

  describe('Method: getXrayTraceSampled', () => {
    test('It returns true if the Sampled flag is set in the _X_AMZN_TRACE_ID environment variable', () => {
      // Prepare
      process.env._X_AMZN_TRACE_ID =
        'Root=1-5759e988-bd862e3fe1be46a994272793;Parent=557abcec3ee5a047;Sampled=1';
      const service = new EnvironmentVariablesService();

      // Act
      const value = service.getXrayTraceSampled();

      // Assess
      expect(value).toEqual(true);
    });

    test('It returns false if the Sampled flag is not set in the _X_AMZN_TRACE_ID environment variable', () => {
      // Prepare
      process.env._X_AMZN_TRACE_ID =
        'Root=1-5759e988-bd862e3fe1be46a994272793;Parent=557abcec3ee5a047';
      const service = new EnvironmentVariablesService();

      // Act
      const value = service.getXrayTraceSampled();

      // Assess
      expect(value).toEqual(false);
    });

    it('It returns false when no _X_AMZN_TRACE_ID environment variable is present', () => {
      // Prepare
      delete process.env._X_AMZN_TRACE_ID;
      const service = new EnvironmentVariablesService();

      // Act
      const value = service.getXrayTraceSampled();

      // Assess
      expect(value).toEqual(false);
    });
  });

  describe('Method: isValueTrue', () => {
    const valuesToTest: Array<Array<string | boolean>> = [
      ['1', true],
      ['y', true],
      ['yes', true],
      ['t', true],
      ['TRUE', true],
      ['on', true],
      ['', false],
      ['false', false],
      ['fasle', false],
      ['somethingsilly', false],
      ['0', false],
    ];

    test.each(valuesToTest)(
      'it takes string "%s" and returns %s',
      (input, output) => {
        // Prepare
        const service = new EnvironmentVariablesService();
        // Act
        const value = service.isValueTrue(input as string);
        // Assess
        expect(value).toBe(output);
      }
    );
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
});
