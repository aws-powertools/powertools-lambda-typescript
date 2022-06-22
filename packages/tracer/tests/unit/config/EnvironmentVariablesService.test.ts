/**
 * Test EnvironmentVariablesService class
 *
 * @group unit/tracer/all
 */

import { EnvironmentVariablesService } from '../../../src/config';

describe('Class: EnvironmentVariablesService', () => {

  const ENVIRONMENT_VARIABLES = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ENVIRONMENT_VARIABLES };
  });

  afterAll(() => {
    process.env = ENVIRONMENT_VARIABLES;
  });

  describe('Method: get', () => {

    test('When the variable IS present, it returns the value of a runtime variable', () => {

      // Prepare
      process.env.CUSTOM_VARIABLE = 'my custom value';
      const service = new EnvironmentVariablesService();

      // Act
      const value = service.get('CUSTOM_VARIABLE');

      // Assess
      expect(value).toEqual('my custom value');

    });

    test('When the variable IS NOT present, it returns an empty string', () => {

      // Prepare
      delete process.env.CUSTOM_VARIABLE;
      const service = new EnvironmentVariablesService();

      // Act
      const value = service.get('CUSTOM_VARIABLE');

      // Assess
      expect(value).toEqual('');

    });

  });

  describe('Method: getTracingEnabled', () => {

    test('It returns the value of the environment variable POWERTOOLS_TRACE_ENABLED', () => {

      // Prepare
      process.env.POWERTOOLS_TRACE_ENABLED = 'false';
      const service = new EnvironmentVariablesService();

      // Act
      const value = service.getTracingEnabled();

      // Assess
      expect(value).toEqual('false');
    });

  });

  describe('Method: getTracingCaptureResponse', () => {

    test('It returns the value of the environment variable POWERTOOLS_TRACER_CAPTURE_RESPONSE', () => {

      // Prepare
      process.env.POWERTOOLS_TRACER_CAPTURE_RESPONSE = 'false';
      const service = new EnvironmentVariablesService();

      // Act
      const value = service.getTracingCaptureResponse();

      // Assess
      expect(value).toEqual('false');
    });

  });

  describe('Method: getTracingCaptureError', () => {

    test('It returns the value of the environment variable POWERTOOLS_TRACER_CAPTURE_ERROR', () => {

      // Prepare
      process.env.POWERTOOLS_TRACER_CAPTURE_ERROR = 'false';
      const service = new EnvironmentVariablesService();

      // Act
      const value = service.getTracingCaptureError();

      // Assess
      expect(value).toEqual('false');
    });

  });

  describe('Method: getCaptureHTTPsRequests', () => {

    test('It returns the value of the environment variable POWERTOOLS_TRACER_CAPTURE_HTTPS_REQUESTS', () => {

      // Prepare
      process.env.POWERTOOLS_TRACER_CAPTURE_HTTPS_REQUESTS = 'false';
      const service = new EnvironmentVariablesService();

      // Act
      const value = service.getCaptureHTTPsRequests();

      // Assess
      expect(value).toEqual('false');
    });

  });

  describe('Method: getServiceName', () => {

    test('It returns the value of the environment variable POWERTOOLS_SERVICE_NAME', () => {

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

    test('It returns the value of the environment variable _X_AMZN_TRACE_ID', () => {

      // Prepare
      process.env._X_AMZN_TRACE_ID = 'abcd123456789';
      const service = new EnvironmentVariablesService();

      // Act
      const value = service.getXrayTraceId();

      // Assess
      expect(value).toEqual('abcd123456789');
    });

  });

  describe('Method: getSamLocal', () => {

    test('It returns the value of the environment variable AWS_SAM_LOCAL', () => {

      // Prepare
      process.env.AWS_SAM_LOCAL = 'true';
      const service = new EnvironmentVariablesService();

      // Act
      const value = service.getSamLocal();

      // Assess
      expect(value).toEqual('true');
    });

  });

  describe('Method: getAwsExecutionEnv', () => {

    test('It returns the value of the environment variable AWS_EXECUTION_ENV', () => {

      // Prepare
      process.env.AWS_EXECUTION_ENV = 'nodejs16.x';
      const service = new EnvironmentVariablesService();

      // Act
      const value = service.getAwsExecutionEnv();

      // Assess
      expect(value).toEqual('nodejs16.x');
    });

  });

});