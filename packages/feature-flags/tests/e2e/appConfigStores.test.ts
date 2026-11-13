import { join } from 'node:path';
import { TestStack } from '@aws-lambda-powertools/testing-utils';
import { TestNodejsFunction } from '@aws-lambda-powertools/testing-utils/resources/lambda';
import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { fromUtf8, toUtf8 } from '@smithy/util-utf8';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  getAppConfigAgentLayer,
  TestFeatureFlagsAppConfig,
} from '../helpers/resources.js';
import { RESOURCE_NAME_PREFIX } from './constants.js';

/**
 * This test suite deploys a CDK stack with a Lambda function that has the AWS AppConfig Agent
 * Lambda extension layer attached, plus two AppConfig configuration profiles. The function
 * code evaluates flags through each AppConfig Store and returns the results as the
 * invocation payload.
 *
 * Once the stack is deployed, the Lambda function is invoked and the returned payload is
 * checked against the expected values for each test case. If any of the evaluations
 * unexpectedly throws, the invocation reports a `FunctionError` and the test suite fails.
 *
 * The configuration profiles created are:
 * - Free-form JSON containing a Flag Document, read by `appConfigStore` and `appConfigAgentStore`
 * - Feature flag with a basic flag and a multi-variant flag, read by `appConfigVariantStore`
 *
 * The tests are:
 *
 * Test 1
 * evaluate a flag through `appConfigStore` (should return the value of the matching rule)
 *
 * Test 2
 * evaluate a missing flag through `appConfigStore` (should return the fallback)
 *
 * Test 3
 * evaluate a flag through `appConfigAgentStore` (should return the value of the matching rule)
 *
 * Test 4
 * evaluate a missing flag through `appConfigAgentStore` (should return the fallback)
 *
 * Test 5
 * evaluate a multi-variant flag through `appConfigVariantStore` with a context matching the variant rule (should return that variant)
 *
 * Test 6
 * evaluate a multi-variant flag through `appConfigVariantStore` with a context matching no rule (should return the default variant)
 *
 * Test 7
 * evaluate a missing flag through `appConfigVariantStore` (should return the fallback)
 *
 * Test 8
 * evaluate several flags through `appConfigVariantStore` with `evaluateMany` (should return a variant or fallback per flag)
 *
 * Test 9
 * list the enabled flags through `appConfigVariantStore` with `getEnabledFeatures` (should return the enabled flag names)
 */
describe('Feature Flags E2E tests, AppConfig Stores', () => {
  const testStack = new TestStack({
    stackNameProps: {
      stackNamePrefix: RESOURCE_NAME_PREFIX,
      testName: 'AppConfigStores',
    },
  });

  // Location of the lambda function code
  const lambdaFunctionCodeFilePath = join(
    __dirname,
    'appConfigStores.test.functionCode.ts'
  );

  const flagDocument = {
    checkout_v2: {
      default: false,
      rules: {
        premium_customers: {
          when_match: true,
          conditions: [{ action: 'EQUALS', key: 'tier', value: 'premium' }],
        },
      },
    },
  };
  const featureFlagProfile = {
    version: '1',
    flags: {
      basic_flag: {
        name: 'basic_flag',
      },
      ui_refresh: {
        name: 'ui_refresh',
        attributes: {
          theme: {
            constraints: {
              type: 'string',
            },
          },
        },
      },
    },
    values: {
      basic_flag: {
        enabled: true,
      },
      ui_refresh: {
        _variants: [
          {
            name: 'premium',
            enabled: true,
            rule: '(eq $tier "premium")',
            attributeValues: {
              theme: 'dark',
            },
          },
          {
            name: 'standard',
            enabled: false,
            attributeValues: {
              theme: 'light',
            },
          },
        ],
      },
    },
  };

  let functionResult: Record<string, unknown>;

  beforeAll(async () => {
    // Prepare
    const testFunction = new TestNodejsFunction(
      testStack,
      {
        entry: lambdaFunctionCodeFilePath,
        layers: [getAppConfigAgentLayer(testStack)],
      },
      {
        nameSuffix: 'appConfigStores',
        outputFormat: 'ESM',
      }
    );

    const appConfigResource = new TestFeatureFlagsAppConfig(testStack, {
      flagDocument,
      featureFlagProfile,
    });
    // Grant read permissions to the function
    appConfigResource.grantReadData(testFunction);
    // Add environment variables containing the resource names to the function
    appConfigResource.addEnvVariablesToFunction(testFunction);

    // Deploy the stack
    await testStack.deploy();

    // Get the actual function names from the stack outputs
    const functionName =
      testStack.findAndGetStackOutputValue('appConfigStores');

    // and invoke the Lambda function
    const result = await new LambdaClient({}).send(
      new InvokeCommand({
        FunctionName: functionName,
        InvocationType: 'RequestResponse',
        Payload: fromUtf8(JSON.stringify({})),
      })
    );
    const payload = JSON.parse(toUtf8(result.Payload ?? new Uint8Array()));
    if (result.FunctionError) {
      throw new Error(
        `The Lambda function failed unexpectedly: ${JSON.stringify(payload)}`
      );
    }
    functionResult = payload;
  });

  describe('appConfigStore usage', () => {
    // Test 1 - evaluate a flag through the SDK store (should return the value of the matching rule)
    it('evaluates a flag from a freeform profile', () => {
      expect(functionResult.sdkEvaluate).toBe(true);
    });

    // Test 2 - evaluate a missing flag through the SDK store (should return the fallback)
    it('returns the fallback when the flag does not exist', () => {
      expect(functionResult.sdkMissing).toBe('fallback');
    });
  });

  describe('appConfigAgentStore usage', () => {
    // Test 3 - evaluate a flag through the Agent store (should return the value of the matching rule)
    it('evaluates a flag from a freeform profile', () => {
      expect(functionResult.agentEvaluate).toBe(true);
    });

    // Test 4 - evaluate a missing flag through the Agent store (should return the fallback)
    it('returns the fallback when the flag does not exist', () => {
      expect(functionResult.agentMissing).toBe('fallback');
    });
  });

  describe('appConfigVariantStore usage', () => {
    // Test 5 - evaluate a multi-variant flag with a context matching the variant rule
    it('returns the variant selected by the context', () => {
      expect(functionResult.variantPremium).toStrictEqual({
        enabled: true,
        variant: 'premium',
        attributes: { theme: 'dark' },
      });
    });

    // Test 6 - evaluate a multi-variant flag with a context matching no rule
    // AppConfig omits the attributes of a disabled variant from the response
    it('returns the default variant when the context matches no rule', () => {
      expect(functionResult.variantStandard).toStrictEqual({
        enabled: false,
        variant: 'standard',
        attributes: {},
      });
    });

    // Test 7 - evaluate a missing flag through the Variant store (should return the fallback)
    it('returns the fallback when the flag does not exist', () => {
      expect(functionResult.variantMissing).toStrictEqual({
        enabled: true,
        variant: 'fallback',
        attributes: {},
      });
    });

    // Test 8 - evaluate several flags through the Variant store with evaluateMany
    it('evaluates several flags with evaluateMany', () => {
      expect(functionResult.variantEvaluateMany).toStrictEqual({
        basic_flag: { enabled: true, variant: 'default', attributes: {} },
        ui_refresh: {
          enabled: true,
          variant: 'premium',
          attributes: { theme: 'dark' },
        },
        does_not_exist: { enabled: false, variant: 'default', attributes: {} },
      });
    });

    // Test 9 - list the enabled flags through the Variant store with getEnabledFeatures
    it('lists the enabled flags with getEnabledFeatures', () => {
      expect(
        [...(functionResult.variantEnabledFeatures as string[])].sort()
      ).toStrictEqual(['basic_flag', 'ui_refresh']);
    });

    it('records the AppConfig Agent version', async ({ annotate }) => {
      expect(functionResult.agentVersion).toEqual(expect.any(String));
      await annotate(
        `AppConfig Agent version: ${JSON.stringify(functionResult.agentVersion)}`
      );
    });
  });

  afterAll(async () => {
    if (!process.env.DISABLE_TEARDOWN) {
      await testStack.destroy();
    }
  });
});
