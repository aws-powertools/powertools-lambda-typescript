import { FeatureFlags } from '@aws-lambda-powertools/feature-flags';
import { appConfigAgentStore } from '@aws-lambda-powertools/feature-flags/appconfig-agent';

// Install Parameters and JMESPath, and attach the AppConfig Agent Lambda extension.
const store = appConfigAgentStore({
  application: 'my-app',
  environment: 'prod',
  name: 'features',
  timeout: 1000,
});
const flags = new FeatureFlags({ store });
const checkoutV2 = await flags.evaluate({
  name: 'checkout_v2',
  context: { tier: 'premium' },
  default: false,
});
console.log(checkoutV2);
