import { getConfig } from '@aws-lambda-powertools/parameters/appconfig-agent';

const config = await getConfig('my-configuration', {
  application: 'my-app',
  environment: 'my-env',
  transform: 'json',
});

export const handler = async (
  _event: unknown,
  _context: unknown
): Promise<unknown> => {
  return config;
};
