import { Tracer } from '@aws-lambda-powertools/tracer';
import AWS from 'aws-sdk';

const tracer = new Tracer({ serviceName: 'serverlessAirline' });
tracer.captureAWS(AWS);
