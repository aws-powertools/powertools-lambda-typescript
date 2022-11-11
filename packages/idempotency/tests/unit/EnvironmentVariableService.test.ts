/**
 * Test EnvironmentVariableService class
 *
 * @group unit/idempotency/all
 */
import { EnvironmentVariablesService } from '../../src/EnvironmentVariablesService';

describe('Class: EnvironmentVariableService', ()=> {
  describe('Method: getLambdaFunctionName', ()=> {
    beforeEach(() => {
      process.env.AWS_LAMBDA_FUNCTION_NAME = 'testFunction';
    });

    afterEach(()=> {
      delete process.env.AWS_LAMBDA_FUNCTION_NAME;
    });

    test('When called, it gets the Lambda function name from the environment variable', ()=> {
      const expectedName = process.env.AWS_LAMBDA_FUNCTION_NAME;

      const lambdaName = new EnvironmentVariablesService().getLambdaFunctionName();

      expect(lambdaName).toEqual(expectedName);
    });

    test('When called without the environment variable set, it returns an empty string', ()=> {
      delete process.env.AWS_LAMBDA_FUNCTION_NAME;

      const lambdaName = new EnvironmentVariablesService().getLambdaFunctionName();

      expect(lambdaName).toEqual('');
    });
  });
});