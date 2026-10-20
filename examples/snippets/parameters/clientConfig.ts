import { SSMProvider } from '@aws-lambda-powertools/parameters/ssm';
import type { SSMClientConfig } from '@aws-sdk/client-ssm';

const clientConfig: SSMClientConfig = { region: 'us-east-1' };
const parametersProvider = new SSMProvider({ clientConfig });

export const handler = async (): Promise<void> => {
  // Retrieve a single parameter
  const value = await parametersProvider.get('/my/parameter');
  console.log(value);
};
