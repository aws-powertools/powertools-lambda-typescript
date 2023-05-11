import { getAppConfig } from '@aws-lambda-powertools/parameters/appconfig';

export const handler = async (): Promise<void> => {
  // Retrieve a configuration, latest version
  const config = await getAppConfig('my-configuration', {
    environment: 'my-env',
    application: 'my-app',
  });
  console.log(config);
};
