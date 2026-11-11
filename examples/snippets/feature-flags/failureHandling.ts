import { FeatureFlags } from '@aws-lambda-powertools/feature-flags';
import { appConfigAgentStore } from '@aws-lambda-powertools/feature-flags/appconfig-agent';
import { FeatureFlagsError } from '@aws-lambda-powertools/feature-flags/errors';

const flags = new FeatureFlags({
  store: appConfigAgentStore({
    application: 'my-app',
    environment: 'prod',
    name: 'features',
  }),
});

export const handler = async () => {
  try {
    // Availability failures and missing flags return false without a catch.
    return await flags.evaluate({ name: 'checkout_v2', default: false });
  } catch (error) {
    if (error instanceof FeatureFlagsError) {
      // Report the category without logging values or the error cause.
      console.error({ category: error.name });
    }
    // Parameters errors and unexpected errors also propagate.
    throw error;
  }
};
