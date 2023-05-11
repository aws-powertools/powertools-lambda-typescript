import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { Tracer } from '@aws-lambda-powertools/tracer';

const tracer = new Tracer({ serviceName: 'serverlessAirline' });
tracer.captureAWSv3Client(new SecretsManagerClient({}));
