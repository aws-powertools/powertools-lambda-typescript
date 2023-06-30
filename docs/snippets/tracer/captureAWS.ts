import { S3 } from 'aws-sdk';
import { Tracer } from '@aws-lambda-powertools/tracer';

const tracer = new Tracer({ serviceName: 'serverlessAirline' });
// Instrument the AWS SDK client
const client = tracer.captureAWSClient(new S3());

export default client;
