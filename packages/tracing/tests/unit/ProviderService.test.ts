/**
 * Test ProviderService class
 *
 * @group unit/tracer/all
 */

import { ProviderService } from '../../src/provider';
import { captureAWS, captureAWSClient, captureAWSv3Client, captureAsyncFunc, captureHTTPsGlobal, captureFunc, getNamespace, getSegment, setContextMissingStrategy, setDaemonAddress, setLogger, setSegment, Subsegment } from 'aws-xray-sdk-core';
import http from 'http';
import https from 'https';

jest.mock('aws-xray-sdk-core', () => ({
  captureAWS: jest.fn(),
  captureAWSClient: jest.fn(),
  captureAWSv3Client: jest.fn(),
  captureAsyncFunc: jest.fn(),
  captureHTTPsGlobal: jest.fn(),
  captureFunc: jest.fn(),
  getNamespace: jest.fn(),
  getSegment: jest.fn(),
  setContextMissingStrategy: jest.fn(),
  setDaemonAddress: jest.fn(),
  setLogger: jest.fn(),
  setSegment: jest.fn()
}));

describe('Class: ProviderService', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Method: captureAWS', () => {

    test('when called, it forwards the correct parameter, and call the correct function', () => {
    
      // Prepare
      const provider: ProviderService = new ProviderService();
    
      // Act
      provider.captureAWS({});
    
      // Assess
      expect(captureAWS).toHaveBeenCalledTimes(1);
      expect(captureAWS).toHaveBeenCalledWith({});
    
    });
    
  });

  describe('Method: captureAWSClient', () => {

    test('when called, it forwards the correct parameter, and call the correct function', () => {
    
      // Prepare
      const provider: ProviderService = new ProviderService();
    
      // Act
      provider.captureAWSClient({});
    
      // Assess
      expect(captureAWSClient).toHaveBeenCalledTimes(1);
      expect(captureAWSClient).toHaveBeenCalledWith({});
    
    });
    
  });

  describe('Method: captureAWSv3Client', () => {

    test('when called, it forwards the correct parameter, and call the correct function', () => {
    
      // Prepare
      const provider: ProviderService = new ProviderService();
    
      // Act
      provider.captureAWSv3Client({});
    
      // Assess
      expect(captureAWSv3Client).toHaveBeenCalledTimes(1);
      expect(captureAWSv3Client).toHaveBeenCalledWith({});
    
    });
    
  });

  describe('Method: captureAsyncFunc', () => {

    test('when called, it forwards the correct parameter, and call the correct function', () => {
    
      // Prepare
      const provider: ProviderService = new ProviderService();
    
      // Act
      provider.captureAsyncFunc('my-func', () => true);
    
      // Assess
      expect(captureAsyncFunc).toHaveBeenCalledTimes(1);
      expect(captureAsyncFunc).toHaveBeenCalledWith('my-func', expect.anything());
    
    });
    
  });

  describe('Method: captureHTTPsGlobal', () => {

    test('when called, it forwards the correct parameter and calls the correct function, twice', () => {
    
      // Prepare
      const provider: ProviderService = new ProviderService();
    
      // Act
      provider.captureHTTPsGlobal();
    
      // Assess
      expect(captureHTTPsGlobal).toHaveBeenCalledTimes(2);
      expect(captureHTTPsGlobal).toHaveBeenNthCalledWith(1, http);
      expect(captureHTTPsGlobal).toHaveBeenNthCalledWith(2, https);
    
    });
    
  });

  describe('Method: captureFunc', () => {

    test('when called, it forwards the correct parameter, and call the correct function', () => {
    
      // Prepare
      const provider: ProviderService = new ProviderService();
    
      // Act
      provider.captureFunc('my-func', () => true);
    
      // Assess
      expect(captureFunc).toHaveBeenCalledTimes(1);
      expect(captureFunc).toHaveBeenCalledWith('my-func', expect.anything());
    
    });
    
  });

  describe('Method: captureFunc', () => {

    test('when called, it forwards the correct parameter, and call the correct function', () => {
    
      // Prepare
      const provider: ProviderService = new ProviderService();
    
      // Act
      provider.captureFunc('my-func', () => true);
    
      // Assess
      expect(captureFunc).toHaveBeenCalledTimes(1);
      expect(captureFunc).toHaveBeenCalledWith('my-func', expect.anything());
    
    });
    
  });

  describe('Method: getNamespace', () => {

    test('when called, it forwards the correct parameter, and call the correct function', () => {
    
      // Prepare
      const provider: ProviderService = new ProviderService();
    
      // Act
      provider.getNamespace();
    
      // Assess
      expect(getNamespace).toHaveBeenCalledTimes(1);
      expect(getNamespace).toHaveBeenCalledWith();
    
    });
    
  });

  describe('Method: getSegment', () => {

    test('when called, it forwards the correct parameter, and call the correct function', () => {
    
      // Prepare
      const provider: ProviderService = new ProviderService();
    
      // Act
      provider.getSegment();
    
      // Assess
      expect(getSegment).toHaveBeenCalledTimes(1);
      expect(getSegment).toHaveBeenCalledWith();
    
    });
    
  });

  describe('Method: setContextMissingStrategy', () => {

    test('when called, it forwards the correct parameter, and call the correct function', () => {
    
      // Prepare
      const provider: ProviderService = new ProviderService();
    
      // Act
      provider.setContextMissingStrategy('LOG_ERROR');
    
      // Assess
      expect(setContextMissingStrategy).toHaveBeenCalledTimes(1);
      expect(setContextMissingStrategy).toHaveBeenCalledWith('LOG_ERROR');
    
    });
    
  });

  describe('Method: setDaemonAddress', () => {

    test('when called, it forwards the correct parameter, and call the correct function', () => {
    
      // Prepare
      const provider: ProviderService = new ProviderService();
    
      // Act
      provider.setDaemonAddress('http://localhost:8000');
    
      // Assess
      expect(setDaemonAddress).toHaveBeenCalledTimes(1);
      expect(setDaemonAddress).toHaveBeenCalledWith('http://localhost:8000');
    
    });
    
  });

  describe('Method: setLogger', () => {

    test('when called, it forwards the correct parameter, and call the correct function', () => {
    
      // Prepare
      const provider: ProviderService = new ProviderService();
    
      // Act
      provider.setLogger({});
    
      // Assess
      expect(setLogger).toHaveBeenCalledTimes(1);
      expect(setLogger).toHaveBeenCalledWith({});
    
    });
    
  });

  describe('Method: setSegment', () => {

    test('when called, it forwards the correct parameter, and call the correct function', () => {
    
      // Prepare
      const provider: ProviderService = new ProviderService();
    
      // Act
      provider.setSegment({ name: '## foo-bar' } as unknown as Subsegment);
      
      // Assess
      expect(setSegment).toHaveBeenCalledTimes(1);
      expect(setSegment).toHaveBeenCalledWith({ name: '## foo-bar' });
    
    });
    
  });

});