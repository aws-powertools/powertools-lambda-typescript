import { S3 } from 'aws-sdk';
import { Tracer } from '@aws-lambda-powertools/tracer';

const tracer = new Tracer({ serviceName: 'serverlessAirline' });
const s3 = tracer.captureAWSClient(new S3());