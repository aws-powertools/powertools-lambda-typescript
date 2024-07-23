import { Tracer } from '@aws-lambda-powertools/tracer';
import { S3 } from 'aws-sdk';

const tracer = new Tracer({ serviceName: 'serverlessAirline' });
// Instrument the AWS SDK client
const client = tracer.captureAWSClient(new S3());

export default client;
