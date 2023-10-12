/**
 * Test Parameters EnvironmentVariablesService class
 *
 * @group unit/parameters/config
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

  describe('Method: getParametersMaxAge', () => {
    test('it returns undefined if the POWERTOOLS_PARAMETERS_MAX_AGE is empty', () => {
      // Prepare
      const service = new EnvironmentVariablesService();

      // Act
      const value = service.getParametersMaxAge();

      // Assess
      expect(value).toEqual(undefined);
    });

    test('it returns a number if the POWERTOOLS_PARAMETERS_MAX_AGE has a numeric value', () => {
      // Prepare
      process.env.POWERTOOLS_PARAMETERS_MAX_AGE = '36';
      const service = new EnvironmentVariablesService();

      // Act
      const value = service.getParametersMaxAge();

      // Assess
      expect(value).toEqual(36);
    });

    test('it logs a warning if the POWERTOOLS_PARAMETERS_MAX_AGE has a non-numeric value', () => {
      // Prepare
      process.env.POWERTOOLS_PARAMETERS_MAX_AGE = 'invalid';
      const service = new EnvironmentVariablesService();
      const warnLogspy = jest.spyOn(console, 'warn').mockImplementation();

      // Act
      const value = service.getParametersMaxAge();

      // Assess
      expect(value).toEqual(undefined);
      expect(warnLogspy).toHaveBeenCalledWith(
        'Invalid value for POWERTOOLS_PARAMETERS_MAX_AGE environment variable: [invalid], using default value of 5 seconds'
      );
    });
  });

  describe('Method: getSSMDecrypt', () => {
    test('it returns the value of the environment variable POWERTOOLS_PARAMETERS_SSM_DECRYPT', () => {
      // Prepare
      process.env.POWERTOOLS_PARAMETERS_SSM_DECRYPT = 'true';
      const service = new EnvironmentVariablesService();

      // Act
      const value = service.getSSMDecrypt();

      // Assess
      expect(value).toEqual('true');
    });
  });
});
