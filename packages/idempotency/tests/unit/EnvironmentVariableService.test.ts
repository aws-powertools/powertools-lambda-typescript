/**
 * Test EnvironmentVariableService class
 *
 * @group unit/idempotency/environment-variables-service
 */
import { EnvironmentVariablesService } from '../../src/config/EnvironmentVariablesService.js';

describe('Class: EnvironmentVariableService', () => {
  const ENVIRONMENT_VARIABLES = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ENVIRONMENT_VARIABLES };
  });

  afterEach(() => {
    process.env = ENVIRONMENT_VARIABLES;
  });

  describe('Method: getFunctionName', () => {
    test('When called, it gets the Lambda function name from the environment variable', () => {
      // Prepare
      const expectedName = process.env.AWS_LAMBDA_FUNCTION_NAME;

      // Act
      const lambdaName = new EnvironmentVariablesService().getFunctionName();

      // Assess
      expect(lambdaName).toEqual(expectedName);
    });

    test('When called without the environment variable set, it returns an empty string', () => {
      // Prepare
      process.env.AWS_LAMBDA_FUNCTION_NAME = undefined;

      // Act
      const lambdaName = new EnvironmentVariablesService().getFunctionName();

      // Assess
      expect(lambdaName).toEqual('');
    });
  });
});
