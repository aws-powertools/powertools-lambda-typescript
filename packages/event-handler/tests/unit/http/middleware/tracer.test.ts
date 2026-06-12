import context from '@aws-lambda-powertools/testing-utils/context';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { Segment, Subsegment } from 'aws-xray-sdk-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { tracer as tracerMiddleware } from '../../../../src/http/middleware/tracer.js';
import { Router } from '../../../../src/http/Router.js';
import {
  createTestALBEvent,
  createTestEvent,
  createTestEventV2,
  ResponseStream,
} from '../helpers.js';

type HttpData = {
  request: {
    method: string;
    url: string;
    user_agent?: string;
    client_ip?: string;
    x_forwarded_for?: boolean;
  };
  response?: {
    status: number;
    content_length?: number;
  };
};

const getHttpData = (subsegment: Subsegment): HttpData | undefined =>
  (subsegment as Subsegment & { http?: HttpData }).http;


describe('Tracer Middleware', () => {
  let app: Router;

  beforeEach(() => {
    vi.clearAllMocks();
    app = new Router();
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
      vi.spyOn(tracer, 'getSegment').mockImplementation(
        () => new Segment('main')
      );
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
      const addResponseSpy = vi.spyOn(tracer, 'addResponseAsMetadata');

      app.use(tracerMiddleware(tracer));
      app.get('/test', () => ({ foo: 'bar' }));

      // Act
      await app.resolve(createTestEvent('/test', 'GET'), context);

      // Assess
      expect(addResponseSpy).toHaveBeenCalledTimes(1);
      expect(addResponseSpy).toHaveBeenCalledWith(
        {
          foo: 'bar',
        },
        'GET /test'
      );
    });

    it('does not capture response when `captureResponse` is false', async () => {
      // Prepare
      const tracer = new Tracer();
      vi.spyOn(tracer, 'setSegment').mockImplementation(() => null);
      vi.spyOn(tracer, 'getSegment')
        .mockImplementationOnce(() => new Segment('main'))
        .mockImplementation(() => new Subsegment('GET /test'));
      const addResponseSpy = vi.spyOn(tracer, 'addResponseAsMetadata');

      app.use(tracerMiddleware(tracer, { captureResponse: false }));
      app.get('/test', () => ({ foo: 'bar' }));

      // Act
      await app.resolve(createTestEvent('/test', 'GET'), context);

      // Assess
      expect(addResponseSpy).toHaveBeenCalledTimes(0);
    });

    it('does not capture non-JSON responses', async () => {
      // Prepare
      const tracer = new Tracer();
      vi.spyOn(tracer, 'setSegment').mockImplementation(() => null);
      vi.spyOn(tracer, 'getSegment')
        .mockImplementationOnce(() => new Segment('main'))
        .mockImplementation(() => new Subsegment('GET /test'));
      const addResponseSpy = vi.spyOn(tracer, 'addResponseAsMetadata');

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
      expect(addResponseSpy).toHaveBeenCalledTimes(0);
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
      const addErrorSpy = vi.spyOn(tracer, 'addErrorAsMetadata');
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
      expect(addErrorSpy).toHaveBeenCalledWith(testError);
    });

    it('closes subsegment even when handler throws', async () => {
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
      app.get('/test', () => {
        throw new Error('Test error');
      });

      // Act
      await app.resolve(createTestEvent('/test', 'GET'), context);

      // Assess
      expect(handlerSubsegment.isClosed()).toBe(true);
      expect(setSegmentSpy).toHaveBeenCalledTimes(2);
      expect(setSegmentSpy).toHaveBeenNthCalledWith(1, handlerSubsegment);
      expect(setSegmentSpy).toHaveBeenNthCalledWith(2, mainSegment);
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
      const closeError = new Error('dummy error');
      const closeSpy = vi
        .spyOn(handlerSubsegment, 'close')
        .mockImplementation(() => {
          throw closeError;
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
        closeError
      );
      // Check that the segment is restored
      expect(setSegmentSpy).toHaveBeenNthCalledWith(2, mainSegment);
    });

    it('uses the provided logger option to log a warning when the segment closing fails', async () => {
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
      vi.spyOn(tracer, 'setSegment').mockImplementation(() => null);
      const logger = {
        warn: vi.fn(),
        debug: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
      };
      const consoleWarnSpy = vi.spyOn(console, 'warn');
      const closeError = new Error('dummy error');
      vi.spyOn(handlerSubsegment, 'close').mockImplementation(() => {
        throw closeError;
      });

      app.use(tracerMiddleware(tracer, { logger }));
      app.get('/test', async () => ({ success: true }));

      // Act
      await app.resolve(createTestEvent('/test', 'GET'), context);

      // Assess
      expect(logger.warn).toHaveBeenNthCalledWith(
        1,
        'Failed to close or serialize segment %s. Data might be lost.',
        handlerSubsegment.name,
        closeError
      );
      expect(consoleWarnSpy).toHaveBeenCalledTimes(0);
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

  describe('when populating the http field', () => {
    it('adds request and response data to the subsegment', async () => {
      // Prepare
      const tracer = new Tracer();
      const mainSegment = new Segment('main');
      const handlerSubsegment = new Subsegment('GET /test');
      vi.spyOn(mainSegment, 'addNewSubsegment').mockReturnValue(
        handlerSubsegment
      );
      vi.spyOn(tracer, 'setSegment').mockImplementation(() => null);
      vi.spyOn(tracer, 'getSegment').mockReturnValue(mainSegment);

      app.use(tracerMiddleware(tracer));
      app.get(
        '/test',
        () =>
          new Response(JSON.stringify({ success: true }), {
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': '17',
            },
          })
      );

      // Act
      await app.resolve(createTestEvent('/test', 'GET'), context);

      // Assess
      expect(getHttpData(handlerSubsegment)).toEqual({
        request: {
          method: 'GET',
          url: 'https://api.example.com/test',
          client_ip: '192.0.2.1',
        },
        response: {
          status: 200,
          content_length: 17,
        },
      });
    });

    it('adds the user agent when the User-Agent header is present', async () => {
      // Prepare
      const tracer = new Tracer();
      const mainSegment = new Segment('main');
      const handlerSubsegment = new Subsegment('GET /test');
      vi.spyOn(mainSegment, 'addNewSubsegment').mockReturnValue(
        handlerSubsegment
      );
      vi.spyOn(tracer, 'setSegment').mockImplementation(() => null);
      vi.spyOn(tracer, 'getSegment').mockReturnValue(mainSegment);

      app.use(tracerMiddleware(tracer));
      app.get('/test', () => ({ success: true }));

      // Act
      await app.resolve(
        createTestEvent('/test', 'GET', { 'User-Agent': 'curl/8.7.1' }),
        context
      );

      // Assess
      expect(getHttpData(handlerSubsegment)?.request.user_agent).toBe(
        'curl/8.7.1'
      );
    });

    it('sets x_forwarded_for and resolves client_ip from the header for ALB events', async () => {
      // Prepare
      const tracer = new Tracer();
      const mainSegment = new Segment('main');
      const handlerSubsegment = new Subsegment('GET /test');
      vi.spyOn(mainSegment, 'addNewSubsegment').mockReturnValue(
        handlerSubsegment
      );
      vi.spyOn(tracer, 'setSegment').mockImplementation(() => null);
      vi.spyOn(tracer, 'getSegment').mockReturnValue(mainSegment);

      app.use(tracerMiddleware(tracer));
      app.get('/test', () => ({ success: true }));

      // Act
      await app.resolve(
        createTestALBEvent('/test', 'GET', {
          'X-Forwarded-For': '203.0.113.1, 198.51.100.2',
        }),
        context
      );

      // Assess
      const request = getHttpData(handlerSubsegment)?.request;
      expect(request?.client_ip).toBe('203.0.113.1');
      expect(request?.x_forwarded_for).toBe(true);
    });

    it('omits client_ip for ALB events without an X-Forwarded-For header', async () => {
      // Prepare
      const tracer = new Tracer();
      const mainSegment = new Segment('main');
      const handlerSubsegment = new Subsegment('GET /test');
      vi.spyOn(mainSegment, 'addNewSubsegment').mockReturnValue(
        handlerSubsegment
      );
      vi.spyOn(tracer, 'setSegment').mockImplementation(() => null);
      vi.spyOn(tracer, 'getSegment').mockReturnValue(mainSegment);

      app.use(tracerMiddleware(tracer));
      app.get('/test', () => ({ success: true }));

      // Act
      await app.resolve(createTestALBEvent('/test', 'GET'), context);

      // Assess
      const request = getHttpData(handlerSubsegment)?.request;
      expect(request?.client_ip).toBeUndefined();
      expect(request?.x_forwarded_for).toBeUndefined();
    });

    it('resolves client_ip from the request context for API Gateway v2 events', async () => {
      // Prepare
      const tracer = new Tracer();
      const mainSegment = new Segment('main');
      const handlerSubsegment = new Subsegment('GET /test');
      vi.spyOn(mainSegment, 'addNewSubsegment').mockReturnValue(
        handlerSubsegment
      );
      vi.spyOn(tracer, 'setSegment').mockImplementation(() => null);
      vi.spyOn(tracer, 'getSegment').mockReturnValue(mainSegment);

      app.use(tracerMiddleware(tracer));
      app.get('/test', () => ({ success: true }));

      // Act
      await app.resolve(createTestEventV2('/test', 'GET'), context);

      // Assess
      expect(getHttpData(handlerSubsegment)?.request.client_ip).toBe(
        '127.0.0.1'
      );
    });

    it('omits content_length when the Content-Length header is missing', async () => {
      // Prepare
      const tracer = new Tracer();
      const mainSegment = new Segment('main');
      const handlerSubsegment = new Subsegment('GET /test');
      vi.spyOn(mainSegment, 'addNewSubsegment').mockReturnValue(
        handlerSubsegment
      );
      vi.spyOn(tracer, 'setSegment').mockImplementation(() => null);
      vi.spyOn(tracer, 'getSegment').mockReturnValue(mainSegment);

      app.use(tracerMiddleware(tracer));
      app.get('/test', () => ({ success: true }));

      // Act
      await app.resolve(createTestEvent('/test', 'GET'), context);

      // Assess
      expect(getHttpData(handlerSubsegment)?.response).toEqual({
        status: 200,
      });
    });

    it('omits content_length when the Content-Length header is not a number', async () => {
      // Prepare
      const tracer = new Tracer();
      const mainSegment = new Segment('main');
      const handlerSubsegment = new Subsegment('GET /test');
      vi.spyOn(mainSegment, 'addNewSubsegment').mockReturnValue(
        handlerSubsegment
      );
      vi.spyOn(tracer, 'setSegment').mockImplementation(() => null);
      vi.spyOn(tracer, 'getSegment').mockReturnValue(mainSegment);

      app.use(tracerMiddleware(tracer));
      app.get(
        '/test',
        () =>
          new Response(JSON.stringify({ success: true }), {
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': 'not-a-number',
            },
          })
      );

      // Act
      await app.resolve(createTestEvent('/test', 'GET'), context);

      // Assess
      expect(
        getHttpData(handlerSubsegment)?.response?.content_length
      ).toBeUndefined();
    });
  });

  describe('when in streaming mode', () => {
    it('skips tracing entirely', async () => {
      // Prepare
      const tracer = new Tracer();
      const setSegmentSpy = vi.spyOn(tracer, 'setSegment');
      const getSegmentSpy = vi.spyOn(tracer, 'getSegment');
      const annotateColdStartSpy = vi.spyOn(tracer, 'annotateColdStart');
      const addServiceNameAnnotationSpy = vi.spyOn(
        tracer,
        'addServiceNameAnnotation'
      );

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
      expect(annotateColdStartSpy).toHaveBeenCalledTimes(0);
      expect(addServiceNameAnnotationSpy).toHaveBeenCalledTimes(0);
    });
  });
});
