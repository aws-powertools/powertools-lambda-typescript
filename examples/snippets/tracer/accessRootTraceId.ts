import { Logger } from '@aws-lambda-powertools/logger';
import { Tracer } from '@aws-lambda-powertools/tracer';

const tracer = new Tracer({ serviceName: 'serverlessAirline' });
const logger = new Logger({ serviceName: 'serverlessAirline' });

export const handler = async (): Promise<unknown> => {
  try {
    throw new Error('Something went wrong');
  } catch (error) {
    logger.error('An error occurred', { error });

    const rootTraceId = tracer.getRootXrayTraceId();

    // Example of returning an error response
    return {
      statusCode: 500,
      body: `Internal Error - Please contact support and quote the following id: ${rootTraceId}`,
      headers: { _X_AMZN_TRACE_ID: rootTraceId },
    };
  }
};
