// Reserved variables
process.env._X_AMZN_TRACE_ID =
  'Root=1-5759e988-bd862e3fe1be46a994272793;Parent=557abcec3ee5a047;Sampled=1';
process.env.AWS_LAMBDA_FUNCTION_NAME = 'my-lambda-function';
process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE = '128';
process.env.AWS_LAMBDA_FUNCTION_VERSION = '$LATEST';
if (
  process.env.AWS_REGION === undefined &&
  process.env.CDK_DEFAULT_REGION === undefined
) {
  process.env.AWS_REGION = 'eu-west-1';
}

// Powertools for AWS Lambda (TypeScript) variables
process.env.POWERTOOLS_LOG_LEVEL = 'DEBUG';
process.env.POWERTOOLS_SERVICE_NAME = 'hello-world';

jest.spyOn(console, 'error').mockImplementation();
jest.spyOn(console, 'warn').mockImplementation();
jest.spyOn(console, 'info').mockImplementation();
jest.spyOn(console, 'debug').mockImplementation();
jest.spyOn(console, 'log').mockImplementation();

jest.mock('node:console', () => ({
  ...jest.requireActual('node:console'),
  Console: jest.fn().mockImplementation(() => ({
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
}));

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      _X_AMZN_TRACE_ID: string | undefined;
      AWS_LAMBDA_FUNCTION_NAME: string | undefined;
      AWS_LAMBDA_FUNCTION_MEMORY_SIZE: string | undefined;
      AWS_LAMBDA_FUNCTION_VERSION: string | undefined;
      AWS_REGION: string | undefined;
      CDK_DEFAULT_REGION: string | undefined;
      POWERTOOLS_LOG_LEVEL: string | undefined;
      POWERTOOLS_SERVICE_NAME: string | undefined;
      POWERTOOLS_DEV: string | undefined;
      POWERTOOLS_LOGGER_LOG_EVENT: string | undefined;
    }
  }
}

export type {};
