import { AssertionError } from 'node:assert';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { EnvironmentVariablesService } from '../../src/config/EnvironmentVariablesService.js';
import { PowertoolsLogFormatter } from '../../src/formatter/PowertoolsLogFormatter.js';
import {
  LogFormatter,
  LogItem,
  LogLevelThreshold,
  Logger,
} from '../../src/index.js';
import type {
  CustomJsonReplacerFn,
  LogAttributes,
  LogLevel,
} from '../../src/types/Logger.js';
import type { LogKey, UnformattedAttributes } from '../../src/types/logKeys.js';

const fileNameRegexp = new RegExp(/index.js:\d+$/);
const fileNameRegexpWithLine = new RegExp(/formatters.test.ts:\d+:\d+/);
const formatter = new PowertoolsLogFormatter();
const formatterWithEnv = new PowertoolsLogFormatter({
  envVarsService: new EnvironmentVariablesService(),
});

class ErrorWithCause extends Error {
  public constructor(message: string, options?: { cause: unknown }) {
    super(message, options);
    this.name = 'ErrorWithCause';
  }
}
class ErrorWithCauseString extends Error {
  public constructor(message: string, options?: { cause: string }) {
    super(message, options);
    this.name = 'ErrorWithCauseString';
  }
}

/**
 * Unformatted attributes for testing
 */
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

process.env.POWERTOOLS_DEV = 'true';

const logger = new Logger();

const jsonReplacerFn: CustomJsonReplacerFn = (_: string, value: unknown) =>
  value instanceof Set ? [...value] : value;
const loggerWithReplacer = new Logger({ jsonReplacerFn });

/**
 * A custom log formatter that formats logs using only the message, log level as a number, and timestamp.
 *
 * @example
 * ```json
 * {
 *   "message": "This is a WARN log",
 *   "logLevel": 16,
 *   "timestamp": "2016-06-20T12:08:10.000Z"
 * }
 * ```
 */
class CustomFormatter extends LogFormatter {
  public formatAttributes(
    attributes: UnformattedAttributes,
    additionalLogAttributes: LogAttributes
  ): LogItem {
    const { message, logLevel, timestamp } = attributes;
    const customAttributes = {
      message,
      logLevel:
        LogLevelThreshold[logLevel.toUpperCase() as Uppercase<LogLevel>],
      timestamp,
    };
    return new LogItem({ attributes: customAttributes }).addAttributes(
      additionalLogAttributes
    );
  }
}
const loggerWithCustomLogFormatter = new Logger({
  logFormatter: new CustomFormatter(),
});

describe('Formatters', () => {
  const ENVIRONMENT_VARIABLES = process.env;

  beforeEach(() => {
    process.env = { ...ENVIRONMENT_VARIABLES };
    const mockDate = new Date(1466424490000);
    vi.useFakeTimers().setSystemTime(mockDate);
    vi.clearAllMocks();
    unformattedAttributes.timestamp = mockDate;
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  // #region base log keys

  it('formats the base log keys', () => {
    // Prepare
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

  // #region base log keys with context

  it('formats the base log keys with context', () => {
    // Prepare
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

  it('when `logRecordOrder` is set, it orders the attributes in the log item', () => {
    // Prepare
    const formatter = new PowertoolsLogFormatter({
      logRecordOrder: ['message', 'timestamp', 'serviceName', 'environment'],
    });
    const additionalLogAttributes: LogAttributes = {};

    // Act
    const value = formatter.formatAttributes(
      unformattedAttributes,
      additionalLogAttributes
    );

    const response = value.getAttributes();

    // Assess
    expect(JSON.stringify(response)).toEqual(
      JSON.stringify({
        message: 'This is a WARN log',
        timestamp: '2016-06-20T12:08:10.000Z',
        cold_start: true,
        function_arn: 'arn:aws:lambda:eu-west-1:123456789012:function:Example',
        function_memory_size: '123',
        function_name: 'my-lambda-function',
        function_request_id: 'abcdefg123456789',
        level: 'WARN',
        sampling_rate: 0.25,
        service: 'hello-world',
        xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
      })
    );
  });

  it('when `logRecordOrder` is set, it orders the attributes in the log item taking `additionalLogAttributes` into consideration', () => {
    // Prepare
    const formatter = new PowertoolsLogFormatter({
      logRecordOrder: new Set<LogKey>([
        'message',
        'additional_key',
        'timestamp',
        'serviceName',
        'environment',
      ]),
    });
    const additionalLogAttributes: LogAttributes = {
      additional_key: 'additional_value',
      another_key: 'another_value',
    };

    // Act
    const value = formatter.formatAttributes(
      unformattedAttributes,
      additionalLogAttributes
    );

    const response = value.getAttributes();

    // Assess
    expect(JSON.stringify(response)).toEqual(
      JSON.stringify({
        message: 'This is a WARN log',
        additional_key: 'additional_value',
        timestamp: '2016-06-20T12:08:10.000Z',
        cold_start: true,
        function_arn: 'arn:aws:lambda:eu-west-1:123456789012:function:Example',
        function_memory_size: '123',
        function_name: 'my-lambda-function',
        function_request_id: 'abcdefg123456789',
        level: 'WARN',
        sampling_rate: 0.25,
        service: 'hello-world',
        xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
        another_key: 'another_value',
      })
    );
  });

  it('when `logRecordOrder` is set, even if a key does not exist in attributes, it orders the attributes correctly', () => {
    // Prepare
    const formatter = new PowertoolsLogFormatter({
      logRecordOrder: [
        'message',
        'additional_key',
        'not_present',
        'timestamp',
        'serviceName',
        'environment',
      ],
    });
    const additionalLogAttributes: LogAttributes = {
      additional_key: 'additional_value',
    };

    // Act
    const value = formatter.formatAttributes(
      unformattedAttributes,
      additionalLogAttributes
    );

    const response = value.getAttributes();

    // Assess
    expect(JSON.stringify(response)).toEqual(
      JSON.stringify({
        message: 'This is a WARN log',
        additional_key: 'additional_value',
        timestamp: '2016-06-20T12:08:10.000Z',
        cold_start: true,
        function_arn: 'arn:aws:lambda:eu-west-1:123456789012:function:Example',
        function_memory_size: '123',
        function_name: 'my-lambda-function',
        function_request_id: 'abcdefg123456789',
        level: 'WARN',
        sampling_rate: 0.25,
        service: 'hello-world',
        xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
      })
    );
  });

  it('when logRecordOrder is not set, it will not order the attributes in the log item', () => {
    // Prepare
    const formatter = new PowertoolsLogFormatter({});
    const additionalLogAttributes: LogAttributes = {
      additional_key: 'additional_value',
    };

    // Act
    const value = formatter.formatAttributes(
      unformattedAttributes,
      additionalLogAttributes
    );

    const response = value.getAttributes();

    // Assess
    expect(JSON.stringify(response)).toEqual(
      JSON.stringify({
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
        additional_key: 'additional_value',
      })
    );
  });

  // #region format errors

  it.each([
    {
      error: new Error('Something went wrong'),
      name: 'Error',
      expectedFields: {
        message: 'Something went wrong',
        cause: undefined,
      },
    },
    {
      error: new ReferenceError('doesNotExist is not defined'),
      name: 'ReferenceError',
      expectedFields: {
        message: 'doesNotExist is not defined',
        cause: undefined,
      },
    },
    {
      error: new AssertionError({
        actual: 1,
        expected: 2,
        operator: 'strictEqual',
      }),
      name: 'AssertionError',
      expectedFields: {
        location: expect.stringMatching(
          /(node:)*internal\/assert\/assertion_error(.js)*:\d+$/
        ),
        message: expect.stringMatching(/Expected values to be strictly equal/),
        cause: undefined,
        actual: 1,
        expected: 2,
        operator: 'strictEqual',
        code: 'ERR_ASSERTION',
        generatedMessage: true,
      },
    },
    {
      error: new RangeError('The argument must be between 10 and 20'),
      name: 'RangeError',
      expectedFields: {
        message: 'The argument must be between 10 and 20',
        cause: undefined,
      },
    },
    {
      error: new ReferenceError('foo is not defined'),
      name: 'ReferenceError',
      expectedFields: {
        message: 'foo is not defined',
        cause: undefined,
      },
    },
    {
      error: new SyntaxError(`Unexpected identifier 'bar'`),
      name: 'SyntaxError',
      expectedFields: {
        message: `Unexpected identifier 'bar'`,
        cause: undefined,
      },
    },
    {
      error: new TypeError(`Cannot read property 'foo' of null`),
      name: 'TypeError',
      expectedFields: {
        message: expect.stringMatching(/Cannot read property/),
        cause: undefined,
      },
    },
    {
      error: new URIError('URI malformed'),
      name: 'URIError',
      expectedFields: {
        message: 'URI malformed',
        cause: undefined,
      },
    },
    {
      error: new ErrorWithCause('foo', { cause: new Error('bar') }),
      name: 'ErrorWithCause',
      expectedFields: {
        message: 'foo',
        cause: {
          location: expect.stringMatching(fileNameRegexp),
          message: 'bar',
          name: 'Error',
          stack: expect.stringMatching(fileNameRegexpWithLine),
        },
      },
    },
    {
      error: new ErrorWithCauseString('foo', { cause: 'bar' }),
      name: 'ErrorWithCauseString',
      expectedFields: {
        message: 'foo',
        cause: 'bar',
      },
    },
  ])(
    'formats standard errors correctly ($name)',
    ({ error, name, expectedFields }) => {
      // Act
      const formattedError = formatter.formatError(error);

      // Assess
      expect(formattedError).toEqual({
        location: expect.stringMatching(fileNameRegexp),
        stack: expect.stringMatching(fileNameRegexpWithLine),
        name,
        ...expectedFields,
      });
    }
  );

  it('formats custom errors by including only enumerable properties', () => {
    // Prepare
    const customSymbol = Symbol('customSymbol');
    class CustomError extends Error {
      public otherProperty: string;

      public constructor(
        message: string,
        public readonly code: number
      ) {
        super(message);
        this.name = 'CustomError';
        this.otherProperty = 'otherProperty';
      }

      public [customSymbol] = (): void => {
        // do nothing
      };
    }

    class SuperCustomError extends CustomError {
      public extraProperty: string;
      public constructor(message: string, code: number) {
        super(message, code);
        this.name = 'SuperCustomError';
        this.extraProperty = 'extraProperty';
      }
    }

    // Act
    const formattedError = formatter.formatError(
      new SuperCustomError('Something went wrong', 500)
    );

    // Assess
    expect(formattedError).toEqual({
      location: expect.stringMatching(fileNameRegexp),
      stack: expect.stringMatching(fileNameRegexpWithLine),
      name: 'SuperCustomError',
      message: 'Something went wrong',
      code: 500,
      otherProperty: 'otherProperty',
      extraProperty: 'extraProperty',
    });
  });

  // #region format timestamps

  it('returns a compliant ISO 8601 timestamp', () => {
    // Act
    const timestamp = formatter.formatTimestamp(new Date());

    // Assess
    expect(timestamp).toEqual('2016-06-20T12:08:10.000Z');
  });

  it('formats the timestamp to ISO 8601, accounting for the `America/New_York` timezone offset', () => {
    // Prepare
    process.env.TZ = 'America/New_York';
    /*
      Difference between UTC and `America/New_York`(GMT -04.00) is 240 minutes.
      The positive value indicates that `America/New_York` is behind UTC.
    */
    vi.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(240);

    // Act
    const timestamp = formatterWithEnv.formatTimestamp(new Date());

    // Assess
    expect(timestamp).toEqual('2016-06-20T08:08:10.000-04:00');
  });

  it('formats the timestamp to ISO 8601 with correct milliseconds for `America/New_York` timezone', () => {
    // Prepare
    process.env.TZ = 'America/New_York';
    /*
      Difference between UTC and `America/New_York`(GMT -04.00) is 240 minutes.
      The positive value indicates that `America/New_York` is behind UTC.
    */
    vi.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(240);

    // Act
    const timestamp = formatterWithEnv.formatTimestamp(new Date());

    // Assess
    expect(timestamp).toEqual('2016-06-20T08:08:10.000-04:00');
  });

  it('formats the timestamp to ISO 8601, adjusting for `America/New_York` timezone, preserving milliseconds and accounting for date change', () => {
    // Prepare
    process.env.TZ = 'America/New_York';
    /*
      Difference between UTC and `America/New_York`(GMT -04.00) is 240 minutes.
      The positive value indicates that `America/New_York` is behind UTC.
    */
    vi.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(240);

    // Act
    const timestamp = formatterWithEnv.formatTimestamp(new Date());

    // Assess
    expect(timestamp).toEqual('2016-06-20T08:08:10.000-04:00');
  });

  it('it formats the timestamp to ISO 8601 with correct milliseconds for `Asia/Dhaka` timezone', () => {
    // Prepare
    process.env.TZ = 'Asia/Dhaka';
    vi.setSystemTime(new Date('2016-06-20T12:08:10.910Z'));
    /*
      Difference between UTC and `Asia/Dhaka`(GMT +06.00) is 360 minutes.
      The negative value indicates that `Asia/Dhaka` is ahead of UTC.
    */
    vi.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(-360);
    const formatter = new PowertoolsLogFormatter({
      envVarsService: new EnvironmentVariablesService(),
    });

    // Act
    const timestamp = formatter.formatTimestamp(new Date());

    // Assess
    expect(timestamp).toEqual('2016-06-20T18:08:10.910+06:00');
  });

  it('formats the timestamp to ISO 8601, adjusting for `Asia/Dhaka` timezone, preserving milliseconds and accounting for date change', () => {
    // Prepare
    process.env.TZ = 'Asia/Dhaka';
    const mockDate = new Date('2016-06-20T20:08:10.910Z');
    vi.setSystemTime(mockDate);
    /*
      Difference between UTC and `Asia/Dhaka`(GMT +06.00) is 360 minutes.
      The negative value indicates that `Asia/Dhaka` is ahead of UTC.
    */
    vi.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(-360);
    const formatter = new PowertoolsLogFormatter({
      envVarsService: new EnvironmentVariablesService(),
    });

    // Act
    const timestamp = formatter.formatTimestamp(new Date());

    // Assess
    expect(timestamp).toEqual('2016-06-21T02:08:10.910+06:00');
  });

  it('returns defaults to :UTC when an env variable service is not set', () => {
    // Prepare
    process.env.TZ = 'Asia/Dhaka';
    /*
      Difference between UTC and `Asia/Dhaka`(GMT +06.00) is 360 minutes.
      The negative value indicates that `Asia/Dhaka` is ahead of UTC.
    */
    vi.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(-360);
    const formatter = new PowertoolsLogFormatter();

    // Act
    const timestamp = formatter.formatTimestamp(new Date());

    // Assess
    expect(timestamp).toEqual('2016-06-20T12:08:10.000Z');
  });

  it('defaults to :UTC when the TZ env variable is set to :/etc/localtime', () => {
    // Prepare
    process.env.TZ = ':/etc/localtime';
    vi.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(0);
    const formatter = new PowertoolsLogFormatter({
      envVarsService: new EnvironmentVariablesService(),
    });

    // Act
    const timestamp = formatter.formatTimestamp(new Date());

    // Assess
    expect(timestamp).toEqual('2016-06-20T12:08:10.000+00:00');
  });

  // #region format stack traces

  it.each([
    {
      action: 'returns a location for a stack with relative file path',
      stack:
        'Error: Things keep happening!\n' +
        '   at /home/foo/bar/file-that-threw-the-error.ts:22:5\n' +
        '   at SomeOther.function (/home/foo/bar/some-file.ts:154:19)',
      expected: '/home/foo/bar/some-file.ts:154',
    },
    {
      action:
        'returns a location for a stack ending with an optional backslash',
      stack:
        'Error: Reference Error!\n' +
        '   at /home/foo/bar/file-that-threw-the-error.ts:22:5\n' +
        '   at SomeOther.function (/home/foo/bar/some-frame-with-ending-backslash.ts:154:19)\\',
      expected: '/home/foo/bar/some-frame-with-ending-backslash.ts:154',
    },
    {
      action: 'returns a location for a path containing multiple colons',
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
      expected: 'node:vm:130',
    },
    {
      action: 'returns a location for a nested path',
      stack:
        'Error: unknown\n' +
        'at eval (eval at <anonymous> (file:///home/foo/bar/some-file.ts:1:35), <anonymous>:1:7)\n' +
        'at <anonymous> (/home/foo/bar/file-that-threw-the-error.ts:52:3)\n' +
        'at ModuleJob.run (node:internal/modules/esm/module_job:218:25)\n' +
        'at async ModuleLoader.import (node:internal/modules/esm/loader:329:24)\n' +
        'at async loadESM (node:internal/process/esm_loader:28:7)\n' +
        'at async handleMainPromise (node:internal/modules/run_main:113:12)\n',
      expected: '/home/foo/bar/file-that-threw-the-error.ts:52',
    },
    {
      condition: 'returns an empty location when the stack is undefined',
      stack: undefined,
      expected: '',
    },
    {
      action: 'returns an empty location when the stack is malformed',
      stack: 'A weird stack trace...',
      expected: '',
    },
  ])('it $action', ({ stack, expected }) => {
    // Act
    const errorLocation = formatter.getCodeLocation(stack);

    // Assess
    expect(errorLocation).toEqual(expected);
  });

  // #region custom JSON replacer

  it('ignores keys with circular references when stringifying', () => {
    // Prepare
    const circularObject = {
      foo: 'bar',
      self: {},
    };
    circularObject.self = circularObject;

    // Act
    logger.info('foo', { circularObject });

    // Assess
    expect(console.info).toHaveBeenCalledTimes(1);
    expect(console.info).toHaveLoggedNth(
      1,
      expect.objectContaining({
        level: 'INFO',
        message: 'foo',
        circularObject: {
          foo: 'bar',
        },
      })
    );
  });

  it('replaces bigints with their string representation when stringifying', () => {
    // Prepare
    const bigIntValue = { bigint: BigInt(9007199254740991) };

    // Act
    logger.info('foo', bigIntValue);

    // Assess
    expect(console.info).toHaveBeenCalledTimes(1);
    expect(console.info).toHaveLoggedNth(
      1,
      expect.objectContaining({
        level: 'INFO',
        message: 'foo',
        bigint: '9007199254740991',
      })
    );
  });

  it('removes falsy values, except zero, when stringifying', () => {
    // Prepare
    const values = {
      zero: 0,
      emptyString: '',
      nullValue: null,
      undefinedValue: undefined,
      falseValue: false,
    };

    // Act
    logger.info('foo', values);

    // Assess
    expect(console.info).toHaveBeenCalledTimes(1);
    expect(console.info).toHaveLoggedNth(
      1,
      expect.objectContaining({
        level: 'INFO',
        message: 'foo',
        zero: 0,
      })
    );
  });

  it('should correctly serialize custom values using the provided jsonReplacerFn', () => {
    // Prepare
    const valueWithSet = { value: new Set([1, 2]) };

    // Act
    loggerWithReplacer.info('foo', valueWithSet);

    // Assess
    expect(console.info).toHaveBeenCalledTimes(1);
    expect(console.info).toHaveLoggedNth(
      1,
      expect.objectContaining({
        level: 'INFO',
        message: 'foo',
        value: [1, 2],
      })
    );
  });

  it('should serialize using both the existing replacer and the customer-provided one', () => {
    // Prepare
    const valueWithSetAndBigInt = {
      value: new Set([1, 2]),
      number: BigInt(42),
    };

    // Act
    loggerWithReplacer.info('foo', valueWithSetAndBigInt);

    // Assess
    expect(console.info).toHaveBeenCalledTimes(1);
    expect(console.info).toHaveLoggedNth(
      1,
      expect.objectContaining({
        level: 'INFO',
        message: 'foo',
        value: [1, 2],
        number: '42',
      })
    );
  });

  it('propagates the JSON customer-provided replacer function to child loggers', () => {
    // Prepare
    const childLogger = loggerWithReplacer.createChild();

    // Act
    childLogger.info('foo', { foo: new Set([1, 2]) });

    // Assess
    expect(console.info).toHaveBeenCalledTimes(1);
    expect(console.info).toHaveLoggedNth(
      1,
      expect.objectContaining({
        level: 'INFO',
        message: 'foo',
        foo: [1, 2],
      })
    );
  });

  // #region custom log formatter

  it('formats logs using a custom log formatter', () => {
    // Act
    loggerWithCustomLogFormatter.info('foo');

    // Assess
    expect(console.info).toHaveBeenCalledTimes(1);
    expect(console.info).toHaveLoggedNth(1, {
      logLevel: 12,
      message: 'foo',
      timestamp: expect.any(String),
    });
  });

  it('propagates the custom log formatter to child loggers', () => {
    // Prepare
    const childLogger = loggerWithCustomLogFormatter.createChild();

    // Act
    childLogger.info('foo');

    // Assess
    expect(console.info).toHaveBeenCalledTimes(1);
    expect(console.info).toHaveLoggedNth(1, {
      logLevel: 12,
      message: 'foo',
      timestamp: expect.any(String),
    });
  });
});
