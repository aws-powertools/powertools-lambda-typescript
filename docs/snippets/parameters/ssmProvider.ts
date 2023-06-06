import { SSMProvider } from '@aws-lambda-powertools/parameters/ssm';
import type { SSMClientConfig } from '@aws-sdk/client-ssm';

const clientConfig: SSMClientConfig = { region: 'us-east-1' };
const parametersProvider = new SSMProvider({ clientConfig });

export const handler = async (): Promise<void> => {
  // Retrieve a single parameter
  const parameter = await parametersProvider.get('/my/parameter');
  console.log(parameter);

  // Retrieve multiple parameters from a path prefix
  const parameters = await parametersProvider.getMultiple('/my/path/prefix');
  for (const [key, value] of Object.entries(parameters || {})) {
    console.log(`${key}: ${value}`);
  }
};
