import { AppConfigProvider } from '@aws-lambda-powertools/parameters/appconfig';
import { AppConfigDataClient } from '@aws-sdk/client-appconfigdata';

// construct your clients with any custom configuration
const appConfigClient = new AppConfigDataClient({ region: 'us-east-1' });
// pass the client to the provider
const configsProvider = new AppConfigProvider({
  application: 'my-app',
  environment: 'my-env',
  awsSdkV3Client: appConfigClient,
});

export const handler = async (): Promise<void> => {
  const config = await configsProvider.get('my-config');
  console.log(config);
};
