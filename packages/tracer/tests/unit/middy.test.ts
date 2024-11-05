import { cleanupMiddlewares } from '@aws-lambda-powertools/commons';
import context from '@aws-lambda-powertools/testing-utils/context';
import middy from '@middy/core';
import type { Context, Handler } from 'aws-lambda';
import {
  Segment,
  Subsegment,
  setContextMissingStrategy,
} from 'aws-xray-sdk-core';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { captureLambdaHandler } from '../../src/middleware/middy.js';
import { Tracer } from './../../src/index.js';

describe('Middy middleware', () => {
  const ENVIRONMENT_VARIABLES = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env = { ...ENVIRONMENT_VARIABLES };
  });

  afterAll(() => {
    process.env = ENVIRONMENT_VARIABLES;
  });
  describe('Middleware: captureLambdaHandler', () => {
    it('does nothing when used while tracing is disabled', async () => {
      // Prepare
      const tracer: Tracer = new Tracer({ enabled: false });
      const setSegmentSpy = vi
        .spyOn(tracer.provider, 'setSegment')
        .mockImplementation(() => null);
      const getSegmentSpy = vi
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

    it('does nothing when used while tracing is disabled, even if the handler throws an error', async () => {
      // Prepare
      const tracer: Tracer = new Tracer({ enabled: false });
      const setSegmentSpy = vi
        .spyOn(tracer.provider, 'setSegment')
        .mockImplementation(() => null);
      const getSegmentSpy = vi
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

    it('does not capture the response when used while POWERTOOLS_TRACER_CAPTURE_RESPONSE is set to false', async () => {
      // Prepare
      process.env.POWERTOOLS_TRACER_CAPTURE_RESPONSE = 'false';
      const tracer: Tracer = new Tracer();
      vi.spyOn(tracer.provider, 'setSegment').mockImplementation(() => null);
      const putMetadataSpy = vi.spyOn(tracer, 'putMetadata');

      const handler = middy(async (_event: unknown, _context: Context) => ({
        foo: 'bar',
      })).use(captureLambdaHandler(tracer));

      // Act
      await handler({}, context);

      // Assess
      expect(putMetadataSpy).toHaveBeenCalledTimes(0);
      process.env.POWERTOOLS_TRACER_CAPTURE_RESPONSE = undefined;
    });

    it('does not capture the resposne as metadata when used while captureResponse set to false', async () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      vi.spyOn(tracer.provider, 'setSegment').mockImplementation(() => null);
      const putMetadataSpy = vi.spyOn(tracer, 'putMetadata');

      const handler = middy(async (_event: unknown, _context: Context) => ({
        foo: 'bar',
      })).use(captureLambdaHandler(tracer, { captureResponse: false }));

      // Act
      await handler({}, context);

      // Assess
      expect(putMetadataSpy).toHaveBeenCalledTimes(0);
    });

    it('captures the response as metadata when used while captureResponse set to true', async () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      vi.spyOn(tracer.provider, 'setSegment').mockImplementation(() => null);
      const putMetadataSpy = vi.spyOn(tracer, 'putMetadata');

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

    it('captures the response as metadata when used with standard config', async () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      vi.spyOn(tracer.provider, 'setSegment').mockImplementation(() => null);
      const putMetadataSpy = vi.spyOn(tracer, 'putMetadata');

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

    it('does not capture exceptions when used while POWERTOOLS_TRACER_CAPTURE_ERROR is set to false', async () => {
      // Prepare
      process.env.POWERTOOLS_TRACER_CAPTURE_ERROR = 'false';
      const tracer: Tracer = new Tracer();
      const newSubsegment: Segment | Subsegment | undefined = new Subsegment(
        '## index.handler'
      );
      const setSegmentSpy = vi
        .spyOn(tracer.provider, 'setSegment')
        .mockImplementation(() => null);
      vi.spyOn(tracer.provider, 'getSegment').mockImplementation(
        () => newSubsegment
      );
      setContextMissingStrategy(() => null);
      const addErrorSpy = vi.spyOn(newSubsegment, 'addError');
      const addErrorFlagSpy = vi.spyOn(newSubsegment, 'addErrorFlag');
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

      process.env.POWERTOOLS_TRACER_CAPTURE_ERROR = undefined;
    });

    it('captures the exception correctly when used with standard config', async () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      const newSubsegment: Segment | Subsegment | undefined = new Subsegment(
        '## index.handler'
      );
      const setSegmentSpy = vi
        .spyOn(tracer.provider, 'setSegment')
        .mockImplementation(() => null);
      vi.spyOn(tracer.provider, 'getSegment').mockImplementation(
        () => newSubsegment
      );
      setContextMissingStrategy(() => null);
      const addErrorSpy = vi.spyOn(newSubsegment, 'addError');
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

    it('annotates the ColdStart correctly when used with standard config', async () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      vi.spyOn(tracer.provider, 'setSegment').mockImplementation(() => ({}));
      vi.spyOn(tracer.provider, 'getSegment')
        .mockImplementationOnce(() => new Segment('facade'))
        .mockImplementationOnce(() => new Subsegment('## index.handler'))
        .mockImplementationOnce(() => new Segment('facade'))
        .mockImplementation(() => new Subsegment('## index.handler'));
      const putAnnotationSpy = vi.spyOn(tracer, 'putAnnotation');

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

    it('annotates the Service correctly when used with standard config', async () => {
      // Prepare
      const tracer: Tracer = new Tracer();
      vi.spyOn(tracer.provider, 'setSegment').mockImplementation(() => ({}));
      vi.spyOn(tracer.provider, 'getSegment')
        .mockImplementationOnce(() => new Segment('facade'))
        .mockImplementation(() => new Subsegment('## index.handler'));
      const putAnnotationSpy = vi.spyOn(tracer, 'putAnnotation');

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

    it('closes and restores segments correctly when another middleware returns early', async () => {
      // Prepare
      const tracer = new Tracer();
      const setSegmentSpy = vi
        .spyOn(tracer.provider, 'setSegment')
        .mockImplementation(() => ({}));
      vi.spyOn(tracer, 'annotateColdStart').mockImplementation(() => ({}));
      vi.spyOn(tracer, 'addServiceNameAnnotation').mockImplementation(
        () => ({})
      );
      const facadeSegment1 = new Segment('facade');
      const handlerSubsegment1 = new Subsegment('## index.handlerA');
      vi.spyOn(facadeSegment1, 'addNewSubsegment').mockImplementation(
        () => handlerSubsegment1
      );
      const facadeSegment2 = new Segment('facade');
      const handlerSubsegment2 = new Subsegment('## index.handlerB');
      vi.spyOn(facadeSegment2, 'addNewSubsegment').mockImplementation(
        () => handlerSubsegment2
      );
      vi.spyOn(tracer.provider, 'getSegment')
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
    vi.spyOn(tracer.provider, 'getSegment')
      .mockImplementationOnce(() => facadeSegment)
      .mockImplementationOnce(() => handlerSubsegment);
    vi.spyOn(tracer, 'annotateColdStart').mockImplementation(() => ({}));
    vi.spyOn(tracer, 'addServiceNameAnnotation').mockImplementation(() => ({}));
    const setSegmentSpy = vi
      .spyOn(tracer.provider, 'setSegment')
      .mockImplementation(() => ({}));
    vi.spyOn(facadeSegment, 'addNewSubsegment').mockImplementation(
      () => handlerSubsegment
    );
    const handler = middy((): void => {
      console.log('Hello world!');
    }).use(captureLambdaHandler(tracer));
    const logWarningSpy = vi.spyOn(console, 'warn');
    const closeSpy = vi
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
      'Failed to close or serialize segment %s. We are catching the error but data might be lost.',
      handlerSubsegment.name,
      new Error('dummy error')
    );
    // Check that the segments are restored
    expect(setSegmentSpy).toHaveBeenNthCalledWith(2, facadeSegment);
  });
});
