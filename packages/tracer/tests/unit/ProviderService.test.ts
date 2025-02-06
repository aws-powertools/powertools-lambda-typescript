import { channel } from 'node:diagnostics_channel';
import http from 'node:http';
import https from 'node:https';
import { URL } from 'node:url';
import { addUserAgentMiddleware } from '@aws-lambda-powertools/commons';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import xraySDK from 'aws-xray-sdk-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProviderService } from '../../src/provider/ProviderService.js';
import type { HttpSubsegment } from '../../src/types/ProviderService.js';
import { mockFetch } from '../helpers/mockRequests.js';

const { Segment, Subsegment } = xraySDK;
const mocks = vi.hoisted(() => ({
  captureAWS: vi.fn(),
  captureAWSClient: vi.fn(),
  captureAWSv3Client: vi.fn(),
  captureAsyncFunc: vi.fn(),
  captureHTTPsGlobal: vi.fn(),
  captureFunc: vi.fn(),
  getNamespace: vi.fn(),
  getSegment: vi.fn(),
  setContextMissingStrategy: vi.fn(),
  setDaemonAddress: vi.fn(),
  setLogger: vi.fn(),
  setSegment: vi.fn(),
}));

vi.mock('aws-xray-sdk-core', async (importOriginal) => ({
  default: {
    ...(
      await importOriginal<{
        default: typeof import('aws-xray-sdk-core');
      }>()
    ).default,
    ...mocks,
  },
}));

vi.mock('@aws-lambda-powertools/commons', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@aws-lambda-powertools/commons')>()),
  addUserAgentMiddleware: vi.fn(),
}));

describe('Class: ProviderService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Method: captureAWS', () => {
    it('calls the correct underlying function with proper arguments', () => {
      // Prepare
      const provider: ProviderService = new ProviderService();

      // Act
      provider.captureAWS({});

      // Assess
      expect(mocks.captureAWS).toHaveBeenCalledTimes(1);
      expect(mocks.captureAWS).toHaveBeenCalledWith({});
    });
  });

  describe('Method: captureAWSClient', () => {
    it('calls the correct underlying function with proper arguments', () => {
      // Prepare
      const provider: ProviderService = new ProviderService();

      // Act
      provider.captureAWSClient({});

      // Assess
      expect(mocks.captureAWSClient).toHaveBeenCalledTimes(1);
      expect(mocks.captureAWSClient).toHaveBeenCalledWith({});
    });
  });

  describe('Method: captureAWSv3Client', () => {
    it('calls the correct underlying function with proper arguments', () => {
      // Prepare
      const provider: ProviderService = new ProviderService();

      // Act
      provider.captureAWSv3Client({});

      // Assess
      expect(mocks.captureAWSv3Client).toHaveBeenCalledTimes(1);
      expect(mocks.captureAWSv3Client).toHaveBeenCalledWith({});
    });

    it('adds the correct user agent middleware', () => {
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
    it('calls the correct underlying function function', () => {
      // Prepare
      const provider: ProviderService = new ProviderService();

      // Act
      provider.captureAsyncFunc('my-func', () => true);

      // Assess
      expect(mocks.captureAsyncFunc).toHaveBeenCalledTimes(1);
      expect(mocks.captureAsyncFunc).toHaveBeenCalledWith(
        'my-func',
        expect.anything()
      );
    });
  });

  describe('Method: captureHTTPsGlobal', () => {
    it('calls the correct underlying function with proper arguments', () => {
      // Prepare
      const provider: ProviderService = new ProviderService();

      // Act
      provider.captureHTTPsGlobal();

      // Assess
      expect(mocks.captureHTTPsGlobal).toHaveBeenCalledTimes(2);
      expect(mocks.captureHTTPsGlobal).toHaveBeenNthCalledWith(1, http);
      expect(mocks.captureHTTPsGlobal).toHaveBeenNthCalledWith(2, https);
    });
  });

  describe('Method: captureFunc', () => {
    it('calls the correct underlying function with proper arguments', () => {
      // Prepare
      const provider: ProviderService = new ProviderService();

      // Act
      provider.captureFunc('my-func', () => true);

      // Assess
      expect(mocks.captureFunc).toHaveBeenCalledTimes(1);
      expect(mocks.captureFunc).toHaveBeenCalledWith(
        'my-func',
        expect.anything()
      );
    });
  });

  describe('Method: getNamespace', () => {
    it('calls the correct sdk function', () => {
      // Prepare
      const provider: ProviderService = new ProviderService();

      // Act
      provider.getNamespace();

      // Assess
      expect(mocks.getNamespace).toHaveBeenCalledTimes(1);
      expect(mocks.getNamespace).toHaveBeenCalledWith();
    });
  });

  describe('Method: setContextMissingStrategy', () => {
    it('calls the correct sdk function', () => {
      // Prepare
      const provider: ProviderService = new ProviderService();

      // Act
      provider.setContextMissingStrategy('LOG_ERROR');

      // Assess
      expect(mocks.setContextMissingStrategy).toHaveBeenCalledTimes(1);
      expect(mocks.setContextMissingStrategy).toHaveBeenCalledWith('LOG_ERROR');
    });
  });

  describe('Method: setDaemonAddress', () => {
    it('calls the correct sdk function', () => {
      // Prepare
      const provider: ProviderService = new ProviderService();

      // Act
      provider.setDaemonAddress('http://localhost:8000');

      // Assess
      expect(mocks.setDaemonAddress).toHaveBeenCalledTimes(1);
      expect(mocks.setDaemonAddress).toHaveBeenCalledWith(
        'http://localhost:8000'
      );
    });
  });

  describe('Method: setLogger', () => {
    it('calls the correct sdk function', () => {
      // Prepare
      const provider: ProviderService = new ProviderService();

      // Act
      provider.setLogger({});

      // Assess
      expect(mocks.setLogger).toHaveBeenCalledTimes(1);
      expect(mocks.setLogger).toHaveBeenCalledWith({});
    });
  });

  describe('Method: setSegment', () => {
    it('calls the correct sdk function', () => {
      // Prepare
      const provider: ProviderService = new ProviderService();
      const subsegment = new Subsegment('## foo-bar');

      // Act
      provider.setSegment(subsegment);

      // Assess
      expect(mocks.setSegment).toHaveBeenCalledTimes(1);
      expect(mocks.setSegment).toHaveBeenCalledWith(subsegment);
    });
  });

  describe('Method: putAnnotation', () => {
    it('logs a warning and does not throw when there is no active segment', () => {
      // Prepare
      const provider: ProviderService = new ProviderService();
      const logSpy = vi.spyOn(console, 'warn');

      // Act
      provider.putAnnotation('foo', 'bar');

      // Assess
      expect(logSpy).toHaveBeenCalledTimes(1);
      expect(logSpy).toHaveBeenCalledWith(
        'No active segment or subsegment found, skipping annotation'
      );
    });

    it('logs a warning and does not annotate the segment when called on a segment', () => {
      // Prepare
      const provider: ProviderService = new ProviderService();
      const facade = new Segment('facade');
      const logWarningSpy = vi.spyOn(console, 'warn');
      vi.spyOn(provider, 'getSegment').mockImplementation(
        () => new Segment('facade')
      );
      const addAnnotationSpy = vi.spyOn(facade, 'addAnnotation');

      // Act
      provider.putAnnotation('foo', 'bar');

      // Assess
      expect(logWarningSpy).toHaveBeenCalledTimes(1);
      expect(logWarningSpy).toHaveBeenCalledWith(
        'You cannot annotate the main segment in a Lambda execution environment'
      );
      expect(addAnnotationSpy).toHaveBeenCalledTimes(0);
    });

    it('annotates the currently active segment', () => {
      // Prepare
      const provider: ProviderService = new ProviderService();
      const segment = new Subsegment('## dummySegment');
      vi.spyOn(provider, 'getSegment').mockImplementation(() => segment);
      const segmentSpy = vi.spyOn(segment, 'addAnnotation');

      // Act
      provider.putAnnotation('foo', 'bar');

      // Assess
      expect(segmentSpy).toHaveBeenCalledTimes(1);
      expect(segmentSpy).toHaveBeenCalledWith('foo', 'bar');
    });
  });

  describe('Method: putMetadata', () => {
    it('logs a warning and does not throw when called and there is no segment', () => {
      // Prepare
      const provider: ProviderService = new ProviderService();
      const logWarningSpy = vi.spyOn(console, 'warn');

      // Act
      provider.putMetadata('foo', 'bar');

      // Assess
      expect(logWarningSpy).toHaveBeenCalledTimes(1);
      expect(logWarningSpy).toHaveBeenCalledWith(
        'No active segment or subsegment found, skipping metadata addition'
      );
    });

    it('logs a warning and does not annotate the segment when called on a segment', () => {
      // Prepare
      const provider: ProviderService = new ProviderService();
      const facade = new Segment('facade');
      const logSpy = vi.spyOn(console, 'warn');
      vi.spyOn(provider, 'getSegment').mockImplementation(
        () => new Segment('facade')
      );
      const facadeSpy = vi.spyOn(facade, 'addMetadata');

      // Act
      provider.putMetadata('foo', 'bar');

      // Assess
      expect(logSpy).toHaveBeenCalledTimes(1);
      expect(logSpy).toHaveBeenCalledWith(
        'You cannot add metadata to the main segment in a Lambda execution environment'
      );
      expect(facadeSpy).toHaveBeenCalledTimes(0);
    });

    it('adds the metadata on the currently active subsegment', () => {
      // Prepare
      const provider: ProviderService = new ProviderService();
      const segment = new Subsegment('## dummySegment');
      vi.spyOn(provider, 'getSegment').mockImplementation(() => segment);
      const segmentSpy = vi.spyOn(segment, 'addMetadata');

      // Act
      provider.putMetadata('foo', 'bar', 'baz');

      // Assess
      expect(segmentSpy).toHaveBeenCalledTimes(1);
      expect(segmentSpy).toHaveBeenCalledWith('foo', 'bar', 'baz');
    });
  });

  describe('Method: instrumentFetch', () => {
    it('subscribes to the diagnostics channel', async () => {
      // Prepare
      const provider: ProviderService = new ProviderService();

      // Act
      provider.instrumentFetch();

      // Assess
      expect(channel('undici:request:create').hasSubscribers).toBe(true);
      expect(channel('undici:request:headers').hasSubscribers).toBe(true);
      expect(channel('undici:request:error').hasSubscribers).toBe(true);
    });

    it('traces a successful request', async () => {
      // Prepare
      const provider: ProviderService = new ProviderService();
      const segment = new Subsegment('## dummySegment');
      const subsegment = segment.addNewSubsegment('aws.amazon.com');
      vi.spyOn(segment, 'addNewSubsegment').mockImplementationOnce(
        () => subsegment
      );
      vi.spyOn(provider, 'getSegment')
        .mockImplementationOnce(() => segment)
        .mockImplementationOnce(() => subsegment)
        .mockImplementationOnce(() => subsegment);
      vi.spyOn(subsegment, 'close');
      vi.spyOn(provider, 'setSegment');

      // Act
      provider.instrumentFetch();
      const mockRequest = mockFetch({
        origin: 'https://aws.amazon.com',
        path: '/blogs',
        headers: {
          'content-length': '100',
        },
      });

      // Assess
      expect(segment.addNewSubsegment).toHaveBeenCalledTimes(1);
      expect(segment.addNewSubsegment).toHaveBeenCalledWith('aws.amazon.com');
      expect((subsegment as HttpSubsegment).http).toEqual({
        request: {
          url: 'https://aws.amazon.com/blogs',
          method: 'GET',
        },
        response: {
          status: 200,
          content_length: 100,
        },
      });
      expect(subsegment.close).toHaveBeenCalledTimes(1);
      expect(provider.setSegment).toHaveBeenLastCalledWith(segment);
      expect(mockRequest.addHeader).toHaveBeenLastCalledWith(
        'X-Amzn-Trace-Id',
        expect.stringMatching(
          /Root=1-abcdef12-3456abcdef123456abcdef12;Parent=\S{16};Sampled=1/
        )
      );
    });

    it('excludes the content_length header when invalid or not found', async () => {
      // Prepare
      const provider: ProviderService = new ProviderService();
      const segment = new Subsegment('## dummySegment');
      const subsegment = segment.addNewSubsegment('aws.amazon.com');
      vi.spyOn(segment, 'addNewSubsegment').mockImplementationOnce(
        () => subsegment
      );
      vi.spyOn(provider, 'getSegment')
        .mockImplementationOnce(() => segment)
        .mockImplementationOnce(() => subsegment)
        .mockImplementationOnce(() => subsegment);
      vi.spyOn(subsegment, 'close');
      vi.spyOn(provider, 'setSegment');

      // Act
      provider.instrumentFetch();
      mockFetch({
        origin: new URL('https://aws.amazon.com'),
        path: '/blogs',
        headers: {
          'content-type': 'application/json',
        },
      });

      // Assess
      expect((subsegment as HttpSubsegment).http).toEqual({
        request: {
          url: 'https://aws.amazon.com/blogs',
          method: 'GET',
        },
        response: {
          status: 200,
        },
      });
      expect(subsegment.close).toHaveBeenCalledTimes(1);
      expect(provider.setSegment).toHaveBeenLastCalledWith(segment);
    });

    it('adds a throttle flag to the segment when the status code is 429', async () => {
      // Prepare
      const provider: ProviderService = new ProviderService();
      const segment = new Subsegment('## dummySegment');
      const subsegment = segment.addNewSubsegment('aws.amazon.com');
      vi.spyOn(subsegment, 'addThrottleFlag');
      vi.spyOn(segment, 'addNewSubsegment').mockImplementationOnce(
        () => subsegment
      );
      vi.spyOn(provider, 'getSegment')
        .mockImplementationOnce(() => segment)
        .mockImplementationOnce(() => subsegment)
        .mockImplementationOnce(() => subsegment);
      vi.spyOn(subsegment, 'close');
      vi.spyOn(provider, 'setSegment');

      // Act
      provider.instrumentFetch();
      mockFetch({
        origin: 'https://aws.amazon.com/blogs',
        statusCode: 429,
      });

      // Assess
      expect((subsegment as HttpSubsegment).http).toEqual(
        expect.objectContaining({
          response: {
            status: 429,
          },
        })
      );
      expect(subsegment.addThrottleFlag).toHaveBeenCalledTimes(1);
      expect(subsegment.close).toHaveBeenCalledTimes(1);
      expect(provider.setSegment).toHaveBeenLastCalledWith(segment);
    });

    it('adds an error flag to the segment when the status code is 4xx', async () => {
      // Prepare
      const provider: ProviderService = new ProviderService();
      const segment = new Subsegment('## dummySegment');
      const subsegment = segment.addNewSubsegment('aws.amazon.com');
      vi.spyOn(subsegment, 'addErrorFlag');
      vi.spyOn(segment, 'addNewSubsegment').mockImplementationOnce(
        () => subsegment
      );
      vi.spyOn(provider, 'getSegment')
        .mockImplementationOnce(() => segment)
        .mockImplementationOnce(() => subsegment)
        .mockImplementationOnce(() => subsegment);
      vi.spyOn(subsegment, 'close');
      vi.spyOn(provider, 'setSegment');

      // Act
      provider.instrumentFetch();
      mockFetch({
        origin: 'https://aws.amazon.com/blogs',
        statusCode: 404,
      });

      // Assess
      expect((subsegment as HttpSubsegment).http).toEqual(
        expect.objectContaining({
          response: {
            status: 404,
          },
        })
      );
      expect(subsegment.addErrorFlag).toHaveBeenCalledTimes(1);
      expect(subsegment.close).toHaveBeenCalledTimes(1);
      expect(provider.setSegment).toHaveBeenLastCalledWith(segment);
    });

    it('adds a fault flag to the segment when the status code is 5xx', async () => {
      // Prepare
      const provider: ProviderService = new ProviderService();
      const segment = new Subsegment('## dummySegment');
      const subsegment = segment.addNewSubsegment('aws.amazon.com');
      vi.spyOn(subsegment, 'addFaultFlag');
      vi.spyOn(segment, 'addNewSubsegment').mockImplementationOnce(
        () => subsegment
      );
      vi.spyOn(provider, 'getSegment')
        .mockImplementationOnce(() => segment)
        .mockImplementationOnce(() => subsegment)
        .mockImplementationOnce(() => subsegment);
      vi.spyOn(subsegment, 'close');
      vi.spyOn(provider, 'setSegment');

      // Act
      provider.instrumentFetch();
      mockFetch({
        origin: 'https://aws.amazon.com/blogs',
        statusCode: 500,
      });

      // Assess
      expect((subsegment as HttpSubsegment).http).toEqual(
        expect.objectContaining({
          response: {
            status: 500,
          },
        })
      );
      expect(subsegment.addFaultFlag).toHaveBeenCalledTimes(1);
      expect(subsegment.close).toHaveBeenCalledTimes(1);
      expect(provider.setSegment).toHaveBeenLastCalledWith(segment);
    });

    it('skips the segment creation when the request has no origin', async () => {
      // Prepare
      const provider: ProviderService = new ProviderService();
      const segment = new Subsegment('## dummySegment');
      vi.spyOn(segment, 'addNewSubsegment');
      vi.spyOn(provider, 'getSegment').mockImplementation(() => segment);
      vi.spyOn(provider, 'setSegment');

      // Act
      provider.instrumentFetch();
      mockFetch({});

      // Assess
      expect(segment.addNewSubsegment).toHaveBeenCalledTimes(0);
      expect(provider.setSegment).toHaveBeenCalledTimes(0);
    });

    it('does not add any path to the segment when the request has no path', async () => {
      // Prepare
      const provider: ProviderService = new ProviderService();
      const segment = new Subsegment('## dummySegment');
      const subsegment = segment.addNewSubsegment('aws.amazon.com');
      vi.spyOn(segment, 'addNewSubsegment').mockImplementationOnce(
        () => subsegment
      );
      vi.spyOn(provider, 'getSegment')
        .mockImplementationOnce(() => segment)
        .mockImplementationOnce(() => subsegment)
        .mockImplementationOnce(() => subsegment);
      vi.spyOn(subsegment, 'close');
      vi.spyOn(provider, 'setSegment');

      // Act
      provider.instrumentFetch();
      mockFetch({
        origin: new URL('https://aws.amazon.com'),
      });

      // Assess
      expect((subsegment as HttpSubsegment).http).toEqual(
        expect.objectContaining({
          request: {
            url: 'https://aws.amazon.com/',
            method: 'GET',
          },
        })
      );
    });
  });

  it('closes the segment and adds a fault flag when the connection fails', async () => {
    // Prepare
    const provider: ProviderService = new ProviderService();
    const segment = new Subsegment('## dummySegment');
    const subsegment = segment.addNewSubsegment('aws.amazon.com');
    vi.spyOn(subsegment, 'addError');
    vi.spyOn(segment, 'addNewSubsegment').mockImplementationOnce(
      () => subsegment
    );
    vi.spyOn(provider, 'getSegment')
      .mockImplementationOnce(() => segment)
      .mockImplementationOnce(() => subsegment)
      .mockImplementationOnce(() => subsegment);
    vi.spyOn(subsegment, 'close');
    vi.spyOn(provider, 'setSegment');

    // Act
    provider.instrumentFetch();
    try {
      mockFetch({
        origin: 'https://aws.amazon.com/blogs',
        throwError: true,
      });
    } catch {}

    // Assess
    expect(subsegment.addError).toHaveBeenCalledTimes(1);
    expect(subsegment.close).toHaveBeenCalledTimes(1);
    expect(provider.setSegment).toHaveBeenLastCalledWith(segment);
  });

  it('forwards the correct sampling decision in the request header', async () => {
    // Prepare
    const provider: ProviderService = new ProviderService();
    const segment = new Subsegment('## dummySegment');
    const subsegment = segment.addNewSubsegment('aws.amazon.com');
    subsegment.notTraced = true;
    vi.spyOn(segment, 'addNewSubsegment').mockImplementationOnce(
      () => subsegment
    );
    vi.spyOn(provider, 'getSegment')
      .mockImplementationOnce(() => segment)
      .mockImplementationOnce(() => subsegment)
      .mockImplementationOnce(() => subsegment);
    vi.spyOn(subsegment, 'close');
    vi.spyOn(provider, 'setSegment');

    // Act
    provider.instrumentFetch();
    const mockRequest = mockFetch({
      origin: 'https://aws.amazon.com',
      path: '/blogs',
      headers: {
        'content-length': '100',
      },
    });

    // Assess
    expect(mockRequest.addHeader).toHaveBeenLastCalledWith(
      'X-Amzn-Trace-Id',
      expect.stringMatching(
        /Root=1-abcdef12-3456abcdef123456abcdef12;Parent=\S{16};Sampled=0/
      )
    );
  });
});
