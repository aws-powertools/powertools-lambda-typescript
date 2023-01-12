import { S3Client } from '@aws-sdk/client-s3';
import { Tracer } from '@aws-lambda-powertools/tracer';

const tracer = new Tracer({ serviceName: 'serverlessAirline' });
const client = tracer.captureAWSv3Client(new S3Client({}));