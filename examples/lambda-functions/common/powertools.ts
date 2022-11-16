import { Logger, injectLambdaContext } from '@aws-lambda-powertools/logger';
import { Metrics, logMetrics } from '@aws-lambda-powertools/metrics';
import { Tracer, captureLambdaHandler } from '@aws-lambda-powertools/tracer';
import { LambdaInterface } from '@aws-lambda-powertools/commons';

const awsLambdaPowertoolsVersion = '1.4.1';

const defaultValues = {
  region: process.env.AWS_REGION || 'N/A',
  executionEnv: process.env.AWS_EXECUTION_ENV || 'N/A'
};

const logger = new Logger({
  persistentLogAttributes: {
    ...defaultValues,
    logger: {
      name: '@aws-lambda-powertools/logger',
      version: awsLambdaPowertoolsVersion,
    }
  },
});

const metrics = new Metrics({
  defaultDimensions: defaultValues
});

const tracer = new Tracer();

export {
  logger,
  metrics,
  tracer,
  injectLambdaContext,
  logMetrics,
  captureLambdaHandler,
  LambdaInterface
};