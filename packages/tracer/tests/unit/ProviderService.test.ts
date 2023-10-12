/**
 * Test ProviderService class
 *
 * @group unit/tracer/providerservice
 */
import { ProviderService } from '../../src/provider/ProviderService.js';
import {
  captureAsyncFunc,
  captureAWS,
  captureAWSClient,
  captureAWSv3Client,
  captureFunc,
  captureHTTPsGlobal,
  getNamespace,
  getSegment,
  Segment,
  setContextMissingStrategy,
  setDaemonAddress,
  setLogger,
  setSegment,
  Subsegment,
} from 'aws-xray-sdk-core';
import http from 'node:http';
import https from 'node:https';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { addUserAgentMiddleware } from '@aws-lambda-powertools/commons';

jest.mock('aws-xray-sdk-core', () => ({
  ...jest.requireActual('aws-xray-sdk-core'),
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
  setSegment: jest.fn(),
}));

jest.mock('@aws-lambda-powertools/commons', () => ({
  ...jest.requireActual('@aws-lambda-powertools/commons'),
  addUserAgentMiddleware: jest.fn(),
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

    test('when called, it adds the correct user agent middleware', () => {
      // Prepare
      const provider: ProviderService = new ProviderService();

      // Act
      const dynamoDBClient = new DynamoDBClient({});
      provider.captureAWSv3Client(dynamoDBClient);

      // Assess
      expect(addUserAgentMiddleware).toHaveBeenNthCalledWith(
        1,
        dynamoDBClient,
        'tracer'
      );
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
      expect(captureAsyncFunc).toHaveBeenCalledWith(
        'my-func',
        expect.anything()
      );
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

  describe('Method: putAnnotation', () => {
    test('when called and there is no segment, it logs a warning and does not throw', () => {
      // Prepare
      const provider: ProviderService = new ProviderService();
      const logSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Act
      provider.putAnnotation('foo', 'bar');

      // Assess
      expect(logSpy).toHaveBeenCalledTimes(1);
      expect(logSpy).toHaveBeenCalledWith(
        'No active segment or subsegment found, skipping annotation'
      );
    });

    test('when called and the current segment is not a subsegment, it logs a warning and does not annotate the segment', () => {
      // Prepare
      const provider: ProviderService = new ProviderService();
      const facade = new Segment('facade');
      const logWarningSpy = jest.spyOn(console, 'warn').mockImplementation();
      jest
        .spyOn(provider, 'getSegment')
        .mockImplementation(() => new Segment('facade'));
      const addAnnotationSpy = jest.spyOn(facade, 'addAnnotation');

      // Act
      provider.putAnnotation('foo', 'bar');

      // Assess
      expect(logWarningSpy).toHaveBeenCalledTimes(1);
      expect(logWarningSpy).toHaveBeenCalledWith(
        'You cannot annotate the main segment in a Lambda execution environment'
      );
      expect(addAnnotationSpy).toHaveBeenCalledTimes(0);
    });

    test('when called and the current segment is a subsegment, it annotates it', () => {
      // Prepare
      const provider: ProviderService = new ProviderService();
      const segment = new Subsegment('## dummySegment');
      jest.spyOn(provider, 'getSegment').mockImplementation(() => segment);
      const segmentSpy = jest.spyOn(segment, 'addAnnotation');

      // Act
      provider.putAnnotation('foo', 'bar');

      // Assess
      expect(segmentSpy).toHaveBeenCalledTimes(1);
      expect(segmentSpy).toHaveBeenCalledWith('foo', 'bar');
    });
  });

  describe('Method: putMetadata', () => {
    test('when called and there is no segment, it logs a warning and does not throw', () => {
      // Prepare
      const provider: ProviderService = new ProviderService();
      const logWarningSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Act
      provider.putMetadata('foo', 'bar');

      // Assess
      expect(logWarningSpy).toHaveBeenCalledTimes(1);
      expect(logWarningSpy).toHaveBeenCalledWith(
        'No active segment or subsegment found, skipping metadata addition'
      );
    });

    test('when called and the current segment is not a subsegment, it logs a warning and does not annotate the segment', () => {
      // Prepare
      const provider: ProviderService = new ProviderService();
      const facade = new Segment('facade');
      const logSpy = jest.spyOn(console, 'warn').mockImplementation();
      jest
        .spyOn(provider, 'getSegment')
        .mockImplementation(() => new Segment('facade'));
      const facadeSpy = jest.spyOn(facade, 'addMetadata');

      // Act
      provider.putMetadata('foo', 'bar');

      // Assess
      expect(logSpy).toHaveBeenCalledTimes(1);
      expect(logSpy).toHaveBeenCalledWith(
        'You cannot add metadata to the main segment in a Lambda execution environment'
      );
      expect(facadeSpy).toHaveBeenCalledTimes(0);
    });

    test('when called and the current segment is a subsegment, it adds the metadata', () => {
      // Prepare
      const provider: ProviderService = new ProviderService();
      const segment = new Subsegment('## dummySegment');
      jest.spyOn(provider, 'getSegment').mockImplementation(() => segment);
      const segmentSpy = jest.spyOn(segment, 'addMetadata');

      // Act
      provider.putMetadata('foo', 'bar', 'baz');

      // Assess
      expect(segmentSpy).toHaveBeenCalledTimes(1);
      expect(segmentSpy).toHaveBeenCalledWith('foo', 'bar', 'baz');
    });
  });
});
