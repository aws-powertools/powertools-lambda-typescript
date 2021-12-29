/**
 * Test ProviderService class
 *
 * @group unit/tracer/all
 */

import { ProviderService } from '../../src/provider';
import {
  captureAWS,
  captureAWSClient,
  captureAWSv3Client,
  captureAsyncFunc,
  captureFunc,
  getNamespace,
  getSegment,
  setContextMissingStrategy,
  setDaemonAddress,
  setLogger,
  setSegment,
  Subsegment,
} from 'aws-xray-sdk-core';
import { SQSRecord } from 'aws-lambda';
import { ContextExamples } from '@aws-lambda-powertools/commons';

jest.mock('aws-xray-sdk-core', () => ({
  captureAWS: jest.fn(),
  captureAWSClient: jest.fn(),
  captureAWSv3Client: jest.fn(),
  captureAsyncFunc: jest.fn(),
  captureFunc: jest.fn(),
  getNamespace: jest.fn(),
  getSegment: jest.fn(),
  setContextMissingStrategy: jest.fn(),
  setDaemonAddress: jest.fn(),
  setLogger: jest.fn(),
  setSegment: jest.fn(),
  Segment: jest.fn().mockImplementation(() => ({
    addNewSubsegment: jest
      .fn()
      .mockReturnValue({
        start_time: new Date(),
        close: jest.fn(),
        addNewSubsegment: jest.fn().mockReturnValue({ start_time: new Date(), close: jest.fn() }),
      }),
    addPluginData: jest.fn(),
  })),
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

  describe('Method: continueSQSRecordTrace', () => {
    beforeAll(() => {
      process.env.AWS_LAMBDA_FUNCTION_NAME = ContextExamples.helloworldContext.functionName;
    });

    test('when called, it set the correct segment', () => {
      // Prepare
      const provider: ProviderService = new ProviderService();
      const record: SQSRecord = {
        messageId: 'fd95260b-1600-4028-b252-590cfcc9fe6d',
        receiptHandle: 'test',
        body: 'Information about current NY Times fiction bestseller for week of 12/11/2016.',
        attributes: {
          ApproximateReceiveCount: '1',
          AWSTraceHeader: 'Root=1-61cc1005-53ff3b575736e3c74eae6bfb;Parent=1f57c53badf96998;Sampled=1',
          SentTimestamp: '1640763398126',
          SenderId: 'AROAT26JIZQWSOCCOUNE5:sqsProducer',
          ApproximateFirstReceiveTimestamp: '1640763398127',
        },
        messageAttributes: {},
        md5OfBody: 'bbdc5fdb8be7251f5c910905db994bab',
        eventSource: 'aws:sqs',
        eventSourceARN:
          'arn:aws:sqs:eu-west-1:123456789012:queue',
        awsRegion: 'eu-west-1',
      };

      const context = ContextExamples.helloworldContext;

      // Act
      provider.continueSQSRecordTrace(record, context);

      // Assess
      expect(setSegment).toHaveBeenCalledTimes(1);
      // TODO: add better assertion on segments created (especially around trace ID and parents)
    });

    test('when called, it throw if no AWSTraceHeader is provided in records', () => {
      // Prepare
      const provider: ProviderService = new ProviderService();
      const record: SQSRecord = {
        messageId: 'fd95260b-1600-4028-b252-590cfcc9fe6d',
        receiptHandle: 'test',
        body: 'Information about current NY Times fiction bestseller for week of 12/11/2016.',
        attributes: {
          ApproximateReceiveCount: '1',
          // AWSTraceHeader: 'Root=1-61cc1005-53ff3b575736e3c74eae6bfb;Parent=1f57c53badf96998;Sampled=1',
          SentTimestamp: '1640763398126',
          SenderId: 'AROAT26JIZQWSOCCOUNE5:sqsProducer',
          ApproximateFirstReceiveTimestamp: '1640763398127',
        },
        messageAttributes: {},
        md5OfBody: 'bbdc5fdb8be7251f5c910905db994bab',
        eventSource: 'aws:sqs',
        eventSourceARN:
          'arn:aws:sqs:eu-west-1:123456789012:queue',
        awsRegion: 'eu-west-1',
      };

      const context = ContextExamples.helloworldContext;

      // Act
      let actualError: Error = new Error('Wrong error');
      try {
        provider.continueSQSRecordTrace(record, context);
      } catch (error) {
        actualError = error as Error;
      }

      // Assess
      expect(actualError.message).toBe(`No trace header found in record ${record.messageId}. can't follow trace ... skipping`);
    });

    test('when called with handlerExecStartTime, it use it', () => {
      // Prepare
      const provider: ProviderService = new ProviderService();
      const handlerExecStartTime = new Date().getTime();
      const record: SQSRecord = {
        messageId: 'fd95260b-1600-4028-b252-590cfcc9fe6d',
        receiptHandle: 'test',
        body: 'Information about current NY Times fiction bestseller for week of 12/11/2016.',
        attributes: {
          ApproximateReceiveCount: '1',
          AWSTraceHeader: 'Root=1-61cc1005-53ff3b575736e3c74eae6bfb;Parent=1f57c53badf96998;Sampled=1',
          SentTimestamp: '1640763398126',
          SenderId: 'AROAT26JIZQWSOCCOUNE5:sqsProducer',
          ApproximateFirstReceiveTimestamp: '1640763398127',
        },
        messageAttributes: {},
        md5OfBody: 'bbdc5fdb8be7251f5c910905db994bab',
        eventSource: 'aws:sqs',
        eventSourceARN:
          'arn:aws:sqs:eu-west-1:123456789012:queue',
        awsRegion: 'eu-west-1',
      };

      const context = ContextExamples.helloworldContext;

      // Act
      provider.continueSQSRecordTrace(record, context, handlerExecStartTime);

      // Assess
      expect(setSegment).toHaveBeenCalledTimes(1);
      // TODO: add better assertion on segments created (especially around trace ID and parents)
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
