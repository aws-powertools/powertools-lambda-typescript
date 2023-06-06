import { S3 } from 'aws-sdk';
import { Tracer } from '@aws-lambda-powertools/tracer';

const tracer = new Tracer({ serviceName: 'serverlessAirline' });
tracer.captureAWSClient(new S3());
