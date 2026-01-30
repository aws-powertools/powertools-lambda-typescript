import context from '@aws-lambda-powertools/testing-utils/context';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { Segment, Subsegment } from 'aws-xray-sdk-core';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { tracer as tracerMiddleware } from '../../../../src/http/middleware/tracer.js';
import { Router } from '../../../../src/http/Router.js';
import { createTestEvent, ResponseStream } from '../helpers.js';

describe('Tracer Middleware', () => {
  const ENVIRONMENT_VARIABLES = process.env;
  let app: Router;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env = { ...ENVIRONMENT_VARIABLES };
    app = new Router();
  });

  afterAll(() => {
    process.env = ENVIRONMENT_VARIABLES;
  });

  describe('when tracing is disabled', () => {
    it('does nothing and calls next', async () => {
      // Prepare
      const tracer = new Tracer({ enabled: false });
      const setSegmentSpy = vi.spyOn(tracer, 'setSegment');
      const getSegmentSpy = vi.spyOn(tracer, 'getSegment');
      app.use(tracerMiddleware(tracer));
      app.get('/test', () => ({ success: true }));

      // Act
      const result = await app.resolve(
        createTestEvent('/test', 'GET'),
        context
      );

      // Assess
      expect(result.statusCode).toBe(200);
      expect(setSegmentSpy).toHaveBeenCalledTimes(0);
      expect(getSegmentSpy).toHaveBeenCalledTimes(0);
    });

    it('does nothing even when handler throws an error', async () => {
      // Prepare
      const tracer = new Tracer({ enabled: false });
      const setSegmentSpy = vi.spyOn(tracer, 'setSegment');
      const getSegmentSpy = vi.spyOn(tracer, 'getSegment');
      const addErrorSpy = vi.spyOn(tracer, 'addErrorAsMetadata');
      app.use(tracerMiddleware(tracer));
      app.get('/test', () => {
        throw new Error('Test error');
      });

      // Act
      const result = await app.resolve(
        createTestEvent('/test', 'GET'),
        context
      );

      // Assess
      expect(result.statusCode).toBe(500);
      expect(setSegmentSpy).toHaveBeenCalledTimes(0);
      expect(getSegmentSpy).toHaveBeenCalledTimes(0);
      expect(addErrorSpy).toHaveBeenCalledTimes(0);
    });
  });

  describe('when tracing is enabled', () => {
    it('creates a subsegment with method and pathname', async () => {
      // Prepare
      const tracer = new Tracer();
      const mainSegment = new Segment('main');
      const handlerSubsegment = new Subsegment('GET /users');
      vi.spyOn(mainSegment, 'addNewSubsegment').mockReturnValue(
        handlerSubsegment
      );
      vi.spyOn(tracer, 'setSegment').mockImplementation(() => null);
      vi.spyOn(tracer, 'getSegment').mockReturnValue(mainSegment);
      app.use(tracerMiddleware(tracer));
      app.get('/users', () => ({ users: [] }));

      // Act
      await app.resolve(createTestEvent('/users', 'GET'), context);

      // Assess
      expect(mainSegment.addNewSubsegment).toHaveBeenCalledWith('GET /users');
    });

    it('annotates cold start and service name', async () => {
      // Prepare
      const tracer = new Tracer();
      vi.spyOn(tracer, 'setSegment').mockImplementation(() => null);
      vi.spyOn(tracer, 'getSegment')
        .mockImplementationOnce(() => new Segment('main'))
        .mockImplementation(() => new Subsegment('GET /test'));
      vi.spyOn(tracer, 'annotateColdStart').mockImplementation(() => ({}));
      vi.spyOn(tracer, 'addServiceNameAnnotation').mockImplementation(
        () => ({})
      );

      app.use(tracerMiddleware(tracer));
      app.get('/test', () => ({ success: true }));

      // Act
      await app.resolve(createTestEvent('/test', 'GET'), context);

      // Assess
      expect(tracer.annotateColdStart).toHaveBeenCalledTimes(1);
      expect(tracer.addServiceNameAnnotation).toHaveBeenCalledTimes(1);
    });

    it('captures JSON response as metadata by default', async () => {
      // Prepare
      const tracer = new Tracer();
      vi.spyOn(tracer, 'setSegment').mockImplementation(() => null);
      vi.spyOn(tracer, 'getSegment')
        .mockImplementationOnce(() => new Segment('main'))
        .mockImplementation(() => new Subsegment('GET /test'));
      const putMetadataSpy = vi.spyOn(tracer, 'putMetadata');

      app.use(tracerMiddleware(tracer));
      app.get('/test', () => ({ foo: 'bar' }));

      // Act
      await app.resolve(createTestEvent('/test', 'GET'), context);

      // Assess
      expect(putMetadataSpy).toHaveBeenCalledTimes(1);
      expect(putMetadataSpy).toHaveBeenCalledWith('GET /test response', {
        foo: 'bar',
      });
    });

    it('does not capture response when `captureResponse` is false', async () => {
      // Prepare
      const tracer = new Tracer();
      vi.spyOn(tracer, 'setSegment').mockImplementation(() => null);
      vi.spyOn(tracer, 'getSegment')
        .mockImplementationOnce(() => new Segment('main'))
        .mockImplementation(() => new Subsegment('GET /test'));
      const putMetadataSpy = vi.spyOn(tracer, 'putMetadata');

      app.use(tracerMiddleware(tracer, { captureResponse: false }));
      app.get('/test', () => ({ foo: 'bar' }));

      // Act
      await app.resolve(createTestEvent('/test', 'GET'), context);

      // Assess
      expect(putMetadataSpy).toHaveBeenCalledTimes(0);
    });

    it('does not capture non-JSON responses', async () => {
      // Prepare
      const tracer = new Tracer();
      vi.spyOn(tracer, 'setSegment').mockImplementation(() => null);
      vi.spyOn(tracer, 'getSegment')
        .mockImplementationOnce(() => new Segment('main'))
        .mockImplementation(() => new Subsegment('GET /test'));
      const putMetadataSpy = vi.spyOn(tracer, 'putMetadata');

      app.use(tracerMiddleware(tracer));
      app.get(
        '/test',
        () =>
          new Response('plain text', {
            headers: { 'Content-Type': 'text/plain' },
          })
      );

      // Act
      await app.resolve(createTestEvent('/test', 'GET'), context);

      // Assess
      expect(putMetadataSpy).toHaveBeenCalledTimes(0);
    });

    it('closes subsegment and restores parent segment after successful request', async () => {
      // Prepare
      const tracer = new Tracer();
      const mainSegment = new Segment('main');
      const handlerSubsegment = new Subsegment('GET /test');
      vi.spyOn(mainSegment, 'addNewSubsegment').mockReturnValue(
        handlerSubsegment
      );
      const setSegmentSpy = vi
        .spyOn(tracer, 'setSegment')
        .mockImplementation(() => null);
      vi.spyOn(tracer, 'getSegment').mockReturnValue(mainSegment);

      app.use(tracerMiddleware(tracer));
      app.get('/test', async () => ({ success: true }));

      // Act
      await app.resolve(createTestEvent('/test', 'GET'), context);

      // Assess
      expect(handlerSubsegment.isClosed()).toBe(true);
      expect(setSegmentSpy).toHaveBeenCalledTimes(2);
      expect(setSegmentSpy).toHaveBeenNthCalledWith(1, handlerSubsegment);
      expect(setSegmentSpy).toHaveBeenNthCalledWith(2, mainSegment);
    });

    it('captures error as metadata when handler throws', async () => {
      // Prepare
      const tracer = new Tracer();
      const newSubsegment = new Subsegment('GET /test');
      vi.spyOn(tracer, 'setSegment').mockImplementation(() => null);
      vi.spyOn(tracer, 'getSegment').mockReturnValue(newSubsegment);
      const addErrorSpy = vi.spyOn(newSubsegment, 'addError');
      const testError = new Error('Test error');

      app.use(tracerMiddleware(tracer));
      app.get('/test', () => {
        throw testError;
      });

      // Act
      const result = await app.resolve(
        createTestEvent('/test', 'GET'),
        context
      );

      // Assess
      expect(result.statusCode).toBe(500);
      expect(addErrorSpy).toHaveBeenCalledTimes(1);
      expect(addErrorSpy).toHaveBeenCalledWith(testError, false);
    });

    it('closes subsegment even when handler throws', async () => {
      // Prepare
      const tracer = new Tracer();
      const facadeSegment = new Segment('facade');
      const handlerSubsegment = new Subsegment('GET /test');
      vi.spyOn(facadeSegment, 'addNewSubsegment').mockReturnValue(
        handlerSubsegment
      );
      const setSegmentSpy = vi
        .spyOn(tracer, 'setSegment')
        .mockImplementation(() => null);
      vi.spyOn(tracer, 'getSegment').mockReturnValue(facadeSegment);

      app.use(tracerMiddleware(tracer));
      app.get('/test', () => {
        throw new Error('Test error');
      });

      // Act
      await app.resolve(createTestEvent('/test', 'GET'), context);

      // Assess
      expect(handlerSubsegment.isClosed()).toBe(true);
      expect(setSegmentSpy).toHaveBeenLastCalledWith(facadeSegment);
    });

    it('calls annotations but does not create subsegment when no parent segment exists', async () => {
      // Prepare
      const tracer = new Tracer();
      vi.spyOn(tracer, 'getSegment').mockReturnValue(undefined);
      const setSegmentSpy = vi
        .spyOn(tracer, 'setSegment')
        .mockImplementation(() => null);
      const annotateColdStartSpy = vi.spyOn(tracer, 'annotateColdStart');
      const addServiceNameAnnotationSpy = vi.spyOn(
        tracer,
        'addServiceNameAnnotation'
      );

      app.use(tracerMiddleware(tracer));
      app.get('/test', async () => ({ success: true }));

      // Act
      await app.resolve(createTestEvent('/test', 'GET'), context);

      // Assess
      expect(annotateColdStartSpy).toHaveBeenCalledTimes(1);
      expect(addServiceNameAnnotationSpy).toHaveBeenCalledTimes(1);
      expect(setSegmentSpy).toHaveBeenCalledTimes(0);
    });

    it('catches the error and logs a warning when the segment closing fails', async () => {
      // Prepare
      const tracer = new Tracer();
      const mainSegment = new Segment('main');
      const handlerSubsegment = new Subsegment('GET /test');
      vi.spyOn(mainSegment, 'addNewSubsegment').mockReturnValue(
        handlerSubsegment
      );
      vi.spyOn(tracer, 'getSegment').mockReturnValue(mainSegment);
      vi.spyOn(tracer, 'annotateColdStart').mockImplementation(() => ({}));
      vi.spyOn(tracer, 'addServiceNameAnnotation').mockImplementation(
        () => ({})
      );
      vi.spyOn(tracer, 'addResponseAsMetadata').mockImplementation(() => ({}));
      const setSegmentSpy = vi
        .spyOn(tracer, 'setSegment')
        .mockImplementation(() => null);
      const logWarningSpy = vi.spyOn(console, 'warn');
      const closeSpy = vi
        .spyOn(handlerSubsegment, 'close')
        .mockImplementation(() => {
          throw new Error('dummy error');
        });

      app.use(tracerMiddleware(tracer));
      app.get('/test', async () => ({ success: true }));

      // Act
      await app.resolve(createTestEvent('/test', 'GET'), context);

      // Assess
      expect(closeSpy).toHaveBeenCalledTimes(1);
      expect(logWarningSpy).toHaveBeenNthCalledWith(
        1,
        'Failed to close or serialize segment %s. Data might be lost.',
        handlerSubsegment.name,
        new Error('dummy error')
      );
      // Check that the segment is restored
      expect(setSegmentSpy).toHaveBeenNthCalledWith(2, mainSegment);
    });

    it('does not trace untraced routes', async () => {
      // Prepare
      const tracer = new Tracer();
      const annotateColdStartSpy = vi.spyOn(tracer, 'annotateColdStart');
      const addServiceNameAnnotationSpy = vi.spyOn(
        tracer,
        'addServiceNameAnnotation'
      );

      app.get('/traced', [tracerMiddleware(tracer)], () => ({
        traced: true,
      }));
      app.get('/untraced', () => ({ traced: false }));

      // Act
      await app.resolve(createTestEvent('/traced', 'GET'), context);
      await app.resolve(createTestEvent('/untraced', 'GET'), context);

      // Assess
      expect(annotateColdStartSpy).toHaveBeenCalledTimes(1);
      expect(addServiceNameAnnotationSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('when in streaming mode', () => {
    it('skips tracing entirely', async () => {
      // Prepare
      const tracer = new Tracer();
      const setSegmentSpy = vi.spyOn(tracer, 'setSegment');
      const getSegmentSpy = vi.spyOn(tracer, 'getSegment');

      app.use(tracerMiddleware(tracer));
      app.get('/test', async () => ({ success: true }));
      const responseStream = new ResponseStream();

      // Act
      await app.resolveStream(createTestEvent('/test', 'GET'), context, {
        responseStream,
      });

      // Assess
      expect(setSegmentSpy).toHaveBeenCalledTimes(0);
      expect(getSegmentSpy).toHaveBeenCalledTimes(0);
    });
  });
});
