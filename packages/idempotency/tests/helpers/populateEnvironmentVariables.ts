const populateEnvironmentVariables = (): void => {
  process.env.AWS_LAMBDA_FUNCTION_NAME = 'hello-world';
  
};
  
export {
  populateEnvironmentVariables,
};