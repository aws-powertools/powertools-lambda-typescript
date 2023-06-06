import { SSMProvider } from '@aws-lambda-powertools/parameters/ssm';
import { SSMClient } from '@aws-sdk/client-ssm';

// construct your clients with any custom configuration
const ssmClient = new SSMClient({ region: 'us-east-1' });
// pass the client to the provider
const parametersProvider = new SSMProvider({ awsSdkV3Client: ssmClient });

export const handler = async (): Promise<void> => {
  // Retrieve a single parameter
  const parameter = await parametersProvider.get('/my/parameter');
  console.log(parameter);
};
