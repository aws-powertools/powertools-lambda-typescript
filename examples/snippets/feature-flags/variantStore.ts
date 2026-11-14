import { FeatureFlags } from '@aws-lambda-powertools/feature-flags';
import {
  appConfigVariantStore,
  disabledVariant,
} from '@aws-lambda-powertools/feature-flags/appconfig-agent';

const flags = new FeatureFlags({
  store: appConfigVariantStore({
    application: 'my-app',
    environment: 'prod',
    name: 'features',
  }),
});

export const handler = async () => {
  const context = { email: 'jane@example.org', opted_in_to_beta: true };
  const ui = await flags.evaluate({
    name: 'ui_refresh',
    context,
    default: disabledVariant(),
  });
  const variants = await flags.evaluateMany({
    flags: { ui_refresh: disabledVariant(), checkout: disabledVariant() },
    context,
  });
  const enabledFeatures = await flags.getEnabledFeatures({ context });

  return {
    enabled: ui.enabled,
    attributes: ui.attributes,
    variants,
    enabledFeatures,
  };
};
