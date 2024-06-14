import { Tracer } from '@aws-lambda-powertools/tracer';
import AWS from 'aws-sdk';

const tracer = new Tracer({ serviceName: 'serverlessAirline' });

// Instrument all AWS SDK clients created from this point onwards
tracer.captureAWS(AWS);

// Create a new client which will be automatically instrumented
const client = new AWS.SecretsManager();
export default client;
