const populateEnvironmentVariables = (): void => {

  // Reserved variables
  process.env._X_AMZN_TRACE_ID = 'abcdef123456abcdef123456abcdef123456';
  process.env.AWS_LAMBDA_FUNCTION_NAME = 'my-lambda-function';
  process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE = '128';
  process.env.AWS_REGION = 'eu-central-1';

  // Powertools variables
  process.env.LOG_LEVEL = 'DEBUG';
  process.env.POWERTOOLS_SERVICE_NAME = 'hello-world';

};

export {
  populateEnvironmentVariables
};