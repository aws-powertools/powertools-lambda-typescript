/**
 * Test Logger formatter
 *
 * @group unit/logger/logFormatter
 */
import { AssertionError } from 'node:assert';
import { EnvironmentVariablesService } from '../../../src/config/EnvironmentVariablesService.js';
import { PowertoolsLogFormatter } from '../../../src/formatter/PowertoolsLogFormatter.js';
import { LogItem } from '../../../src/index.js';
import type { LogAttributes } from '../../../src/types/Log.js';
import type { UnformattedAttributes } from '../../../src/types/Logger.js';

describe('Class: PowertoolsLogFormatter', () => {
  const ENVIRONMENT_VARIABLES = process.env;

  beforeEach(() => {
    const mockDate = new Date(1466424490000);
    jest.useFakeTimers().setSystemTime(mockDate);
    process.env = { ...ENVIRONMENT_VARIABLES };
  });

  afterAll(() => {
    process.env = ENVIRONMENT_VARIABLES;
    jest.useRealTimers();
  });

  describe('Method: formatAttributes', () => {
    test('when optional parameters DO NOT have a value set, it returns an object with expected structure and values', () => {
      // Prepare
      const formatter = new PowertoolsLogFormatter();
      const unformattedAttributes: UnformattedAttributes = {
        sampleRateValue: 0,
        awsRegion: 'eu-west-1',
        environment: '',
        serviceName: 'hello-world',
        xRayTraceId: '1-5759e988-bd862e3fe1be46a994272793',
        logLevel: 'WARN',
        timestamp: new Date(),
        message: 'This is a WARN log',
      };
      const additionalLogAttributes: LogAttributes = {};

      // Act
      const value = formatter.formatAttributes(
        unformattedAttributes,
        additionalLogAttributes
      );

      // Assess
      expect(value.getAttributes()).toEqual({
        cold_start: undefined,
        function_arn: undefined,
        function_memory_size: undefined,
        function_name: undefined,
        function_request_id: undefined,
        level: 'WARN',
        message: 'This is a WARN log',
        sampling_rate: 0,
        service: 'hello-world',
        timestamp: '2016-06-20T12:08:10.000Z',
        xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
      });
      expect(value).toBeInstanceOf(LogItem);
    });

    test('when optional parameters DO have a value set, it returns an object with expected structure and values', () => {
      // Prepare
      const formatter = new PowertoolsLogFormatter();
      const unformattedAttributes: UnformattedAttributes = {
        sampleRateValue: 0.25,
        awsRegion: 'eu-west-1',
        environment: 'prod',
        serviceName: 'hello-world',
        xRayTraceId: '1-5759e988-bd862e3fe1be46a994272793',
        logLevel: 'WARN',
        timestamp: new Date(),
        message: 'This is a WARN log',
        error: new Error('Something happened!'),
        lambdaContext: {
          functionName: 'my-lambda-function',
          memoryLimitInMB: '123',
          functionVersion: '1.23.3',
          coldStart: true,
          invokedFunctionArn:
            'arn:aws:lambda:eu-west-1:123456789012:function:Example',
          awsRequestId: 'abcdefg123456789',
        },
      };
      const additionalLogAttributes: LogAttributes = {};

      // Act
      const value = formatter.formatAttributes(
        unformattedAttributes,
        additionalLogAttributes
      );

      // Assess
      expect(value.getAttributes()).toEqual({
        cold_start: true,
        function_arn: 'arn:aws:lambda:eu-west-1:123456789012:function:Example',
        function_memory_size: '123',
        function_name: 'my-lambda-function',
        function_request_id: 'abcdefg123456789',
        level: 'WARN',
        message: 'This is a WARN log',
        sampling_rate: 0.25,
        service: 'hello-world',
        timestamp: '2016-06-20T12:08:10.000Z',
        xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
      });
    });
  });

  describe('Method: formatError', () => {
    test('when an error of type Error is passed, it returns an object with expected structure and values', () => {
      // Prepare
      const formatter = new PowertoolsLogFormatter();

      // Act & Assess
      const formattedError = formatter.formatError(new Error('Ouch!'));
      expect(formattedError).toEqual({
        location: expect.stringMatching(/PowertoolsLogFormatter.test.ts:\d+$/),
        message: 'Ouch!',
        name: 'Error',
        stack: expect.stringMatching(/PowertoolsLogFormatter.test.ts:\d+:\d+/),
      });
    });

    test('when an error of type ReferenceError is passed, it returns an object with expected structure and values', () => {
      // Prepare
      const formatter = new PowertoolsLogFormatter();

      // Act & Assess
      const formattedReferenceError = formatter.formatError(
        new ReferenceError('doesNotExist is not defined')
      );
      expect(formattedReferenceError).toEqual({
        location: expect.stringMatching(/PowertoolsLogFormatter.test.ts:\d+$/),
        message: 'doesNotExist is not defined',
        name: 'ReferenceError',
        stack: expect.stringMatching(/PowertoolsLogFormatter.test.ts:\d+:\d+/),
      });
    });

    test('when an error of type AssertionError is passed, it returns an object with expected structure and values', () => {
      // Prepare
      const formatter = new PowertoolsLogFormatter();

      // Act & Assess
      const formattedAssertionError = formatter.formatError(
        new AssertionError({
          message: 'Expected values to be strictly equal',
          actual: 1,
          expected: 2,
          operator: 'strictEqual',
        })
      );
      expect(formattedAssertionError).toEqual({
        location: expect.stringMatching(
          /(node:)*internal\/assert\/assertion_error(.js)*:\d+$/
        ),
        message: expect.stringMatching(/Expected values to be strictly equal/),
        name: 'AssertionError',
        stack: expect.stringMatching(/PowertoolsLogFormatter.test.ts:\d+:\d+/),
      });
    });

    test('when an error of type RangeError is passed, it returns an object with expected structure and values', () => {
      // Prepare
      const formatter = new PowertoolsLogFormatter();

      // Act & Assess
      const formattedRangeError = formatter.formatError(
        new RangeError('The argument must be between 10 and 20')
      );
      expect(formattedRangeError).toEqual({
        location: expect.stringMatching(/PowertoolsLogFormatter.test.ts:\d+/),
        message: 'The argument must be between 10 and 20',
        name: 'RangeError',
        stack: expect.stringMatching(/PowertoolsLogFormatter.test.ts:\d+:\d+/),
      });
    });

    test('when an error of type ReferenceError is passed, it returns an object with expected structure and values', () => {
      // Prepare
      const formatter = new PowertoolsLogFormatter();

      // Act & Assess
      const formattedError = formatter.formatError(
        new ReferenceError('foo is not defined')
      );
      expect(formattedError).toEqual({
        location: expect.stringMatching(/PowertoolsLogFormatter.test.ts:\d+/),
        message: 'foo is not defined',
        name: 'ReferenceError',
        stack: expect.stringMatching(/PowertoolsLogFormatter.test.ts:\d+:\d+/),
      });
    });

    test('when an error of type SyntaxError is passed, it returns an object with expected structure and values', () => {
      // Prepare
      const formatter = new PowertoolsLogFormatter();

      // Act & Assess
      const formattedSyntaxError = formatter.formatError(
        new SyntaxError(`Unexpected identifier 'bar'`)
      );
      expect(formattedSyntaxError).toEqual({
        location: expect.stringMatching(/PowertoolsLogFormatter.test.ts:\d+/),
        message: `Unexpected identifier 'bar'`,
        name: 'SyntaxError',
        stack: expect.stringMatching(/PowertoolsLogFormatter.test.ts:\d+:\d+/),
      });
    });

    test('when an error of type TypeError is passed, it returns an object with expected structure and values', () => {
      // Prepare
      const formatter = new PowertoolsLogFormatter();

      // Act & Assess
      const formattedTypeError = formatter.formatError(
        new TypeError(`Cannot read property 'foo' of null`)
      );
      expect(formattedTypeError).toEqual({
        location: expect.stringMatching(/PowertoolsLogFormatter.test.ts:\d+/),
        message: expect.stringMatching(/Cannot read propert/),
        name: 'TypeError',
        stack: expect.stringMatching(/PowertoolsLogFormatter.test.ts:\d+:\d+/),
      });
    });

    test('when an error of type URIError is passed, it returns an object with expected structure and values', () => {
      // Prepare
      const formatter = new PowertoolsLogFormatter();

      // Act & Assess
      const formattedURIError = formatter.formatError(
        new URIError('URI malformed')
      );
      expect(formattedURIError).toEqual({
        location: expect.stringMatching(/PowertoolsLogFormatter.test.ts:\d+/),
        message: 'URI malformed',
        name: 'URIError',
        stack: expect.stringMatching(/PowertoolsLogFormatter.test.ts:\d+:\d+/),
      });
    });

    test('when an error with cause of type Error is formatted, the cause key is included and formatted', () => {
      // Prepare
      const formatter = new PowertoolsLogFormatter();
      class ErrorWithCause extends Error {
        public cause?: Error;
        public constructor(message: string, options?: { cause: Error }) {
          super(message);
          this.cause = options?.cause;
        }
      }

      // Act
      const formattedURIError = formatter.formatError(
        new ErrorWithCause('foo', { cause: new Error('bar') })
      );

      // Assess
      expect(formattedURIError).toEqual({
        location: expect.stringMatching(/PowertoolsLogFormatter.test.ts:\d+/),
        message: 'foo',
        name: 'Error',
        stack: expect.stringMatching(/PowertoolsLogFormatter.test.ts:\d+:\d+/),
        cause: {
          location: expect.stringMatching(/PowertoolsLogFormatter.test.ts:\d+/),
          message: 'bar',
          name: 'Error',
          stack: expect.stringMatching(
            /PowertoolsLogFormatter.test.ts:\d+:\d+/
          ),
        },
      });
    });

    test('when an error with cause of type other than Error is formatted, the cause key is included as-is', () => {
      // Prepare
      const formatter = new PowertoolsLogFormatter();
      class ErrorWithCause extends Error {
        public cause?: unknown;
        public constructor(message: string, options?: { cause: unknown }) {
          super(message);
          this.cause = options?.cause;
        }
      }

      // Act
      const formattedURIError = formatter.formatError(
        new ErrorWithCause('foo', { cause: 'bar' })
      );

      // Assess
      expect(formattedURIError).toEqual({
        location: expect.stringMatching(/PowertoolsLogFormatter.test.ts:\d+/),
        message: 'foo',
        name: 'Error',
        stack: expect.stringMatching(/PowertoolsLogFormatter.test.ts:\d+:\d+/),
        cause: 'bar',
      });
    });
  });

  describe('Method: formatTimestamp', () => {
    test('it returns a datetime value ISO 8601 compliant', () => {
      // Prepare
      const formatter = new PowertoolsLogFormatter();

      // Act
      const timestamp = formatter.formatTimestamp(new Date());

      // Assess
      expect(timestamp).toEqual('2016-06-20T12:08:10.000Z');
    });

    test('it formats the timestamp to ISO 8601, accounting for the `America/New_York` timezone offset', () => {
      // Prepare
      process.env.TZ = 'America/New_York';
      /*
        Difference between UTC and `America/New_York`(GMT -04.00) is 240 minutes.
        The positive value indicates that `America/New_York` is behind UTC.
      */
      jest.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(240);
      const formatter = new PowertoolsLogFormatter({
        envVarsService: new EnvironmentVariablesService(),
      });

      // Act
      const timestamp = formatter.formatTimestamp(new Date());

      // Assess
      expect(timestamp).toEqual('2016-06-20T08:08:10.000-04:00');
    });

    test('it formats the timestamp to ISO 8601 with correct milliseconds for `America/New_York` timezone', () => {
      // Prepare
      process.env.TZ = 'America/New_York';
      const mockDate = new Date('2016-06-20T12:08:10.910Z');
      jest.useFakeTimers().setSystemTime(mockDate);
      /*
        Difference between UTC and `America/New_York`(GMT -04.00) is 240 minutes.
        The positive value indicates that `America/New_York` is behind UTC.
      */
      jest.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(240);
      const formatter = new PowertoolsLogFormatter({
        envVarsService: new EnvironmentVariablesService(),
      });

      // Act
      const timestamp = formatter.formatTimestamp(new Date());

      // Assess
      expect(timestamp).toEqual('2016-06-20T08:08:10.910-04:00');
    });

    test('it formats the timestamp to ISO 8601, adjusting for `America/New_York` timezone, preserving milliseconds and accounting for date change', () => {
      // Prepare
      process.env.TZ = 'America/New_York';
      const mockDate = new Date('2016-06-20T00:08:10.910Z');
      jest.useFakeTimers().setSystemTime(mockDate);
      /*
        Difference between UTC and `America/New_York`(GMT -04.00) is 240 minutes.
        The positive value indicates that `America/New_York` is behind UTC.
      */
      jest.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(240);
      const formatter = new PowertoolsLogFormatter({
        envVarsService: new EnvironmentVariablesService(),
      });

      // Act
      const timestamp = formatter.formatTimestamp(new Date());

      // Assess
      expect(timestamp).toEqual('2016-06-19T20:08:10.910-04:00');
    });

    test('if `envVarsService` is not set, ensures timestamp is formatted to `UTC` even with `America/New_York` timezone', () => {
      // Prepare
      process.env.TZ = 'America/New_York';
      /*
        Difference between UTC and `America/New_York`(GMT -04.00) is 240 minutes.
        The positive value indicates that `America/New_York` is behind UTC.
      */
      jest.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(240);
      const formatter = new PowertoolsLogFormatter();

      // Act
      const timestamp = formatter.formatTimestamp(new Date());

      // Assess
      expect(timestamp).toEqual('2016-06-20T12:08:10.000Z');
    });

    test('it formats the timestamp to ISO 8601, accounting for the `Asia/Dhaka` timezone offset', () => {
      // Prepare
      process.env.TZ = 'Asia/Dhaka';
      /*
        Difference between UTC and `Asia/Dhaka`(GMT +06.00) is 360 minutes.
        The negative value indicates that `Asia/Dhaka` is ahead of UTC.
      */
      jest.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(-360);
      const formatter = new PowertoolsLogFormatter({
        envVarsService: new EnvironmentVariablesService(),
      });

      // Act
      const timestamp = formatter.formatTimestamp(new Date());

      // Assess
      expect(timestamp).toEqual('2016-06-20T18:08:10.000+06:00');
    });

    test('it formats the timestamp to ISO 8601 with correct milliseconds for `Asia/Dhaka` timezone', () => {
      // Prepare
      process.env.TZ = 'Asia/Dhaka';
      jest.useFakeTimers().setSystemTime(new Date('2016-06-20T12:08:10.910Z'));
      /*
        Difference between UTC and `Asia/Dhaka`(GMT +06.00) is 360 minutes.
        The negative value indicates that `Asia/Dhaka` is ahead of UTC.
      */
      jest.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(-360);
      const formatter = new PowertoolsLogFormatter({
        envVarsService: new EnvironmentVariablesService(),
      });

      // Act
      const timestamp = formatter.formatTimestamp(new Date());

      // Assess
      expect(timestamp).toEqual('2016-06-20T18:08:10.910+06:00');
    });

    test('it formats the timestamp to ISO 8601, adjusting for `Asia/Dhaka` timezone, preserving milliseconds and accounting for date change', () => {
      // Prepare
      process.env.TZ = 'Asia/Dhaka';
      const mockDate = new Date('2016-06-20T20:08:10.910Z');
      jest.useFakeTimers().setSystemTime(mockDate);
      /*
        Difference between UTC and `Asia/Dhaka`(GMT +06.00) is 360 minutes.
        The negative value indicates that `Asia/Dhaka` is ahead of UTC.
      */
      jest.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(-360);
      const formatter = new PowertoolsLogFormatter({
        envVarsService: new EnvironmentVariablesService(),
      });

      // Act
      const timestamp = formatter.formatTimestamp(new Date());

      // Assess
      expect(timestamp).toEqual('2016-06-21T02:08:10.910+06:00');
    });

    test('if `envVarsService` is not set, ensures timestamp is formatted to `UTC` even with `Asia/Dhaka` timezone', () => {
      // Prepare
      process.env.TZ = 'Asia/Dhaka';
      /*
        Difference between UTC and `Asia/Dhaka`(GMT +06.00) is 360 minutes.
        The negative value indicates that `Asia/Dhaka` is ahead of UTC.
      */
      jest.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(-360);
      const formatter = new PowertoolsLogFormatter();

      // Act
      const timestamp = formatter.formatTimestamp(new Date());

      // Assess
      expect(timestamp).toEqual('2016-06-20T12:08:10.000Z');
    });

    test('it is using UTC timezone when env var is set to :/etc/localtime', () => {
      // Prepare
      process.env.TZ = ':/etc/localtime';

      jest.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(0);
      const formatter = new PowertoolsLogFormatter({
        envVarsService: new EnvironmentVariablesService(),
      });

      // Act
      const timestamp = formatter.formatTimestamp(new Date());

      // Assess
      expect(timestamp).toEqual('2016-06-20T12:08:10.000+00:00');
    });
  });

  describe('Method: getCodeLocation', () => {
    test.each([
      {
        condition: 'stack IS present',
        returnExpection:
          'it returns a location for a stackframe with absolute file path',
        stack:
          'Error: Things keep happening!\n' +
          '   at /home/foo/bar/file-that-threw-the-error.ts:22:5\n' +
          '   at SomeOther.function (/home/foo/bar/some-file.ts:154:19)',
        expectedLocation: '/home/foo/bar/some-file.ts:154',
      },
      {
        condition: 'stack IS present',
        returnExpection:
          'it returns a location for a stackframe ending with an optional backslash',
        stack:
          'Error: Reference Error!\n' +
          '   at /home/foo/bar/file-that-threw-the-error.ts:22:5\n' +
          '   at SomeOther.function (/home/foo/bar/some-frame-with-ending-backslash.ts:154:19)\\',
        expectedLocation:
          '/home/foo/bar/some-frame-with-ending-backslash.ts:154',
      },
      {
        condition: 'stack IS present',
        returnExpection:
          'it returns a location for a path containing multiple colons',
        stack:
          'Error: The message failed to send\n' +
          'at REPL2:1:17\n' +
          'at Script.runInThisContext (node:vm:130:12)\n' +
          '... 7 lines matching cause stack trace ...\n' +
          'at [_line] [as _line] (node:internal/readline/interface:886:18) {\n' +
          '[cause]: Error: The remote HTTP server responded with a 500 status\n' +
          '  at REPL1:1:15\n' +
          '  at Script.runInThisContext (node:vm:130:12)\n' +
          '  at REPLServer.defaultEval (node:repl:574:29)\n' +
          '  at bound (node:domain:426:15)\n' +
          '  at REPLServer.runBound [as eval] (node:domain:437:12)\n' +
          '  at REPLServer.onLine (node:repl:902:10)\n' +
          '  at REPLServer.emit (node:events:549:35)\n' +
          '  at REPLServer.emit (node:domain:482:12)\n' +
          '  at [_onLine] [as _onLine] (node:internal/readline/interface:425:12)\n' +
          '  at [_line] [as _line] (node:internal/readline/interface:886:18)  \n',
        expectedLocation: 'node:vm:130',
      },
      {
        condition: 'stack IS present',
        returnExpection: 'it returns a location for a nested path',
        stack:
          'Error: unknown\n' +
          'at eval (eval at <anonymous> (file:///home/foo/bar/some-file.ts:1:35), <anonymous>:1:7)\n' +
          'at <anonymous> (/home/foo/bar/file-that-threw-the-error.ts:52:3)\n' +
          'at ModuleJob.run (node:internal/modules/esm/module_job:218:25)\n' +
          'at async ModuleLoader.import (node:internal/modules/esm/loader:329:24)\n' +
          'at async loadESM (node:internal/process/esm_loader:28:7)\n' +
          'at async handleMainPromise (node:internal/modules/run_main:113:12)\n',
        expectedLocation: '/home/foo/bar/file-that-threw-the-error.ts:52',
      },
      {
        condition: 'stack IS NOT present',
        returnExpection: 'it returns an empty location',
        stack: undefined,
        expectedLocation: '',
      },
      {
        condition: 'stack IS present',
        returnExpection:
          'if a stackframe does not have a location, it returns an empty location',
        stack: 'A weird stack trace...',
        expectedLocation: '',
      },
    ])(
      'when the $condition, $returnExpection',
      ({ stack, expectedLocation }) => {
        // Prepare
        const formatter = new PowertoolsLogFormatter();

        // Act
        const errorLocation = formatter.getCodeLocation(stack);

        // Assess
        expect(errorLocation).toEqual(expectedLocation);
      }
    );
  });
});
