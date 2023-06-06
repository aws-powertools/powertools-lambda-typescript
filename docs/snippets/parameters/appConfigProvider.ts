import { AppConfigProvider } from '@aws-lambda-powertools/parameters/appconfig';
import type { AppConfigDataClientConfig } from '@aws-sdk/client-appconfigdata';

const clientConfig: AppConfigDataClientConfig = { region: 'us-east-1' };
const configsProvider = new AppConfigProvider({
  application: 'my-app',
  environment: 'my-env',
  clientConfig,
});

export const handler = async (): Promise<void> => {
  // Retrieve a config
  const config = await configsProvider.get('my-config');
  console.log(config);
};
