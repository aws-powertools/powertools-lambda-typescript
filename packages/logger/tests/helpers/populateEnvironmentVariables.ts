// Reserved variables
process.env._X_AMZN_TRACE_ID =
  'Root=1-5759e988-bd862e3fe1be46a994272793;Parent=557abcec3ee5a047;Sampled=1';
process.env.AWS_LAMBDA_FUNCTION_NAME = 'my-lambda-function';
process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE = '128';
if (
  process.env.AWS_REGION === undefined &&
  process.env.CDK_DEFAULT_REGION === undefined
) {
  process.env.AWS_REGION = 'eu-west-1';
}

// Powertools for AWS Lambda (TypeScript) variables
process.env.POWERTOOLS_LOG_LEVEL = 'DEBUG';
process.env.POWERTOOLS_SERVICE_NAME = 'hello-world';
