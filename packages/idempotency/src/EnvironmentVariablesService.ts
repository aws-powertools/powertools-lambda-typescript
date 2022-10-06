class EnvironmentVariablesService {
  private lambdaFunctionNameVariable = 'AWS_LAMBDA_FUNCTION_NAME';

  public get(name: string): string {
    return process.env[name]?.trim() || '';
  }

  public getLambdaFunctionName(): string{
    return this.get(this.lambdaFunctionNameVariable);
  } 
}

export {
  EnvironmentVariablesService
};