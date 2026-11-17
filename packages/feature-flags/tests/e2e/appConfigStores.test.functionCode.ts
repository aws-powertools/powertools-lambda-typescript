import { appConfigStore } from '../../src/appconfig/index.js';
import {
  appConfigAgentStore,
  appConfigVariantStore,
  disabledVariant,
} from '../../src/appconfig-agent/index.js';
import { FeatureFlags } from '../../src/index.js';

const application = process.env.APPLICATION_NAME ?? 'my-app';
const environment = process.env.ENVIRONMENT_NAME ?? 'my-env';
const freeformName = process.env.FREEFORM_NAME ?? 'freeform';
const featureFlagName = process.env.FEATURE_FLAG_NAME ?? 'feature-flag';

const premiumContext = { tier: 'premium' };
const standardContext = { tier: 'standard' };

// The first request for each configuration makes the agent call AppConfig on
// the spot, so we allow more than the default timeout to absorb cold starts.
const agentTimeout = 5000;

const sdkFlags = new FeatureFlags({
  store: appConfigStore({
    application,
    environment,
    name: freeformName,
  }),
});

const agentFlags = new FeatureFlags({
  store: appConfigAgentStore({
    application,
    environment,
    name: freeformName,
    timeout: agentTimeout,
  }),
});

const variantFlags = new FeatureFlags({
  store: appConfigVariantStore({
    application,
    environment,
    name: featureFlagName,
    timeout: agentTimeout,
  }),
});

// Reads the version reported by the agent's health check, so the test file
// can record which extension version the assertions ran against.
const getAgentVersion = async (): Promise<string> => {
  const response = await fetch('http://localhost:2772/ping');
  return response.text();
};

/**
 * The handler returns the results of each evaluation as the invocation
 * payload, so the test file can assert on them directly. If any of the calls
 * unexpectedly throws, the function crashes and the invocation reports a
 * `FunctionError`, failing the test suite loudly.
 */
export const handler = async (): Promise<Record<string, unknown>> => {
  const [
    sdkEvaluate,
    sdkMissing,
    agentEvaluate,
    agentMissing,
    variantPremium,
    variantStandard,
    variantMissing,
    variantEvaluateMany,
    variantEnabledFeatures,
    agentVersion,
  ] = await Promise.all([
    // Test 1 - evaluate a flag through the SDK store (should match the rule)
    sdkFlags.evaluate({
      name: 'checkout_v2',
      context: premiumContext,
      default: false,
    }),
    // Test 2 - evaluate a missing flag through the SDK store (should return the fallback)
    sdkFlags.evaluate({ name: 'does_not_exist', default: 'fallback' }),
    // Test 3 - evaluate a flag through the Agent store (should match the rule)
    agentFlags.evaluate({
      name: 'checkout_v2',
      context: premiumContext,
      default: false,
    }),
    // Test 4 - evaluate a missing flag through the Agent store (should return the fallback)
    agentFlags.evaluate({ name: 'does_not_exist', default: 'fallback' }),
    // Test 5 - evaluate a multi-variant flag with a context that matches the variant rule
    variantFlags.evaluate({
      name: 'ui_refresh',
      context: premiumContext,
      default: disabledVariant(),
    }),
    // Test 6 - evaluate a multi-variant flag with a context that falls through to the default variant
    variantFlags.evaluate({
      name: 'ui_refresh',
      context: standardContext,
      default: disabledVariant(),
    }),
    // Test 7 - evaluate a missing flag through the Variant store (should return the fallback)
    variantFlags.evaluate({
      name: 'does_not_exist',
      default: { enabled: true, variant: 'fallback', attributes: {} },
    }),
    // Test 8 - evaluate several flags at once through the Variant store
    variantFlags.evaluateMany({
      flags: {
        basic_flag: disabledVariant(),
        ui_refresh: disabledVariant(),
        does_not_exist: disabledVariant(),
      },
      context: premiumContext,
    }),
    // Test 9 - list the enabled flags through the Variant store
    variantFlags.getEnabledFeatures({ context: premiumContext }),
    getAgentVersion(),
  ]);

  return {
    sdkEvaluate,
    sdkMissing,
    agentEvaluate,
    agentMissing,
    variantPremium,
    variantStandard,
    variantMissing,
    variantEvaluateMany,
    variantEnabledFeatures,
    agentVersion,
  };
};
