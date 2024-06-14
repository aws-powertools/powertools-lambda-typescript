import { AppConfigProvider } from '@aws-lambda-powertools/parameters/appconfig';

const provider = new AppConfigProvider({
  environment: 'dev',
  application: 'my-app',
});

export const handler = async (
  _event: unknown,
  _context: unknown
): Promise<Record<string, unknown>> => {
  const config = await provider.get('my-config');

  return {
    value: config,
  };
};
