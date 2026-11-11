import { getConfig } from '@aws-lambda-powertools/parameters/appconfig-agent';

// Retrieve a feature flag with caller context for multi-variant evaluation
const flags = await getConfig('features', {
  application: 'my-app',
  environment: 'prod',
  transform: 'json',
  agentOptions: {
    flags: ['ui_refresh'],
    context: { tier: 'pro', opted_in: true, limit: 10 },
  },
});

export const handler = async (): Promise<void> => {
  console.log(flags);
};
