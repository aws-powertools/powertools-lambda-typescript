import { AppConfigProvider } from '@aws-lambda-powertools/parameters/appconfig';
import { AppConfigDataClient } from '@aws-sdk/client-appconfigdata';

// construct your clients with any custom configuration
const appConfigClient = new AppConfigDataClient({ region: 'us-east-1' });
// pass the client to the provider
const configsProvider = new AppConfigProvider({
  awsSdkV3Client: appConfigClient,
  environment: 'prod',
  application: 'my-app',
});

export const handler = async (
  _event: unknown,
  _context: unknown
): Promise<void> => {
  const config = await configsProvider.get('my-config');
  console.log(config);
};
