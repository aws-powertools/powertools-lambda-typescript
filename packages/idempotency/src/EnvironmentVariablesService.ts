class EnvironmentVariablesService {
  private lambdaFunctionNameVariable = 'AWS_LAMBDA_FUNCTION_NAME';

  /**
   * retrieve the value of an environment variable
   * 
   * @param name the name of the environment variable
   * @returns the value of the environment variable
   */
  public get(name: string): string {
    return process.env[name]?.trim() || '';
  }
  /**
   * retrieve the name of the Lambda function 
   * 
   * @returns the Lambda function name
   */
  public getLambdaFunctionName(): string{
    return this.get(this.lambdaFunctionNameVariable);
  } 
}

export {
  EnvironmentVariablesService
};