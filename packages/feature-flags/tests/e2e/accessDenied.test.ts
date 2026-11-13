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
 * Lambda extension layer attached, plus two AppConfig configuration profiles. Unlike the
 * AppConfig Stores suite, the function role is granted `appconfig:StartConfigurationSession`
 * but not `appconfig:GetLatestConfiguration`, so every retrieval is denied by IAM.
 *
 * The function code evaluates a flag through each AppConfig Store, catches any error, and
 * returns the outcome as the invocation payload. Where the denial is identifiable the
 * tests assert that the Store throws instead of returning the fallback; where the Agent
 * makes it opaque the tests accept either outcome and record the raw shape as a test
 * annotation.
 *
 * The tests are:
 *
 * Test 1
 * evaluate a flag through `appConfigStore` (should throw the SDK access denial)
 *
 * Test 2
 * evaluate a flag through `appConfigAgentStore` (should throw or return the fallback, the shape is recorded)
 *
 * Test 3
 * evaluate a flag through `appConfigVariantStore` (should throw or return the fallback, the shape is recorded)
 */
describe('Feature Flags E2E tests, AppConfig access denied', () => {
  const testStack = new TestStack({
    stackNameProps: {
      stackNamePrefix: RESOURCE_NAME_PREFIX,
      testName: 'AccessDenied',
    },
  });

  // Location of the lambda function code
  const lambdaFunctionCodeFilePath = join(
    __dirname,
    'accessDenied.test.functionCode.ts'
  );

  const flagDocument = {
    checkout_v2: {
      default: true,
    },
  };
  const featureFlagProfile = {
    version: '1',
    flags: {
      ui_refresh: {
        name: 'ui_refresh',
      },
    },
    values: {
      ui_refresh: {
        enabled: true,
      },
    },
  };

  let functionResult: Record<string, Record<string, unknown>>;

  beforeAll(async () => {
    // Prepare
    const testFunction = new TestNodejsFunction(
      testStack,
      {
        entry: lambdaFunctionCodeFilePath,
        layers: [getAppConfigAgentLayer(testStack)],
      },
      {
        nameSuffix: 'accessDenied',
        outputFormat: 'ESM',
      }
    );

    const appConfigResource = new TestFeatureFlagsAppConfig(testStack, {
      flagDocument,
      featureFlagProfile,
    });
    // Grant only the permission to start a session, so retrieving the configuration is denied
    appConfigResource.grantStartConfigurationSessionOnly(testFunction);
    // Add environment variables containing the resource names to the function
    appConfigResource.addEnvVariablesToFunction(testFunction);

    // Deploy the stack
    await testStack.deploy();

    // Get the actual function names from the stack outputs
    const functionName = testStack.findAndGetStackOutputValue('accessDenied');

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
    // Test 1 - evaluate a flag through the SDK store (should throw the SDK access denial)
    it('throws when the function role cannot retrieve the configuration', async ({
      annotate,
    }) => {
      await annotate(`SDK store: ${JSON.stringify(functionResult.sdk)}`);
      expect(functionResult.sdk).toEqual({
        outcome: 'threw',
        error: expect.objectContaining({
          name: 'GetParameterError',
          cause: expect.objectContaining({ name: 'AccessDeniedException' }),
        }),
      });
    });
  });

  describe('appConfigAgentStore usage', () => {
    // Test 2 - evaluate a flag through the Agent store (should throw or return the fallback)
    it('throws or returns the fallback when the agent cannot retrieve the configuration', async ({
      annotate,
    }) => {
      await annotate(`Agent store: ${JSON.stringify(functionResult.agent)}`);
      expect(functionResult.agent).toEqual(
        functionResult.agent.outcome === 'threw'
          ? { outcome: 'threw', error: expect.any(Object) }
          : { outcome: 'returned', value: false }
      );
    });
  });

  describe('appConfigVariantStore usage', () => {
    // Test 3 - evaluate a flag through the Variant store (should throw or return the fallback)
    it('throws or returns the fallback when the agent cannot retrieve the configuration', async ({
      annotate,
    }) => {
      await annotate(
        `Variant store: ${JSON.stringify(functionResult.variant)}`
      );
      expect(functionResult.variant).toEqual(
        functionResult.variant.outcome === 'threw'
          ? { outcome: 'threw', error: expect.any(Object) }
          : {
              outcome: 'returned',
              value: { enabled: false, variant: 'default', attributes: {} },
            }
      );
    });
  });

  afterAll(async () => {
    if (!process.env.DISABLE_TEARDOWN) {
      await testStack.destroy();
    }
  });
});
