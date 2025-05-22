import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { EnvironmentVariablesService } from '../../src/index.js';

describe('Class: EnvironmentVariablesService', () => {
  const ENVIRONMENT_VARIABLES = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ENVIRONMENT_VARIABLES };
  });

  afterAll(() => {
    process.env = ENVIRONMENT_VARIABLES;
  });

  describe('Method: get', () => {
    it('returns the value of a runtime variable', () => {
      // Prepare
      process.env.CUSTOM_VARIABLE = 'my custom value';
      const service = new EnvironmentVariablesService();

      // Act
      const value = service.get('CUSTOM_VARIABLE');

      // Assess
      expect(value).toEqual('my custom value');
    });

    it('returns an empty string when the env variable is not present', () => {
      // Prepare
      process.env.CUSTOM_VARIABLE = undefined;
      const service = new EnvironmentVariablesService();

      // Act
      const value = service.get('CUSTOM_VARIABLE');

      // Assess
      expect(value).toEqual('');
    });
  });

  describe('Method: getServiceName', () => {
    it('returns the value of the environment variable POWERTOOLS_SERVICE_NAME', () => {
      // Prepare
      process.env.POWERTOOLS_SERVICE_NAME = 'shopping-cart-api';
      const service = new EnvironmentVariablesService();

      // Act
      const value = service.getServiceName();

      // Assess
      expect(value).toEqual('shopping-cart-api');
    });
  });

  describe('Method: getXrayTraceId', () => {
    it('returns the value of the environment variable _X_AMZN_TRACE_ID', () => {
      // Prepare
      process.env._X_AMZN_TRACE_ID = 'abcd123456789';
      const service = new EnvironmentVariablesService();

      // Act
      const value = service.getXrayTraceId();

      // Assess
      expect(value).toEqual('abcd123456789');
    });
  });

  describe('Method: getXrayTraceSampled', () => {
    it('returns true if the Sampled flag is set in the _X_AMZN_TRACE_ID environment variable', () => {
      // Prepare
      process.env._X_AMZN_TRACE_ID =
        'Root=1-5759e988-bd862e3fe1be46a994272793;Parent=557abcec3ee5a047;Sampled=1';
      const service = new EnvironmentVariablesService();

      // Act
      const value = service.getXrayTraceSampled();

      // Assess
      expect(value).toEqual(true);
    });
  });

  describe('Method: isValueTrue', () => {
    const valuesToTest: Array<Array<string | boolean>> = [
      ['1', true],
      ['y', true],
      ['yes', true],
      ['t', true],
      ['TRUE', true],
      ['on', true],
      ['', false],
      ['false', false],
      ['fasle', false],
      ['somethingsilly', false],
      ['0', false],
    ];

    it.each(valuesToTest)(
      'takes string "%s" and returns %s',
      (input, output) => {
        // Prepare
        const service = new EnvironmentVariablesService();
        // Act
        const value = service.isValueTrue(input as string);
        // Assess
        expect(value).toBe(output);
      }
    );
  });

  describe('Method: isValueFalse', () => {
    const valuesToTest: Array<Array<string | boolean>> = [
      ['0', true],
      ['n', true],
      ['no', true],
      ['f', true],
      ['FALSE', true],
      ['off', true],
      ['1', false],
      ['y', false],
      ['yes', false],
      ['t', false],
      ['TRUE', false],
      ['on', false],
      ['', false],
      ['somethingsilly', false],
    ];

    it.each(valuesToTest)(
      'takes string "%s" and returns %s',
      (input, output) => {
        // Prepare
        const service = new EnvironmentVariablesService();
        // Act
        const value = service.isValueFalse(input as string);
        // Assess
        expect(value).toBe(output);
      }
    );
  });

  describe('Method: isDevMode', () => {
    it('returns true if the environment variable POWERTOOLS_DEV is "true"', () => {
      // Prepare
      process.env.POWERTOOLS_DEV = 'true';
      const service = new EnvironmentVariablesService();

      // Act
      const value = service.isDevMode();

      // Assess
      expect(value).toEqual(true);
    });

    it('returns false if the environment variable POWERTOOLS_DEV is "false"', () => {
      // Prepare
      process.env.POWERTOOLS_DEV = 'false';
      const service = new EnvironmentVariablesService();

      // Act
      const value = service.isDevMode();

      // Assess
      expect(value).toEqual(false);
    });

    it('returns false if the environment variable POWERTOOLS_DEV is NOT set', () => {
      // Prepare
      process.env.POWERTOOLS_DEV = 'somethingsilly';
      const service = new EnvironmentVariablesService();

      // Act
      const value = service.isDevMode();

      // Assess
      expect(value).toEqual(false);
    });

    it('returns false if the environment variable POWERTOOLS_DEV is "somethingsilly"', () => {
      // Prepare
      process.env.POWERTOOLS_DEV = 'somethingsilly';
      const service = new EnvironmentVariablesService();

      // Act
      const value = service.isDevMode();

      // Assess
      expect(value).toEqual(false);
    });
  });
});
