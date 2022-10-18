const populateEnvironmentVariables = (): void => {
  process.env.AWS_LAMBDA_FUNCTION_NAME = 'hello-world';
  
};

const deleteEnvironmentVariables = (): void => {
  delete process.env.AWS_LAMBDA_FUNCTION_NAME;
}
  
export {
  deleteEnvironmentVariables,
  populateEnvironmentVariables,
};