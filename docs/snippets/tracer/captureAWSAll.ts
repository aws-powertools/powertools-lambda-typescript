import { Tracer } from '@aws-lambda-powertools/tracer';

const tracer = new Tracer({ serviceName: 'serverlessAirline' });
const AWS = tracer.captureAWS(require('aws-sdk'));