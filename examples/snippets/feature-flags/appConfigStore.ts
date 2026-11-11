import { FeatureFlags } from '@aws-lambda-powertools/feature-flags';
import { appConfigStore } from '@aws-lambda-powertools/feature-flags/appconfig';

// Install Parameters and the AppConfigData SDK client for this sub-path.
const store = appConfigStore({
  application: 'my-app',
  environment: 'prod',
  name: 'features',
  maxAge: 30,
});
const flags = new FeatureFlags({ store });
const checkoutV2 = await flags.evaluate({
  name: 'checkout_v2',
  context: { tier: 'premium' },
  default: false,
});
console.log(checkoutV2);
