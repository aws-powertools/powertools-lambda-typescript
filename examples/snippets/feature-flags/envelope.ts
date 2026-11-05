import { FeatureFlags } from '@aws-lambda-powertools/feature-flags';
import { appConfigAgentStore } from '@aws-lambda-powertools/feature-flags/appconfig-agent';

// Select { checkout_v2: { default: true } } from a profile shaped like:
// { settings: { flags: { checkout_v2: { default: true } } } }
const store = appConfigAgentStore({
  application: 'my-app',
  environment: 'prod',
  name: 'configuration',
  envelope: 'settings.flags',
});
const flags = new FeatureFlags({ store });
const checkoutV2 = await flags.evaluate({
  name: 'checkout_v2',
  default: false,
});
console.log(checkoutV2);
