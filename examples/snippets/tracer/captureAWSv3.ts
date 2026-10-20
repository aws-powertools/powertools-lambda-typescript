import { Tracer } from '@aws-lambda-powertools/tracer';
import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';

const tracer = new Tracer({ serviceName: 'serverlessAirline' });
// Instrument the AWS SDK client
const client = tracer.captureAWSv3Client(new SecretsManagerClient({}));

export default client;
