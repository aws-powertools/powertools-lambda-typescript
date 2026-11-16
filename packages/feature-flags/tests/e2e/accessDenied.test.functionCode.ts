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

type ErrorShape = {
  name?: unknown;
  message?: unknown;
  statusCode?: unknown;
  httpStatusCode?: unknown;
  cause?: ErrorShape;
};

// Copies the fields that identify an error and its causes, so the test file
// can both assert on them and record the raw shape returned by each path.
const describeError = (error: unknown, depth = 0): ErrorShape | undefined => {
  if (typeof error !== 'object' || error === null || depth > 3) {
    return undefined;
  }
  const { name, message, statusCode, $metadata, cause } = error as Record<
    string,
    unknown
  >;
  return {
    name,
    message,
    statusCode,
    httpStatusCode: ($metadata as Record<string, unknown> | undefined)
      ?.httpStatusCode,
    cause: describeError(cause, depth + 1),
  };
};

// Runs an evaluation and reports whether it threw or returned the fallback,
// instead of letting the error crash the function.
const captureOutcome = async (
  evaluation: () => Promise<unknown>
): Promise<Record<string, unknown>> => {
  try {
    return { outcome: 'returned', value: await evaluation() };
  } catch (error) {
    return { outcome: 'threw', error: describeError(error) };
  }
};

/**
 * The function role can start a configuration session but is denied
 * `appconfig:GetLatestConfiguration`. The handler returns the outcome of an
 * evaluation through each AppConfig Store as the invocation payload, so the
 * test file can assert on the error and record its raw shape.
 */
export const handler = async (): Promise<Record<string, unknown>> => {
  const [sdk, agent, variant] = await Promise.all([
    // Test 1 - evaluate a flag through the SDK store
    captureOutcome(() =>
      sdkFlags.evaluate({ name: 'checkout_v2', default: false })
    ),
    // Test 2 - evaluate a flag through the Agent store
    captureOutcome(() =>
      agentFlags.evaluate({ name: 'checkout_v2', default: false })
    ),
    // Test 3 - evaluate a flag through the Variant store
    captureOutcome(() =>
      variantFlags.evaluate({ name: 'ui_refresh', default: disabledVariant() })
    ),
  ]);

  return { sdk, agent, variant };
};
