/**
 * Test Logger formatter
 *
 * @group unit/logger/all
 */
import { AssertionError, strictEqual } from 'assert';
import { PowertoolsLogFormatter } from '../../../src/formatter';
import { LogAttributes, UnformattedAttributes } from '../../../src/types';

describe('Class: PowertoolsLogFormatter', () => {
  const mockDate = new Date(1466424490000);
  const dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

  beforeEach(() => {
    dateSpy.mockClear();
  });

  describe('Method: formatAttributes', () => {
    test('when optional parameters DO NOT have a value set, it returns an object with expected structure and values', () => {
      // Prepare
      const formatter = new PowertoolsLogFormatter();
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
        sampling_rate: undefined,
        service: 'hello-world',
        timestamp: '2016-06-20T12:08:10.000Z',
        xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
      });
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
          memoryLimitInMB: 123,
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
      const formatter = new PowertoolsLogFormatter();
      const shouldThrow = (): void => {
        throw new Error('Ouch!');
      };

      // Act
      try {
        shouldThrow();
      } catch (error) {
        // Assess
        expect(error).toBeInstanceOf(Error);
        const formattedError = formatter.formatError(<Error>error);
        expect(formattedError).toEqual({
          location: expect.stringMatching(
            /PowertoolsLogFormatter.test.ts:[0-9]+$/
          ),
          message: 'Ouch!',
          name: 'Error',
          stack: expect.stringMatching(
            /PowertoolsLogFormatter.test.ts:[0-9]+:[0-9]+/
          ),
        });
      }

      expect(shouldThrow).toThrowError(expect.any(Error));
    });

    test('when an error of type ReferenceError is passed, it returns an object with expected structure and values', () => {
      // Prepare
      const formatter = new PowertoolsLogFormatter();
      const shouldThrow = (): void => {
        // This is a reference error purposely to test the formatter
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        doesNotExist;
      };

      // Act
      try {
        shouldThrow();
      } catch (error) {
        // Assess
        expect(error).toBeInstanceOf(Error);
        const formattedReferenceError = formatter.formatError(<Error>error);
        expect(formattedReferenceError).toEqual({
          location: expect.stringMatching(
            /PowertoolsLogFormatter.test.ts:[0-9]+$/
          ),
          message: 'doesNotExist is not defined',
          name: 'ReferenceError',
          stack: expect.stringMatching(
            /PowertoolsLogFormatter.test.ts:[0-9]+:[0-9]+/
          ),
        });
      }

      expect(shouldThrow).toThrowError(expect.any(ReferenceError));
    });

    test('when an error of type AssertionError is passed, it returns an object with expected structure and values', () => {
      // Prepare
      const formatter = new PowertoolsLogFormatter();
      const shouldThrow = (): void => {
        strictEqual(1, 2);
      };

      // Act
      try {
        shouldThrow();
      } catch (error) {
        // Assess
        expect(error).toBeInstanceOf(AssertionError);
        const formattedAssertionError = formatter.formatError(
          <AssertionError>error
        );
        expect(formattedAssertionError).toEqual({
          location: expect.stringMatching(
            /PowertoolsLogFormatter.test.ts:[0-9]+/
          ),
          message: expect.stringMatching(
            /Expected values to be strictly equal/
          ),
          name: 'AssertionError',
          stack: expect.stringMatching(
            /PowertoolsLogFormatter.test.ts:[0-9]+:[0-9]+/
          ),
        });
      }

      expect(shouldThrow).toThrowError(expect.any(AssertionError));
    });

    test('when an error of type RangeError is passed, it returns an object with expected structure and values', () => {
      // Prepare
      const formatter = new PowertoolsLogFormatter();
      const shouldThrow = (): void => {
        throw new RangeError('The argument must be between 10 and 20');
      };

      // Act
      try {
        shouldThrow();
      } catch (error) {
        // Assess
        expect(error).toBeInstanceOf(RangeError);
        const formattedRangeError = formatter.formatError(<RangeError>error);
        expect(formattedRangeError).toEqual({
          location: expect.stringMatching(
            /PowertoolsLogFormatter.test.ts:[0-9]+/
          ),
          message: 'The argument must be between 10 and 20',
          name: 'RangeError',
          stack: expect.stringMatching(
            /PowertoolsLogFormatter.test.ts:[0-9]+:[0-9]+/
          ),
        });
      }

      test('when an error of type ReferenceError is passed, it returns an object with expected structure and values', () => {
        // Prepare
        const formatter = new PowertoolsLogFormatter();

        // Act & Assess
        const formattedError = formatter.formatError(
          new ReferenceError('foo is not defined')
        );
        expect(formattedError).toEqual({
          location: expect.stringMatching(
            /PowertoolLogFormatter.test.ts:[0-9]+/
          ),
          message: 'foo is not defined',
          name: 'ReferenceError',
          stack: expect.stringMatching(
            /PowertoolLogFormatter.test.ts:[0-9]+:[0-9]+/
          ),
        });
      });

      test('when an error of type SyntaxError is passed, it returns an object with expected structure and values', () => {
        // Prepare
        const formatter = new PowertoolsLogFormatter();
        const shouldThrow = (): void => {
          eval('foo bar');
        };

        // Act
        try {
          shouldThrow();
        } catch (error) {
          // Assess
          expect(error).toBeInstanceOf(SyntaxError);
          const formattedSyntaxError = formatter.formatError(
            <SyntaxError>error
          );
          expect(formattedSyntaxError).toEqual({
            location: expect.stringMatching(
              /PowertoolsLogFormatter.test.ts:[0-9]+/
            ),
            message: 'Unexpected identifier',
            name: 'SyntaxError',
            stack: expect.stringMatching(
              /PowertoolsLogFormatter.test.ts:[0-9]+:[0-9]+/
            ),
          });
        }

        expect(shouldThrow).toThrowError(expect.any(SyntaxError));
      });

      test('when an error of type TypeError is passed, it returns an object with expected structure and values', () => {
        // Prepare
        const formatter = new PowertoolsLogFormatter();
        const shouldThrow = (): void => {
          // This is a reference error purposely to test the formatter
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          null.foo();
        };

        // Act
        try {
          shouldThrow();
        } catch (error) {
          // TODO: review message content assertion (see Issue #304)
          // Assess
          expect(error).toBeInstanceOf(Error);
          const formattedTypeError = formatter.formatError(<Error>error);
          expect(formattedTypeError).toEqual({
            location: expect.stringMatching(
              /PowertoolsLogFormatter.test.ts:[0-9]+/
            ),
            message: expect.stringMatching(/Cannot read propert/),
            name: 'TypeError',
            stack: expect.stringMatching(
              /PowertoolsLogFormatter.test.ts:[0-9]+:[0-9]+/
            ),
          });
        }

        expect(shouldThrow).toThrowError(expect.any(TypeError));
      });

      test('when an error of type URIError is passed, it returns an object with expected structure and values', () => {
        // Prepare
        const formatter = new PowertoolsLogFormatter();
        const shouldThrow = (): void => {
          decodeURIComponent('%');
        };

        // Act
        try {
          shouldThrow();
        } catch (error) {
          // Assess
          expect(error).toBeInstanceOf(URIError);
          const formattedURIError = formatter.formatError(<URIError>error);
          expect(formattedURIError).toEqual({
            location: expect.stringMatching(
              /PowertoolsLogFormatter.test.ts:[0-9]+/
            ),
            message: 'URI malformed',
            name: 'URIError',
            stack: expect.stringMatching(
              /PowertoolsLogFormatter.test.ts:[0-9]+:[0-9]+/
            ),
          });
        }

        expect(shouldThrow).toThrowError(expect.any(URIError));
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
          location: expect.stringMatching(
            /PowertoolLogFormatter.test.ts:[0-9]+/
          ),
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
          location: expect.stringMatching(
            /PowertoolLogFormatter.test.ts:[0-9]+/
          ),
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
        const formatter = new PowertoolsLogFormatter();

        // Act
        const timestamp = formatter.formatTimestamp(new Date());

        // Assess
        expect(timestamp).toEqual('2016-06-20T12:08:10.000Z');
      });
    });

    describe('Method: getCodeLocation', () => {
      test('when the stack IS present, it returns a datetime value ISO 8601 compliant', () => {
        // Prepare
        const formatter = new PowertoolsLogFormatter();
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
        const formatter = new PowertoolsLogFormatter();
        const stack = undefined;

        // Act
        const errorLocation = formatter.getCodeLocation(stack);

        // Assess
        expect(errorLocation).toEqual('');
      });

      test('when the stack IS NOT present, it returns a datetime value ISO 8601 compliant', () => {
        // Prepare
        const formatter = new PowertoolsLogFormatter();
        const stack = 'A weird stack trace...';

        // Act
        const errorLocation = formatter.getCodeLocation(stack);

        // Assess
        expect(errorLocation).toEqual('');
      });
    });
  });
});
