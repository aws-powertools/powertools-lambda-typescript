import { Tracer } from '@aws-lambda-powertools/tracer';

const tracer = new Tracer({ serviceName: 'serverlessAirline' });

export const handler = async (
  _event: unknown,
  _context: unknown
): Promise<unknown> => {
  try {
  } catch (err) {
    const rootTraceId = tracer.getRootXrayTraceId();

    // Example of returning an error response
    return {
      statusCode: 500,
      body: `Internal Error - Please contact support and quote the following id: ${rootTraceId}`,
      headers: { _X_AMZN_TRACE_ID: rootTraceId },
    };
  }
};
