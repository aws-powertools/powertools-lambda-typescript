import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EnvironmentVariablesService } from '../../src/config/EnvironmentVariablesService.js';

describe('Class: EnvironmentVariableService', () => {
  const ENVIRONMENT_VARIABLES = process.env;

  beforeEach(() => {
    process.env = { ...ENVIRONMENT_VARIABLES };
  });

  afterEach(() => {
    process.env = ENVIRONMENT_VARIABLES;
  });

  describe('Method: getFunctionName', () => {
    it('gets the Lambda function name from the environment variable', () => {
      // Prepare
      const expectedName = 'test-function';
      process.env.AWS_LAMBDA_FUNCTION_NAME = expectedName;

      // Act
      const lambdaName = new EnvironmentVariablesService().getFunctionName();

      // Assess
      expect(lambdaName).toEqual(expectedName);
    });

    it('it returns an empty string when the Lambda function name is not set', () => {
      // Prepare
      process.env.AWS_LAMBDA_FUNCTION_NAME = undefined;

      // Act
      const lambdaName = new EnvironmentVariablesService().getFunctionName();

      // Assess
      expect(lambdaName).toEqual('');
    });
  });
});
