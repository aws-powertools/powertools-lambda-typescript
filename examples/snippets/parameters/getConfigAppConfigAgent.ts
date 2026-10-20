import { getConfig } from '@aws-lambda-powertools/parameters/appconfig-agent';

// Retrieve a configuration from the AppConfig Agent Lambda extension
const config = await getConfig('my-configuration', {
  environment: 'my-env',
  application: 'my-app',
  transform: 'json',
});

export const handler = async (): Promise<void> => {
  console.log(config);
};
