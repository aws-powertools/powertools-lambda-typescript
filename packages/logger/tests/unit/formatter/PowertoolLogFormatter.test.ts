/**
 * Test Logger formatter
 *
 * @group unit/logger/all
 */
import { AssertionError } from 'node:assert';
import { PowertoolLogFormatter } from '../../../src/formatter';
import { UnformattedAttributes } from '../../../src/types';

describe('Class: PowertoolLogFormatter', () => {
  const mockDate = new Date(1466424490000);
  const dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

  beforeEach(() => {
    dateSpy.mockClear();
  });

  describe('Method: formatAttributes', () => {
    test('when optional parameters DO NOT have a value set, it returns an object with expected structure and values', () => {
      // Prepare
      const formatter = new PowertoolLogFormatter();
      const unformattedAttributes: UnformattedAttributes = {
        sampleRateValue: undefined,
        awsRegion: 'eu-west-1',
        environment: '',
        serviceName: 'hello-world',
        xRayTraceId: '1-5759e988-bd862e3fe1be46a994272793',
        logLevel: 'WARN',
        timestamp: new Date(),
        message: 'This is a WARN log',
      };

      // Act
      const value = formatter.formatAttributes(unformattedAttributes);

      // Assess
      expect(value).toEqual({
        cold_start: undefined,
        function_arn: undefined,
        function_memory_size: undefined,
        function_name: undefined,
        function_request_id: undefined,
        level: 'WARN',
        message: 'This is a WARN log',
        sampling_rate: undefined,
        service: 'hello-world',
        timestamp: '2016-06-20T12:08:10.000Z',
        xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
      });
    });

    test('when optional parameters DO have a value set, it returns an object with expected structure and values', () => {
      // Prepare
      const formatter = new PowertoolLogFormatter();
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
          memoryLimitInMB: 123,
          functionVersion: '1.23.3',
          coldStart: true,
          invokedFunctionArn:
            'arn:aws:lambda:eu-west-1:123456789012:function:Example',
          awsRequestId: 'abcdefg123456789',
        },
      };

      // Act
      const value = formatter.formatAttributes(unformattedAttributes);

      // Assess
      expect(value).toEqual({
        cold_start: true,
        function_arn: 'arn:aws:lambda:eu-west-1:123456789012:function:Example',
        function_memory_size: 123,
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
      const formatter = new PowertoolLogFormatter();

      // Act & Assess
      const formattedError = formatter.formatError(new Error('Ouch!'));
      expect(formattedError).toEqual({
        location: expect.stringMatching(
          /PowertoolLogFormatter.test.ts:[0-9]+$/
        ),
        message: 'Ouch!',
        name: 'Error',
        stack: expect.stringMatching(
          /PowertoolLogFormatter.test.ts:[0-9]+:[0-9]+/
        ),
      });
    });

    test('when an error of type ReferenceError is passed, it returns an object with expected structure and values', () => {
      // Prepare
      const formatter = new PowertoolLogFormatter();

      // Act & Assess
      const formattedReferenceError = formatter.formatError(
        new ReferenceError('doesNotExist is not defined')
      );
      expect(formattedReferenceError).toEqual({
        location: expect.stringMatching(
          /PowertoolLogFormatter.test.ts:[0-9]+$/
        ),
        message: 'doesNotExist is not defined',
        name: 'ReferenceError',
        stack: expect.stringMatching(
          /PowertoolLogFormatter.test.ts:[0-9]+:[0-9]+/
        ),
      });
    });

    test('when an error of type AssertionError is passed, it returns an object with expected structure and values', () => {
      // Prepare
      const formatter = new PowertoolLogFormatter();

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
          /(node:)*internal\/assert\/assertion_error(.js)*:[0-9]+$/
        ),
        message: expect.stringMatching(/Expected values to be strictly equal/),
        name: 'AssertionError',
        stack: expect.stringMatching(
          /PowertoolLogFormatter.test.ts:[0-9]+:[0-9]+/
        ),
      });
    });

    test('when an error of type RangeError is passed, it returns an object with expected structure and values', () => {
      // Prepare
      const formatter = new PowertoolLogFormatter();

      // Act & Assess
      const formattedRangeError = formatter.formatError(
        new RangeError('The argument must be between 10 and 20')
      );
      expect(formattedRangeError).toEqual({
        location: expect.stringMatching(/PowertoolLogFormatter.test.ts:[0-9]+/),
        message: 'The argument must be between 10 and 20',
        name: 'RangeError',
        stack: expect.stringMatching(
          /PowertoolLogFormatter.test.ts:[0-9]+:[0-9]+/
        ),
      });
    });

    test('when an error of type ReferenceError is passed, it returns an object with expected structure and values', () => {
      // Prepare
      const formatter = new PowertoolLogFormatter();

      // Act & Assess
      const formattedError = formatter.formatError(
        new ReferenceError('foo is not defined')
      );
      expect(formattedError).toEqual({
        location: expect.stringMatching(/PowertoolLogFormatter.test.ts:[0-9]+/),
        message: 'foo is not defined',
        name: 'ReferenceError',
        stack: expect.stringMatching(
          /PowertoolLogFormatter.test.ts:[0-9]+:[0-9]+/
        ),
      });
    });

    test('when an error of type SyntaxError is passed, it returns an object with expected structure and values', () => {
      // Prepare
      const formatter = new PowertoolLogFormatter();

      // Act & Assess
      const formattedSyntaxError = formatter.formatError(
        new SyntaxError(`Unexpected identifier 'bar'`)
      );
      expect(formattedSyntaxError).toEqual({
        location: expect.stringMatching(/PowertoolLogFormatter.test.ts:[0-9]+/),
        message: `Unexpected identifier 'bar'`,
        name: 'SyntaxError',
        stack: expect.stringMatching(
          /PowertoolLogFormatter.test.ts:[0-9]+:[0-9]+/
        ),
      });
    });

    test('when an error of type TypeError is passed, it returns an object with expected structure and values', () => {
      // Prepare
      const formatter = new PowertoolLogFormatter();

      // Act & Assess
      const formattedTypeError = formatter.formatError(
        new TypeError(`Cannot read property 'foo' of null`)
      );
      expect(formattedTypeError).toEqual({
        location: expect.stringMatching(/PowertoolLogFormatter.test.ts:[0-9]+/),
        message: expect.stringMatching(/Cannot read propert/),
        name: 'TypeError',
        stack: expect.stringMatching(
          /PowertoolLogFormatter.test.ts:[0-9]+:[0-9]+/
        ),
      });
    });

    test('when an error of type URIError is passed, it returns an object with expected structure and values', () => {
      // Prepare
      const formatter = new PowertoolLogFormatter();

      // Act & Assess
      const formattedURIError = formatter.formatError(
        new URIError('URI malformed')
      );
      expect(formattedURIError).toEqual({
        location: expect.stringMatching(/PowertoolLogFormatter.test.ts:[0-9]+/),
        message: 'URI malformed',
        name: 'URIError',
        stack: expect.stringMatching(
          /PowertoolLogFormatter.test.ts:[0-9]+:[0-9]+/
        ),
      });
    });

    test('when an error with cause of type Error is formatted, the cause key is included and formatted', () => {
      // Prepare
      const formatter = new PowertoolLogFormatter();
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
        location: expect.stringMatching(/PowertoolLogFormatter.test.ts:[0-9]+/),
        message: 'foo',
        name: 'Error',
        stack: expect.stringMatching(
          /PowertoolLogFormatter.test.ts:[0-9]+:[0-9]+/
        ),
        cause: {
          location: expect.stringMatching(
            /PowertoolLogFormatter.test.ts:[0-9]+/
          ),
          message: 'bar',
          name: 'Error',
          stack: expect.stringMatching(
            /PowertoolLogFormatter.test.ts:[0-9]+:[0-9]+/
          ),
        },
      });
    });

    test('when an error with cause of type other than Error is formatted, the cause key is included as-is', () => {
      // Prepare
      const formatter = new PowertoolLogFormatter();
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
        location: expect.stringMatching(/PowertoolLogFormatter.test.ts:[0-9]+/),
        message: 'foo',
        name: 'Error',
        stack: expect.stringMatching(
          /PowertoolLogFormatter.test.ts:[0-9]+:[0-9]+/
        ),
        cause: 'bar',
      });
    });
  });

  describe('Method: formatTimestamp', () => {
    test('it returns a datetime value ISO 8601 compliant', () => {
      // Prepare
      const formatter = new PowertoolLogFormatter();

      // Act
      const timestamp = formatter.formatTimestamp(new Date());

      // Assess
      expect(timestamp).toEqual('2016-06-20T12:08:10.000Z');
    });
  });

  describe('Method: getCodeLocation', () => {
    test('when the stack IS present, it returns a datetime value ISO 8601 compliant', () => {
      // Prepare
      const formatter = new PowertoolLogFormatter();
      const stack =
        'Error: Things keep happening!\n' +
        '   at /home/foo/bar/file-that-threw-the-error.ts:22:5\n' +
        '   at SomeOther.function (/home/foo/bar/some-file.ts:154:19)';

      // Act
      const errorLocation = formatter.getCodeLocation(stack);

      // Assess
      expect(errorLocation).toEqual('/home/foo/bar/some-file.ts:154');
    });

    test('when the stack IS NOT present, it returns a datetime value ISO 8601 compliant', () => {
      // Prepare
      const formatter = new PowertoolLogFormatter();
      const stack = undefined;

      // Act
      const errorLocation = formatter.getCodeLocation(stack);

      // Assess
      expect(errorLocation).toEqual('');
    });

    test('when the stack IS NOT present, it returns a datetime value ISO 8601 compliant', () => {
      // Prepare
      const formatter = new PowertoolLogFormatter();
      const stack = 'A weird stack trace...';

      // Act
      const errorLocation = formatter.getCodeLocation(stack);

      // Assess
      expect(errorLocation).toEqual('');
    });
  });
});
