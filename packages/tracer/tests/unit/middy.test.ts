/**
 * Test Tracer middleware
 *
 * @group unit/tracer/all
 */
import { captureLambdaHandler } from '../../src/middleware/middy';
import middy from '@middy/core';
import { Tracer } from './../../src';
import type { Context, Handler } from 'aws-lambda/handler';
import {
  Segment,
  setContextMissingStrategy,
  Subsegment,
} from 'aws-xray-sdk-core';
import { cleanupMiddlewares } from '@aws-lambda-powertools/commons';
import context from '@aws-lambda-powertools/testing-utils/context';

jest.spyOn(console, 'debug').mockImplementation(() => null);
jest.spyOn(console, 'warn').mockImplementation(() => null);
jest.spyOn(console, 'error').mockImplementation(() => null);

describe('Middy middleware', () => {
  const ENVIRONMENT_VARIABLES = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env = { ...ENVIRONMENT_VARIABLES };
  });

  afterAll(() => {
    process.env = ENVIRONMENT_VARIABLES;
  });
  describe('Middleware: captureLambdaHandler', () => {
    test('when used while tracing is disabled, it does nothing', async () => {
      // Prepare
      const tracer: Tracer = new Tracer({ enabled: false });
      const setSegmentSpy = jest
        .spyOn(tracer.provider, 'setSegment')
        .mockImplementation();
      const getSegmentSpy = jest
        .spyOn(tracer.provider, 'getSegment')
        .mockImplementationOnce(
          () => new Segment('facade', process.env._X_AMZN_TRACE_ID || null)
        )
        .mockImplementationOnce(() => new Subsegment('## index.handler'));
      const lambdaHandler: Handler = async (
        _event: unknown,
        _context: Context
      ) => ({
        foo: 'bar',
      });
      const handler = middy(lambdaHandler).use(captureLambdaHandler(tracer));

      // Act
      await handler({}, context, () => console.log('Lambda invoked!'));

      // Assess
      expect(setSegmentSpy).toHaveBeenCalledTimes(0);
      expect(getSegmentSpy).toHaveBeenCalledTimes(0);
    });

    test('when used while tracing is disabled, even if the handler throws an error, it does nothing', async () => {
      // Prepare
      const tracer: Tracer = new Tracer({ enabled: false });
      const setSegmentSpy = jest
        .spyOn(tracer.provider, 'setSegment')
        .mockImplementation();
      const getSegmentSpy = jest
        .spyOn(tracer.provider, 'getSegment')
        .mockImplementationOnce(
          () => new Segment('facade', process.env._X_AMZN_TRACE_ID || null)
        )
        .mockImplementationOnce(() => new Subsegment('## index.handler'));
      const lambdaHandler: Handler = async (
        _event: unknown,
        _context: Context
      ) => {
        throw new Error('Exception thrown!');
      };
      const handler = middy(lambdaHandler).use(captureLambdaHandler(tracer));

      // Act & Assess
      await expect(
        handler({}, context, () => console.log('Lambda invoked!'))
      ).rejects.toThrowError(Error);
      expect(setSegmentSpy).toHaveBeenCalledTimes(0);
      expect(getSegmentSpy).toHaveBeenCalledTimes(0);
      expect.assertions(3);
    });

    test('when used while POWERTOOLS_TRACER_CAPTURE_RESPONSE is set to false, it does not capture the response as metadata', async () => {
      // Prepare
      process.env.POWERTOOLS_TRACER_CAPTURE_RESPONSE = 'false';
      const tracer: Tracer = new Tracer();
      jest.spyOn(tracer.provider, 'setSegment').mockImplementation();
      const putMetadataSpy = jest.spyOn(tracer, 'putMetadata');

      const handler = middy(async (_event: unknown, _context: Context) => ({
        foo: 'bar',
      })).use(captureLambdaHandler(tracer));

      // Act
      await handler({}, context);

      // Assess
      expect(putMetadataSpy).toHaveBeenCalledTimes(0);
      delete process.env.POWERTOOLS_TRACER_CAPTURE_RESPONSE;
    });

    test('when used while captureResponse set to false, it does not capture the response as metadata', async () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      jest.spyOn(tracer.provider, 'setSegment').mockImplementation();
      const putMetadataSpy = jest.spyOn(tracer, 'putMetadata');

      const handler = middy(async (_event: unknown, _context: Context) => ({
        foo: 'bar',
      })).use(captureLambdaHandler(tracer, { captureResponse: false }));

      // Act
      await handler({}, context);

      // Assess
      expect(putMetadataSpy).toHaveBeenCalledTimes(0);
    });

    test('when used while captureResponse set to true, it captures the response as metadata', async () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      jest.spyOn(tracer.provider, 'setSegment').mockImplementation();
      const putMetadataSpy = jest.spyOn(tracer, 'putMetadata');

      const handler = middy(async (_event: unknown, _context: Context) => ({
        foo: 'bar',
      })).use(captureLambdaHandler(tracer, { captureResponse: true }));

      // Act
      await handler({}, context);

      // Assess
      expect(putMetadataSpy).toHaveBeenCalledTimes(1);
      expect(putMetadataSpy).toHaveBeenCalledWith('index.handler response', {
        foo: 'bar',
      });
    });

    test('when used with standard config, it captures the response as metadata', async () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      jest.spyOn(tracer.provider, 'setSegment').mockImplementation();
      const putMetadataSpy = jest.spyOn(tracer, 'putMetadata');

      const handler = middy(async (_event: unknown, _context: Context) => ({
        foo: 'bar',
      })).use(captureLambdaHandler(tracer));

      // Act
      await handler({}, context);

      // Assess
      expect(putMetadataSpy).toHaveBeenCalledTimes(1);
      expect(putMetadataSpy).toHaveBeenCalledWith('index.handler response', {
        foo: 'bar',
      });
    });

    test('when used while POWERTOOLS_TRACER_CAPTURE_ERROR is set to false, it does not capture the exceptions', async () => {
      // Prepare
      process.env.POWERTOOLS_TRACER_CAPTURE_ERROR = 'false';
      const tracer: Tracer = new Tracer();
      const newSubsegment: Segment | Subsegment | undefined = new Subsegment(
        '## index.handler'
      );
      const setSegmentSpy = jest
        .spyOn(tracer.provider, 'setSegment')
        .mockImplementation();
      jest
        .spyOn(tracer.provider, 'getSegment')
        .mockImplementation(() => newSubsegment);
      setContextMissingStrategy(() => null);
      const addErrorSpy = jest.spyOn(newSubsegment, 'addError');
      const addErrorFlagSpy = jest.spyOn(newSubsegment, 'addErrorFlag');
      const lambdaHandler: Handler = async (
        _event: unknown,
        _context: Context
      ) => {
        throw new Error('Exception thrown!');
      };
      const handler = middy(lambdaHandler).use(captureLambdaHandler(tracer));

      // Act & Assess
      await expect(
        handler({}, context, () => console.log('Lambda invoked!'))
      ).rejects.toThrowError(Error);
      expect(setSegmentSpy).toHaveBeenCalledTimes(2);
      expect('cause' in newSubsegment).toBe(false);
      expect(addErrorFlagSpy).toHaveBeenCalledTimes(1);
      expect(addErrorSpy).toHaveBeenCalledTimes(0);
      expect.assertions(5);

      delete process.env.POWERTOOLS_TRACER_CAPTURE_ERROR;
    });

    test('when used with standard config, it captures the exception correctly', async () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      const newSubsegment: Segment | Subsegment | undefined = new Subsegment(
        '## index.handler'
      );
      const setSegmentSpy = jest
        .spyOn(tracer.provider, 'setSegment')
        .mockImplementation();
      jest
        .spyOn(tracer.provider, 'getSegment')
        .mockImplementation(() => newSubsegment);
      setContextMissingStrategy(() => null);
      const addErrorSpy = jest.spyOn(newSubsegment, 'addError');
      const lambdaHandler: Handler = async (
        _event: unknown,
        _context: Context
      ) => {
        throw new Error('Exception thrown!');
      };
      const handler = middy(lambdaHandler).use(captureLambdaHandler(tracer));

      // Act & Assess
      await expect(
        handler({}, context, () => console.log('Lambda invoked!'))
      ).rejects.toThrowError(Error);
      expect(setSegmentSpy).toHaveBeenCalledTimes(2);
      expect('cause' in newSubsegment).toBe(true);
      expect(addErrorSpy).toHaveBeenCalledTimes(1);
      expect(addErrorSpy).toHaveBeenCalledWith(
        new Error('Exception thrown!'),
        false
      );
      expect.assertions(5);
    });

    test('when used with standard config, it annotates ColdStart correctly', async () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      jest.spyOn(tracer.provider, 'setSegment').mockImplementation(() => ({}));
      jest
        .spyOn(tracer.provider, 'getSegment')
        .mockImplementationOnce(() => new Segment('facade'))
        .mockImplementationOnce(() => new Subsegment('## index.handler'))
        .mockImplementationOnce(() => new Segment('facade'))
        .mockImplementation(() => new Subsegment('## index.handler'));
      const putAnnotationSpy = jest.spyOn(tracer, 'putAnnotation');

      const handler = middy(async (_event: unknown, _context: Context) => ({
        foo: 'bar',
      })).use(captureLambdaHandler(tracer));

      // Act
      await handler({}, context);
      await handler({}, context);

      // Assess
      // 2x Cold Start + 2x Service
      expect(putAnnotationSpy).toHaveBeenCalledTimes(4);
      expect(putAnnotationSpy).toHaveBeenNthCalledWith(1, 'ColdStart', true);
      expect(putAnnotationSpy).toHaveBeenNthCalledWith(3, 'ColdStart', false);
    });

    test('when used with standard config, it annotates Service correctly', async () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      jest.spyOn(tracer.provider, 'setSegment').mockImplementation(() => ({}));
      jest
        .spyOn(tracer.provider, 'getSegment')
        .mockImplementationOnce(() => new Segment('facade'))
        .mockImplementation(() => new Subsegment('## index.handler'));
      const putAnnotationSpy = jest.spyOn(tracer, 'putAnnotation');

      const handler = middy(async (_event: unknown, _context: Context) => ({
        foo: 'bar',
      })).use(captureLambdaHandler(tracer));

      // Act
      await handler({}, context);

      // Assess
      // The first call is for the Cold Start annotation
      expect(putAnnotationSpy).toHaveBeenCalledTimes(2);
      expect(putAnnotationSpy).toHaveBeenNthCalledWith(
        2,
        'Service',
        'hello-world'
      );
    });

    test('when enabled, and another middleware returns early, it still closes and restores the segments correctly', async () => {
      // Prepare
      const tracer = new Tracer();
      const setSegmentSpy = jest
        .spyOn(tracer.provider, 'setSegment')
        .mockImplementation(() => ({}));
      jest.spyOn(tracer, 'annotateColdStart').mockImplementation(() => ({}));
      jest
        .spyOn(tracer, 'addServiceNameAnnotation')
        .mockImplementation(() => ({}));
      const facadeSegment1 = new Segment('facade');
      const handlerSubsegment1 = new Subsegment('## index.handlerA');
      jest
        .spyOn(facadeSegment1, 'addNewSubsegment')
        .mockImplementation(() => handlerSubsegment1);
      const facadeSegment2 = new Segment('facade');
      const handlerSubsegment2 = new Subsegment('## index.handlerB');
      jest
        .spyOn(facadeSegment2, 'addNewSubsegment')
        .mockImplementation(() => handlerSubsegment2);
      jest
        .spyOn(tracer.provider, 'getSegment')
        .mockImplementationOnce(() => facadeSegment1)
        .mockImplementationOnce(() => facadeSegment2);
      const myCustomMiddleware = (): middy.MiddlewareObj => {
        const before = async (
          request: middy.Request
        ): Promise<undefined | string> => {
          // Return early on the second invocation
          if (request.event.idx === 1) {
            // Cleanup Powertools resources
            await cleanupMiddlewares(request);

            // Then return early
            return 'foo';
          }
        };

        return {
          before,
        };
      };
      const handler = middy((): void => {
        console.log('Hello world!');
      })
        .use(captureLambdaHandler(tracer, { captureResponse: false }))
        .use(myCustomMiddleware());

      // Act
      await handler({ idx: 0 }, context);
      await handler({ idx: 1 }, context);

      // Assess
      // Check that the subsegments are closed
      expect(handlerSubsegment1.isClosed()).toBe(true);
      expect(handlerSubsegment2.isClosed()).toBe(true);
      // Check that the segments are restored
      expect(setSegmentSpy).toHaveBeenCalledTimes(4);
      expect(setSegmentSpy).toHaveBeenNthCalledWith(2, facadeSegment1);
      expect(setSegmentSpy).toHaveBeenNthCalledWith(4, facadeSegment2);
    });
  });

  it('catches the error and logs a warning when the segment closing/serialization fails upon closing the segment', async () => {
    // Prepare
    const tracer = new Tracer();
    const facadeSegment = new Segment('facade');
    const handlerSubsegment = new Subsegment('## index.handler');
    jest
      .spyOn(tracer.provider, 'getSegment')
      .mockImplementationOnce(() => facadeSegment)
      .mockImplementationOnce(() => handlerSubsegment);
    jest.spyOn(tracer, 'annotateColdStart').mockImplementation(() => ({}));
    jest
      .spyOn(tracer, 'addServiceNameAnnotation')
      .mockImplementation(() => ({}));
    const setSegmentSpy = jest
      .spyOn(tracer.provider, 'setSegment')
      .mockImplementation(() => ({}));
    jest
      .spyOn(facadeSegment, 'addNewSubsegment')
      .mockImplementation(() => handlerSubsegment);
    const handler = middy((): void => {
      console.log('Hello world!');
    }).use(captureLambdaHandler(tracer));
    const logWarningSpy = jest.spyOn(console, 'warn');
    const closeSpy = jest
      .spyOn(handlerSubsegment, 'close')
      .mockImplementation(() => {
        throw new Error('dummy error');
      });

    // Act
    await handler({ idx: 0 }, context);

    // Assess
    expect(closeSpy).toHaveBeenCalledTimes(1);
    expect(logWarningSpy).toHaveBeenNthCalledWith(
      1,
      `Failed to close or serialize segment %s. We are catching the error but data might be lost.`,
      handlerSubsegment.name,
      new Error('dummy error')
    );
    // Check that the segments are restored
    expect(setSegmentSpy).toHaveBeenNthCalledWith(2, facadeSegment);
  });
});
