/**
 * Test Logger class
 *
 * @group unit/logger/logger
 */
import context from '@aws-lambda-powertools/testing-utils/context';
import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
import { Logger, LogFormatter } from '../../src/index.js';
import { ConfigServiceInterface } from '../../src/types/ConfigServiceInterface.js';
import { EnvironmentVariablesService } from '../../src/config/EnvironmentVariablesService.js';
import { PowertoolsLogFormatter } from '../../src/formatter/PowertoolsLogFormatter.js';
import { LogLevelThresholds, LogLevel } from '../../src/types/Log.js';
import type {
  LogFunction,
  ConstructorOptions,
} from '../../src/types/Logger.js';
import { LogJsonIndent } from '../../src/constants.js';
import type { Context } from 'aws-lambda';

const mockDate = new Date(1466424490000);
const dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
const getConsoleMethod = (
  method: string
): keyof Omit<LogFunction, 'critical'> =>
  method === 'critical'
    ? 'error'
    : (method.toLowerCase() as keyof Omit<LogFunction, 'critical'>);
jest.mock('node:console', () => ({
  ...jest.requireActual('node:console'),
  Console: jest.fn().mockImplementation(() => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
}));

describe('Class: Logger', () => {
  const ENVIRONMENT_VARIABLES = process.env;
  const event = {
    foo: 'bar',
    bar: 'baz',
  };
  const logLevelThresholds: LogLevelThresholds = {
    DEBUG: 8,
    INFO: 12,
    WARN: 16,
    ERROR: 20,
    CRITICAL: 24,
    SILENT: 28,
  };

  beforeEach(() => {
    dateSpy.mockClear();
    process.env = { ...ENVIRONMENT_VARIABLES };
  });

  describe('Method: constructor', () => {
    test('when no constructor parameters are set, returns a Logger instance with the options set in the environment variables', () => {
      // Prepare
      const loggerOptions = undefined;

      // Act
      const logger = new Logger(loggerOptions);

      // Assess
      expect(logger).toBeInstanceOf(Logger);
      expect(logger).toEqual(
        expect.objectContaining({
          persistentLogAttributes: {},
          powertoolsLogData: {
            sampleRateValue: 0,
            awsRegion: 'eu-west-1',
            environment: '',
            serviceName: 'hello-world',
          },
          envVarsService: expect.any(EnvironmentVariablesService),
          customConfigService: undefined,
          defaultServiceName: 'service_undefined',
          logLevel: 8,
          logFormatter: expect.any(PowertoolsLogFormatter),
        })
      );
    });

    test('when no parameters are set, returns a Logger instance with the correct properties', () => {
      // Prepare
      const loggerOptions: ConstructorOptions = {
        logLevel: 'WARN',
        serviceName: 'my-lambda-service',
        sampleRateValue: 1,
        logFormatter: new PowertoolsLogFormatter(),
        customConfigService: new EnvironmentVariablesService(),
        persistentLogAttributes: {
          awsAccountId: '123456789',
        },
        environment: 'prod',
      };

      // Act
      const logger = new Logger(loggerOptions);

      // Assess
      expect(logger).toBeInstanceOf(Logger);
      expect(logger).toEqual({
        coldStart: true,
        defaultServiceName: 'service_undefined',
        customConfigService: expect.any(EnvironmentVariablesService),
        envVarsService: expect.any(EnvironmentVariablesService),
        logEvent: false,
        logIndentation: 0,
        logFormatter: expect.any(PowertoolsLogFormatter),
        logLevel: 8, // 100% sample rate value changes log level to DEBUG
        console: expect.objectContaining({
          debug: expect.any(Function),
          error: expect.any(Function),
          info: expect.any(Function),
          warn: expect.any(Function),
        }),
        logLevelThresholds: {
          ...logLevelThresholds,
        },
        persistentLogAttributes: {
          awsAccountId: '123456789',
        },
        temporaryLogAttributes: {},
        powertoolsLogData: {
          awsRegion: 'eu-west-1',
          environment: 'prod',
          sampleRateValue: 1,
          serviceName: 'my-lambda-service',
        },
      });
    });

    test('when no constructor parameters and no environment variables are set, returns a Logger instance with the default properties', () => {
      // Prepare
      const loggerOptions = undefined;
      delete process.env.POWERTOOLS_SERVICE_NAME;
      delete process.env.POWERTOOLS_LOG_LEVEL;

      // Act
      const logger = new Logger(loggerOptions);

      // Assess
      expect(logger).toBeInstanceOf(Logger);
      expect(logger).toEqual({
        coldStart: true,
        customConfigService: undefined,
        defaultServiceName: 'service_undefined',
        envVarsService: expect.any(EnvironmentVariablesService),
        logEvent: false,
        logIndentation: 0,
        logFormatter: expect.any(PowertoolsLogFormatter),
        logLevel: 12,
        console: expect.objectContaining({
          debug: expect.any(Function),
          error: expect.any(Function),
          info: expect.any(Function),
          warn: expect.any(Function),
        }),
        logLevelThresholds: {
          ...logLevelThresholds,
        },
        persistentLogAttributes: {},
        temporaryLogAttributes: {},
        powertoolsLogData: {
          awsRegion: 'eu-west-1',
          environment: '',
          sampleRateValue: 0,
          serviceName: 'service_undefined',
        },
      });
    });

    test('when a custom logFormatter is passed, returns a Logger instance with the correct properties', () => {
      // Prepare
      const loggerOptions: ConstructorOptions = {
        logFormatter: expect.any(LogFormatter),
      };

      // Act
      const logger = new Logger(loggerOptions);

      // Assess
      expect(logger).toBeInstanceOf(Logger);
      expect(logger).toEqual(
        expect.objectContaining({
          persistentLogAttributes: {},
          powertoolsLogData: {
            sampleRateValue: 0,
            awsRegion: 'eu-west-1',
            environment: '',
            serviceName: 'hello-world',
          },
          envVarsService: expect.any(EnvironmentVariablesService),
          customConfigService: undefined,
          logLevel: 8,
          logFormatter: expect.any(LogFormatter),
        })
      );
    });

    test('when a custom serviceName is passed, returns a Logger instance with the correct properties', () => {
      // Prepare
      const loggerOptions: ConstructorOptions = {
        serviceName: 'my-backend-service',
      };

      // Act
      const logger = new Logger(loggerOptions);

      // Assess
      expect(logger).toBeInstanceOf(Logger);
      expect(logger).toEqual(
        expect.objectContaining({
          persistentLogAttributes: {},
          powertoolsLogData: {
            sampleRateValue: 0,
            awsRegion: 'eu-west-1',
            environment: '',
            serviceName: 'my-backend-service',
          },
          envVarsService: expect.any(EnvironmentVariablesService),
          customConfigService: undefined,
          logLevel: 8,
          logFormatter: expect.any(PowertoolsLogFormatter),
        })
      );
    });

    test('when a custom uppercase logLevel is passed, returns a Logger instance with the correct properties', () => {
      // Prepare
      const loggerOptions: ConstructorOptions = {
        logLevel: 'ERROR',
      };

      // Act
      const logger = new Logger(loggerOptions);

      // Assess
      expect(logger).toBeInstanceOf(Logger);
      expect(logger).toEqual(
        expect.objectContaining({
          persistentLogAttributes: {},
          powertoolsLogData: {
            sampleRateValue: 0,
            awsRegion: 'eu-west-1',
            environment: '',
            serviceName: 'hello-world',
          },
          envVarsService: expect.any(EnvironmentVariablesService),
          customConfigService: undefined,
          logLevel: 20,
          logFormatter: expect.any(PowertoolsLogFormatter),
        })
      );
    });

    test('when a custom lowercase logLevel is passed, returns a Logger instance with the correct properties', () => {
      // Prepare
      const loggerOptions: ConstructorOptions = {
        logLevel: 'warn',
      };

      // Act
      const logger = new Logger(loggerOptions);

      // Assess
      expect(logger).toBeInstanceOf(Logger);
      expect(logger).toEqual(
        expect.objectContaining({
          persistentLogAttributes: {},
          powertoolsLogData: {
            sampleRateValue: 0,
            awsRegion: 'eu-west-1',
            environment: '',
            serviceName: 'hello-world',
          },
          envVarsService: expect.any(EnvironmentVariablesService),
          customConfigService: undefined,
          logLevel: 16,
          logFormatter: expect.any(PowertoolsLogFormatter),
        })
      );
    });

    test('when no log level is set, returns a Logger instance with INFO level', () => {
      // Prepare
      const loggerOptions: ConstructorOptions = {};
      delete process.env.POWERTOOLS_LOG_LEVEL;

      // Act
      const logger = new Logger(loggerOptions);

      // Assess
      expect(logger).toBeInstanceOf(Logger);
      expect(logger).toEqual({
        coldStart: true,
        customConfigService: undefined,
        defaultServiceName: 'service_undefined',
        envVarsService: expect.any(EnvironmentVariablesService),
        logEvent: false,
        logIndentation: 0,
        logFormatter: expect.any(PowertoolsLogFormatter),
        logLevel: 12,
        console: expect.objectContaining({
          debug: expect.any(Function),
          error: expect.any(Function),
          info: expect.any(Function),
          warn: expect.any(Function),
        }),
        logLevelThresholds: {
          ...logLevelThresholds,
        },
        persistentLogAttributes: {},
        temporaryLogAttributes: {},
        powertoolsLogData: {
          awsRegion: 'eu-west-1',
          environment: '',
          sampleRateValue: 0,
          serviceName: 'hello-world',
        },
      });
    });

    test('when a custom sampleRateValue is passed, returns a Logger instance with the correct properties', () => {
      // Prepare
      const loggerOptions: ConstructorOptions = {
        sampleRateValue: 1,
      };

      // Act
      const logger = new Logger(loggerOptions);

      // Assess
      expect(logger).toBeInstanceOf(Logger);
      expect(logger).toEqual(
        expect.objectContaining({
          persistentLogAttributes: {},
          powertoolsLogData: {
            sampleRateValue: 1,
            awsRegion: 'eu-west-1',
            environment: '',
            serviceName: 'hello-world',
          },
          envVarsService: expect.any(EnvironmentVariablesService),
          customConfigService: undefined,
          logLevel: 8,
          logFormatter: expect.any(PowertoolsLogFormatter),
        })
      );
    });

    test('when a custom customConfigService is passed, returns a Logger instance with the correct properties', () => {
      const configService: ConfigServiceInterface = {
        get(name: string): string {
          return `a-string-from-${name}`;
        },
        getAwsLogLevel() {
          return 'INFO';
        },
        getCurrentEnvironment(): string {
          return 'dev';
        },
        getLogEvent(): boolean {
          return true;
        },
        getLogLevel(): string {
          return 'INFO';
        },
        getSampleRateValue(): number | undefined {
          return undefined;
        },
        getServiceName(): string {
          return 'my-backend-service';
        },
        getXrayTraceId(): string | undefined {
          return undefined;
        },
        getXrayTraceSampled() {
          return true;
        },
        isDevMode(): boolean {
          return false;
        },
        isValueTrue(): boolean {
          return true;
        },
      };
      // Prepare
      const loggerOptions: ConstructorOptions = {
        customConfigService: configService,
      };

      // Act
      const logger = new Logger(loggerOptions);

      // Assess
      expect(logger).toBeInstanceOf(Logger);
      expect(logger).toEqual(
        expect.objectContaining({
          persistentLogAttributes: {},
          powertoolsLogData: {
            sampleRateValue: 0,
            awsRegion: 'eu-west-1',
            environment: 'dev',
            serviceName: 'my-backend-service',
          },
          envVarsService: expect.any(EnvironmentVariablesService),
          customConfigService: configService,
          logLevel: 12,
          logFormatter: expect.any(PowertoolsLogFormatter),
        })
      );
    });

    test('when custom persistentLogAttributes is passed, returns a Logger instance with the correct properties', () => {
      // Prepare
      const loggerOptions: ConstructorOptions = {
        persistentLogAttributes: {
          aws_account_id: '123456789012',
          aws_region: 'eu-west-1',
          logger: {
            name: 'aws-lambda-powertool-typescript',
            version: '0.2.4',
          },
        },
      };

      // Act
      const logger = new Logger(loggerOptions);

      // Assess
      expect(logger).toBeInstanceOf(Logger);
      expect(logger).toEqual(
        expect.objectContaining({
          persistentLogAttributes: {
            aws_account_id: '123456789012',
            aws_region: 'eu-west-1',
            logger: {
              name: 'aws-lambda-powertool-typescript',
              version: '0.2.4',
            },
          },
          powertoolsLogData: {
            sampleRateValue: 0,
            awsRegion: 'eu-west-1',
            environment: '',
            serviceName: 'hello-world',
          },
          envVarsService: expect.any(EnvironmentVariablesService),
          customConfigService: undefined,
          logLevel: 8,
          logFormatter: expect.any(PowertoolsLogFormatter),
        })
      );
    });

    test('when custom persistentKeys is passed, returns a Logger instance with the correct properties', () => {
      // Prepare
      const loggerOptions: ConstructorOptions = {
        persistentKeys: {
          aws_account_id: '123456789012',
          aws_region: 'eu-west-1',
          logger: {
            name: 'aws-lambda-powertool-typescript',
            version: '0.2.4',
          },
        },
      };

      // Act
      const logger = new Logger(loggerOptions);

      // Assess
      expect(logger).toBeInstanceOf(Logger);
      expect(logger).toEqual(
        expect.objectContaining({
          persistentLogAttributes: {
            aws_account_id: '123456789012',
            aws_region: 'eu-west-1',
            logger: {
              name: 'aws-lambda-powertool-typescript',
              version: '0.2.4',
            },
          },
          powertoolsLogData: {
            sampleRateValue: 0,
            awsRegion: 'eu-west-1',
            environment: '',
            serviceName: 'hello-world',
          },
          envVarsService: expect.any(EnvironmentVariablesService),
          customConfigService: undefined,
          logLevel: 8,
          logFormatter: expect.any(PowertoolsLogFormatter),
        })
      );
    });

    test('it emits a warning when both persistentKeys and persistentLogAttributes are used in the constructor', () => {
      // Prepare
      // Since the buffer is private and we are bypassing the public warn method, we need to spy on the console.warn
      process.env.POWERTOOLS_DEV = 'true';
      const warningSpy = jest.spyOn(console, 'warn').mockImplementation();

      type TestConstructorOptions = {
        persistentLogAttributes?: Record<string, string>;
        persistentKeys?: Record<string, string>;
      };

      const loggerOptions: TestConstructorOptions = {
        persistentKeys: {
          foo: 'bar',
        },
        persistentLogAttributes: {
          foo: 'bar',
        },
      };

      // Act
      new Logger(loggerOptions as ConstructorOptions);

      // Assess
      expect(warningSpy).toHaveBeenCalledTimes(1);
      expect(warningSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Both persistentLogAttributes and persistentKeys options were provided. Using persistentKeys as persistentLogAttributes is deprecated and will be removed in future releases'
        )
      );
      // Cleanup
      warningSpy.mockRestore();
    });

    test('when a custom environment is passed, returns a Logger instance with the correct properties', () => {
      // Prepare
      const loggerOptions: ConstructorOptions = {
        environment: 'dev',
      };

      // Act
      const logger = new Logger(loggerOptions);

      // Assess
      expect(logger).toBeInstanceOf(Logger);
      expect(logger).toEqual(
        expect.objectContaining({
          persistentLogAttributes: {},
          powertoolsLogData: {
            sampleRateValue: 0,
            awsRegion: 'eu-west-1',
            environment: 'dev',
            serviceName: 'hello-world',
          },
          envVarsService: expect.any(EnvironmentVariablesService),
          customConfigService: undefined,
          logLevel: 8,
          logFormatter: expect.any(PowertoolsLogFormatter),
        })
      );
    });
  });

  describe.each([
    [
      'debug',
      'DOES',
      true,
      'DOES NOT',
      false,
      'DOES NOT',
      false,
      'DOES NOT',
      false,
    ],
    ['info', 'DOES', true, 'DOES', true, 'DOES NOT', false, 'DOES NOT', false],
    ['warn', 'DOES', true, 'DOES', true, 'DOES', true, 'DOES NOT', false],
    ['error', 'DOES', true, 'DOES', true, 'DOES', true, 'DOES', true],
    ['critical', 'DOES', true, 'DOES', true, 'DOES', true, 'DOES', true],
  ])(
    'Method:',
    (
      method: string,
      debugAction,
      debugPrints,
      infoAction,
      infoPrints,
      warnAction,
      warnPrints,
      errorAction,
      errorPrints
    ) => {
      const methodOfLogger = method as keyof LogFunction;

      describe('Feature: log level', () => {
        test(`when the level is DEBUG, it ${debugAction} print to stdout`, () => {
          // Prepare
          const logger = new Logger({
            logLevel: 'DEBUG',
          });
          const consoleSpy = jest.spyOn(
            logger['console'],
            getConsoleMethod(method)
          );
          // Act
          logger[methodOfLogger]('foo');

          // Assess
          expect(consoleSpy).toBeCalledTimes(debugPrints ? 1 : 0);
          if (debugPrints) {
            expect(consoleSpy).toHaveBeenNthCalledWith(
              1,
              JSON.stringify({
                level: methodOfLogger.toUpperCase(),
                message: 'foo',
                sampling_rate: 0,
                service: 'hello-world',
                timestamp: '2016-06-20T12:08:10.000Z',
                xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
              })
            );
          }
        });

        test(`when the log level is INFO, it ${infoAction} print to stdout`, () => {
          // Prepare
          const logger = new Logger({
            logLevel: 'INFO',
          });
          const consoleSpy = jest.spyOn(
            logger['console'],
            getConsoleMethod(methodOfLogger)
          );
          // Act
          logger[methodOfLogger]('foo');

          // Assess
          expect(consoleSpy).toBeCalledTimes(infoPrints ? 1 : 0);
          if (infoPrints) {
            expect(consoleSpy).toHaveBeenNthCalledWith(
              1,
              JSON.stringify({
                level: methodOfLogger.toUpperCase(),
                message: 'foo',
                sampling_rate: 0,
                service: 'hello-world',
                timestamp: '2016-06-20T12:08:10.000Z',
                xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
              })
            );
          }
        });

        test(`when the log level is WARN, it ${warnAction} print to stdout`, () => {
          // Prepare
          const logger = new Logger({
            logLevel: 'WARN',
          });
          const consoleSpy = jest.spyOn(
            logger['console'],
            getConsoleMethod(methodOfLogger)
          );
          // Act
          logger[methodOfLogger]('foo');

          // Assess
          expect(consoleSpy).toBeCalledTimes(warnPrints ? 1 : 0);
          if (warnPrints) {
            expect(consoleSpy).toHaveBeenNthCalledWith(
              1,
              JSON.stringify({
                level: methodOfLogger.toUpperCase(),
                message: 'foo',
                sampling_rate: 0,
                service: 'hello-world',
                timestamp: '2016-06-20T12:08:10.000Z',
                xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
              })
            );
          }
        });

        test(`when the log level is ERROR, it ${errorAction} print to stdout`, () => {
          // Prepare
          const logger = new Logger({
            logLevel: 'ERROR',
          });
          const consoleSpy = jest.spyOn(
            logger['console'],
            getConsoleMethod(methodOfLogger)
          );
          // Act
          logger[methodOfLogger]('foo');

          // Assess
          expect(consoleSpy).toBeCalledTimes(errorPrints ? 1 : 0);
          if (errorPrints) {
            expect(consoleSpy).toHaveBeenNthCalledWith(
              1,
              JSON.stringify({
                level: methodOfLogger.toUpperCase(),
                message: 'foo',
                sampling_rate: 0,
                service: 'hello-world',
                timestamp: '2016-06-20T12:08:10.000Z',
                xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
              })
            );
          }
        });

        test('when the log level is SILENT, it DOES NOT print to stdout', () => {
          // Prepare
          const logger = new Logger({
            logLevel: 'SILENT',
          });
          const consoleSpy = jest.spyOn(
            logger['console'],
            getConsoleMethod(methodOfLogger)
          );
          // Act
          logger[methodOfLogger]('foo');

          // Assess
          expect(consoleSpy).toBeCalledTimes(0);
        });

        test('when the log level is set through POWERTOOLS_LOG_LEVEL env variable, it DOES print to stdout', () => {
          // Prepare
          process.env.POWERTOOLS_LOG_LEVEL = methodOfLogger.toUpperCase();
          const logger = new Logger();
          const consoleSpy = jest.spyOn(
            logger['console'],
            getConsoleMethod(methodOfLogger)
          );
          // Act
          logger[methodOfLogger]('foo');

          // Assess
          expect(consoleSpy).toBeCalledTimes(1);
          expect(consoleSpy).toHaveBeenNthCalledWith(
            1,
            JSON.stringify({
              level: methodOfLogger.toUpperCase(),
              message: 'foo',
              sampling_rate: 0,
              service: 'hello-world',
              timestamp: '2016-06-20T12:08:10.000Z',
              xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
            })
          );
        });
      });

      describe('Feature: sampling debug logs', () => {
        test('when the log level is higher and the current Lambda invocation IS NOT sampled for logging, it DOES NOT print to stdout', () => {
          // Prepare
          const logger = new Logger({
            logLevel: 'SILENT',
            sampleRateValue: 0,
          });
          const consoleSpy = jest.spyOn(
            logger['console'],
            getConsoleMethod(methodOfLogger)
          );
          // Act
          if (logger[methodOfLogger]) {
            logger[methodOfLogger]('foo');
          }

          // Assess
          expect(logger.level).toBe(28);
          expect(logger.getLevelName()).toBe('SILENT');
          expect(consoleSpy).toBeCalledTimes(0);
        });

        test('when the log level is higher and the current Lambda invocation IS sampled for logging, it DOES print to stdout and changes log level to DEBUG', () => {
          // Prepare
          const logger = new Logger({
            logLevel: 'SILENT',
            sampleRateValue: 1,
          });
          const consoleSpy = jest.spyOn(
            logger['console'],
            getConsoleMethod(methodOfLogger)
          );
          // Act
          if (logger[methodOfLogger]) {
            logger[methodOfLogger]('foo');
          }

          // Assess
          expect(logger.level).toBe(8);
          expect(logger.getLevelName()).toBe('DEBUG');
          expect(consoleSpy).toBeCalledTimes(method === 'debug' ? 2 : 1);
          expect(consoleSpy).toHaveBeenNthCalledWith(
            method === 'debug' ? 2 : 1,
            JSON.stringify({
              level: method.toUpperCase(),
              message: 'foo',
              sampling_rate: 1,
              service: 'hello-world',
              timestamp: '2016-06-20T12:08:10.000Z',
              xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
            })
          );
        });
      });

      describe('Feature: inject context', () => {
        test(
          'when the Lambda context is not captured and a string is passed as log message, it should print a valid ' +
            method.toUpperCase() +
            ' log',
          () => {
            // Prepare
            const logger = new Logger();
            const consoleSpy = jest.spyOn(
              logger['console'],
              getConsoleMethod(methodOfLogger)
            );
            // Act
            if (logger[methodOfLogger]) {
              logger[methodOfLogger]('foo');
            }

            // Assess
            expect(consoleSpy).toBeCalledTimes(1);
            expect(consoleSpy).toHaveBeenNthCalledWith(
              1,
              JSON.stringify({
                level: method.toUpperCase(),
                message: 'foo',
                sampling_rate: 0,
                service: 'hello-world',
                timestamp: '2016-06-20T12:08:10.000Z',
                xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
              })
            );
          }
        );

        test(
          'when the Lambda context is captured, it returns a valid ' +
            method.toUpperCase() +
            ' log',
          () => {
            // Prepare
            const logger = new Logger({
              logLevel: 'DEBUG',
            });
            logger.addContext(context);
            const consoleSpy = jest.spyOn(
              logger['console'],
              getConsoleMethod(methodOfLogger)
            );
            // Act
            if (logger[methodOfLogger]) {
              logger[methodOfLogger]('foo');
            }

            // Assess
            expect(consoleSpy).toBeCalledTimes(1);
            expect(consoleSpy).toHaveBeenNthCalledWith(
              1,
              JSON.stringify({
                cold_start: true,
                function_arn:
                  'arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function',
                function_memory_size: '128',
                function_name: 'foo-bar-function',
                function_request_id: 'c6af9ac6-7b61-11e6-9a41-93e812345678',
                level: method.toUpperCase(),
                message: 'foo',
                sampling_rate: 0,
                service: 'hello-world',
                timestamp: '2016-06-20T12:08:10.000Z',
                xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
              })
            );
          }
        );
      });

      describe('Feature: ephemeral log attributes', () => {
        const logger = new Logger({
          logLevel: 'DEBUG',
        });

        it.each([
          {
            idx: 0,
            inputs: ['A log item without extra parameters'],
            expected: {
              level: method.toUpperCase(),
              message: 'A log item without extra parameters',
              sampling_rate: 0,
              service: 'hello-world',
              timestamp: '2016-06-20T12:08:10.000Z',
              xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
            },
          },
          {
            idx: 1,
            inputs: [
              'A log item with a string as first parameter, and an object as second parameter',
              { extra: 'parameter' },
            ],
            expected: {
              level: method.toUpperCase(),
              message:
                'A log item with a string as first parameter, and an object as second parameter',
              sampling_rate: 0,
              service: 'hello-world',
              timestamp: '2016-06-20T12:08:10.000Z',
              xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
              extra: 'parameter',
            },
          },
          {
            idx: 2,
            inputs: [
              'A log item with a string as first parameter, and objects as other parameters',
              { parameterOne: 'foo' },
              { parameterTwo: 'bar' },
            ],
            expected: {
              level: method.toUpperCase(),
              message:
                'A log item with a string as first parameter, and objects as other parameters',
              sampling_rate: 0,
              service: 'hello-world',
              timestamp: '2016-06-20T12:08:10.000Z',
              xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
              parameterOne: 'foo',
              parameterTwo: 'bar',
            },
          },
          {
            idx: 3,
            inputs: [
              {
                message: 'A log item with an object as first parameters',
                extra: 'parameter',
              },
            ],
            expected: {
              level: method.toUpperCase(),
              message: 'A log item with an object as first parameters',
              sampling_rate: 0,
              service: 'hello-world',
              timestamp: '2016-06-20T12:08:10.000Z',
              xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
              extra: 'parameter',
            },
          },
          {
            idx: 4,
            inputs: [
              'A log item with a string as first parameter, and an error as second parameter',
              new Error('Something happened!'),
            ],
            expected: {
              level: method.toUpperCase(),
              message:
                'A log item with a string as first parameter, and an error as second parameter',
              sampling_rate: 0,
              service: 'hello-world',
              timestamp: '2016-06-20T12:08:10.000Z',
              xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
              error: {
                location: expect.any(String),
                message: 'Something happened!',
                name: 'Error',
                stack: expect.any(String),
              },
            },
          },
          {
            idx: 5,
            inputs: [
              'A log item with a string as first parameter, and an error with custom key as second parameter',
              { myCustomErrorKey: new Error('Something happened!') },
            ],
            expected: {
              level: method.toUpperCase(),
              message:
                'A log item with a string as first parameter, and an error with custom key as second parameter',
              sampling_rate: 0,
              service: 'hello-world',
              timestamp: '2016-06-20T12:08:10.000Z',
              xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
              myCustomErrorKey: {
                location: expect.any(String),
                message: 'Something happened!',
                name: 'Error',
                stack: expect.any(String),
              },
            },
          },
          {
            idx: 6,
            inputs: [
              'A log item with a string as first parameter, and a string as second parameter',
              'parameter',
            ],
            expected: {
              level: method.toUpperCase(),
              message:
                'A log item with a string as first parameter, and a string as second parameter',
              sampling_rate: 0,
              service: 'hello-world',
              timestamp: '2016-06-20T12:08:10.000Z',
              xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
              extra: 'parameter',
            },
          },
          {
            idx: 7,
            inputs: [
              'A log item with a string as first parameter, and an inline object as second parameter',
              { extra: { custom: mockDate } },
            ],
            expected: {
              level: method.toUpperCase(),
              message:
                'A log item with a string as first parameter, and an inline object as second parameter',
              sampling_rate: 0,
              service: 'hello-world',
              timestamp: '2016-06-20T12:08:10.000Z',
              xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
              extra: { custom: '2016-06-20T12:08:10.000Z' },
            },
          },
          {
            idx: 8,
            inputs: [
              'A log item with a string as first parameter, and an arbitrary object as second parameter',
              {
                extra: {
                  value: 'CUSTOM',
                  nested: {
                    bool: true,
                    str: 'string value',
                    num: 42,
                    err: new Error('Arbitrary object error'),
                  },
                },
              },
            ],
            expected: {
              level: method.toUpperCase(),
              message:
                'A log item with a string as first parameter, and an arbitrary object as second parameter',
              sampling_rate: 0,
              service: 'hello-world',
              timestamp: '2016-06-20T12:08:10.000Z',
              xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
              extra: {
                value: 'CUSTOM',
                nested: {
                  bool: true,
                  str: 'string value',
                  num: 42,
                  err: {
                    location: expect.any(String),
                    message: 'Arbitrary object error',
                    name: 'Error',
                    stack: expect.any(String),
                  },
                },
              },
            },
          },
        ])(
          'when added, they should appear in that log item only',
          ({ idx, inputs, expected }) => {
            // Prepare
            const consoleSpy = jest.spyOn(
              logger['console'],
              getConsoleMethod(methodOfLogger)
            );

            // Act
            // @ts-expect-error - we are testing the method dynamically
            logger[methodOfLogger](...inputs);

            // Assess
            const received = JSON.parse(consoleSpy.mock.calls[idx][0]);
            expect(received).toEqual(expect.objectContaining(expected));
          }
        );
      });

      describe('Feature: persistent log attributes', () => {
        test('when persistent log attributes are added to the Logger instance, they should appear in all logs printed by the instance', () => {
          // Prepare
          const logger = new Logger({
            logLevel: 'DEBUG',
            persistentLogAttributes: {
              aws_account_id: '123456789012',
              aws_region: 'eu-west-1',
            },
          });
          const consoleSpy = jest.spyOn(
            logger['console'],
            getConsoleMethod(methodOfLogger)
          );
          // Act
          if (logger[methodOfLogger]) {
            logger[methodOfLogger]('foo');
          }

          // Assess
          expect(consoleSpy).toBeCalledTimes(1);
          expect(consoleSpy).toHaveBeenNthCalledWith(
            1,
            JSON.stringify({
              level: method.toUpperCase(),
              message: 'foo',
              sampling_rate: 0,
              service: 'hello-world',
              timestamp: '2016-06-20T12:08:10.000Z',
              xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
              aws_account_id: '123456789012',
              aws_region: 'eu-west-1',
            })
          );
        });
      });

      describe('Feature: X-Ray Trace ID injection', () => {
        test('when the `_X_AMZN_TRACE_ID` environment variable is set it parses it correctly and adds the Trace ID to the log', () => {
          // Prepare
          const logger = new Logger({
            logLevel: 'DEBUG',
          });
          const consoleSpy = jest.spyOn(
            logger['console'],
            getConsoleMethod(methodOfLogger)
          );
          // Act
          if (logger[methodOfLogger]) {
            logger[methodOfLogger]('foo');
          }

          // Assess
          expect(consoleSpy).toBeCalledTimes(1);
          expect(consoleSpy).toHaveBeenNthCalledWith(
            1,
            JSON.stringify({
              level: method.toUpperCase(),
              message: 'foo',
              sampling_rate: 0,
              service: 'hello-world',
              timestamp: '2016-06-20T12:08:10.000Z',
              xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
            })
          );
        });

        test('when the `_X_AMZN_TRACE_ID` environment variable is NOT set it parses it correctly and adds the Trace ID to the log', () => {
          // Prepare
          delete process.env._X_AMZN_TRACE_ID;
          const logger = new Logger({
            logLevel: 'DEBUG',
          });
          const consoleSpy = jest.spyOn(
            logger['console'],
            getConsoleMethod(methodOfLogger)
          );
          // Act
          if (logger[methodOfLogger]) {
            logger[methodOfLogger]('foo');
          }

          // Assess
          expect(consoleSpy).toBeCalledTimes(1);
          expect(consoleSpy).toHaveBeenNthCalledWith(
            1,
            JSON.stringify({
              level: method.toUpperCase(),
              message: 'foo',
              sampling_rate: 0,
              service: 'hello-world',
              timestamp: '2016-06-20T12:08:10.000Z',
            })
          );
        });
      });

      describe('Feature: handle safely unexpected errors', () => {
        test('when a logged item references itself, the logger ignores the keys that cause a circular reference', () => {
          // Prepare
          const logger = new Logger({
            logLevel: 'DEBUG',
          });
          const consoleSpy = jest.spyOn(
            logger['console'],
            getConsoleMethod(methodOfLogger)
          );
          const circularObject = {
            foo: 'bar',
            self: {},
          };
          circularObject.self = circularObject;
          const logCircularReference = (): string => {
            if (logger[methodOfLogger]) {
              logger[methodOfLogger]('A log with a circular reference', {
                details: circularObject,
              });
            }

            return 'All good!';
          };

          // Act
          const result = logCircularReference();

          // Assess
          expect(result).toBe('All good!');
          expect(consoleSpy).toHaveBeenNthCalledWith(
            1,
            JSON.stringify({
              level: method.toUpperCase(),
              message: 'A log with a circular reference',
              sampling_rate: 0,
              service: 'hello-world',
              timestamp: '2016-06-20T12:08:10.000Z',
              xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
              details: {
                foo: 'bar',
              },
            })
          );
        });

        test('when a logged item has BigInt value, it does not throw TypeError', () => {
          // Prepare
          const logger = new Logger();
          jest.spyOn(logger['console'], getConsoleMethod(methodOfLogger));
          const message = `This is an ${methodOfLogger} log with BigInt value`;
          const logItem = { value: BigInt(42) };
          const errorMessage = 'Do not know how to serialize a BigInt';

          // Act & Assess
          expect(() => {
            logger[methodOfLogger](message, logItem);
          }).not.toThrow(errorMessage);
        });

        test('when a logged item has a BigInt value, it prints the log with value as a string', () => {
          // Prepare
          const logger = new Logger();
          const consoleSpy = jest.spyOn(
            logger['console'],
            getConsoleMethod(methodOfLogger)
          );
          const message = `This is an ${methodOfLogger} log with BigInt value`;
          const logItem = { value: BigInt(42) };

          // Act
          logger[methodOfLogger](message, logItem);

          // Assess
          expect(consoleSpy).toBeCalledTimes(1);
          expect(consoleSpy).toHaveBeenNthCalledWith(
            1,
            JSON.stringify({
              level: methodOfLogger.toUpperCase(),
              message: message,
              sampling_rate: 0,
              service: 'hello-world',
              timestamp: '2016-06-20T12:08:10.000Z',
              xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
              value: '42',
            })
          );
        });

        test('when a logged item has empty string, null, or undefined values, it removes it', () => {
          // Prepare
          const logger = new Logger();
          const consoleSpy = jest.spyOn(
            logger['console'],
            getConsoleMethod(methodOfLogger)
          );
          const message = `This is an ${methodOfLogger} log with empty, null, and undefined values`;
          const logItem = {
            value: 42,
            emptyValue: '',
            undefinedValue: undefined,
            nullValue: null,
          };

          // Act
          logger[methodOfLogger](message, logItem);

          // Assess
          expect(consoleSpy).toBeCalledTimes(1);
          expect(consoleSpy).toHaveBeenNthCalledWith(
            1,
            JSON.stringify({
              level: methodOfLogger.toUpperCase(),
              message: message,
              sampling_rate: 0,
              service: 'hello-world',
              timestamp: '2016-06-20T12:08:10.000Z',
              xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
              value: 42,
            })
          );
        });
      });
    }
  );

  describe('Method: addContext', () => {
    test('when called during a cold start invocation, it populates the logger powertoolsLogData object with coldStart set to TRUE', () => {
      // Prepare
      const logger = new Logger();

      // Act
      logger.addContext(context);

      // Assess
      expect(logger).toEqual(
        expect.objectContaining({
          coldStart: false, // This is now false because the `coldStart` attribute has been already accessed once by the `addContext` method
          powertoolsLogData: expect.objectContaining({
            lambdaContext: expect.objectContaining({
              coldStart: true,
            }),
            sampleRateValue: 0,
            serviceName: 'hello-world',
          }),
        })
      );
    });

    test('when called with a context object, the object is not mutated', () => {
      // Prepare
      const logger = new Logger();
      const context1 = {
        ...context,
        awsRequestId: 'c6af9ac6-7b61-11e6-9a41-93e812345678',
      };
      const context2 = {
        ...context,
        awsRequestId: 'd40c98a9-91c4-478c-a179-433c4b978289',
      };

      // Act
      logger.addContext(context1);
      logger.addContext(context2);

      // Assess
      expect(context1.awsRequestId).toEqual(
        'c6af9ac6-7b61-11e6-9a41-93e812345678'
      );
      expect(context2.awsRequestId).toEqual(
        'd40c98a9-91c4-478c-a179-433c4b978289'
      );
    });

    test('when called multiple times, the newer values override earlier values', () => {
      // Prepare
      const logger = new Logger();
      const context1 = {
        ...context,
        awsRequestId: 'c6af9ac6-7b61-11e6-9a41-93e812345678',
      };
      const context2 = {
        ...context,
        awsRequestId: 'd40c98a9-91c4-478c-a179-433c4b978289',
      };

      // Act
      logger.addContext(context1);
      logger.addContext(context2);

      // Assess
      expect(logger).toEqual(
        expect.objectContaining({
          powertoolsLogData: expect.objectContaining({
            lambdaContext: expect.objectContaining({
              awsRequestId: context2.awsRequestId,
            }),
          }),
        })
      );
    });
  });

  describe('Method: appendKeys', () => {
    test('when called, it populates the logger temporaryLogAttributes property', () => {
      // Prepare
      const logger = new Logger();

      // Act
      logger.appendKeys({
        aws_account_id: '123456789012',
        aws_region: 'eu-west-1',
        logger: {
          name: 'aws-lambda-powertool-typescript',
          version: '0.2.4',
        },
      });

      // Assess
      expect(logger).toEqual(
        expect.objectContaining({
          temporaryLogAttributes: {
            aws_account_id: '123456789012',
            aws_region: 'eu-west-1',
            logger: {
              name: 'aws-lambda-powertool-typescript',
              version: '0.2.4',
            },
          },
        })
      );
    });

    test('when called with user-provided attribute objects, the objects are not mutated', () => {
      // Prepare
      const logger = new Logger();
      const attributes1 = { keyOne: 'abc' };
      const attributes2 = { keyTwo: 'def' };

      // Act
      logger.appendKeys(attributes1);
      logger.appendKeys(attributes2);

      // Assess
      expect(attributes1).toEqual({ keyOne: 'abc' });
      expect(attributes2).toEqual({ keyTwo: 'def' });
    });

    test('when called multiple times, the newer values override earlier values', () => {
      // Prepare
      const logger = new Logger();

      // Act
      logger.appendKeys({
        duplicateKey: 'one',
      });
      logger.appendKeys({
        duplicateKey: 'two',
      });

      // Assess
      expect(logger).toEqual(
        expect.objectContaining({
          temporaryLogAttributes: {
            duplicateKey: 'two',
          },
        })
      );
    });

    test('when called with the same key as in persistentKeys container option, persistent keys will be overwritten', () => {
      // Prepare
      const logger = new Logger({
        persistentKeys: {
          aws_account_id: '1234567890',
        },
      });

      logger.appendKeys({
        aws_account_id: '0987654321',
      });

      const consoleSpy = jest.spyOn(logger['console'], 'info');

      // Act
      logger.info('This is an INFO log with some log attributes');

      // Assess
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const log = JSON.parse(consoleSpy.mock.calls[0][0]);
      expect(log).toStrictEqual(
        expect.objectContaining({
          aws_account_id: '0987654321',
        })
      );
    });
  });

  describe('Method: removeKeys', () => {
    test('when called, it removes keys added with appendKeys() method', () => {
      // Prepare
      const logger = new Logger();
      logger.appendKeys({
        aws_account_id: '123456789012',
        aws_region: 'eu-west-1',
        logger: {
          name: 'aws-lambda-powertool-typescript',
          version: '0.2.4',
        },
      });

      // Act
      logger.removeKeys(['aws_account_id', 'aws_region']);

      // Assess
      expect(logger).toEqual(
        expect.objectContaining({
          temporaryLogAttributes: {
            logger: {
              name: 'aws-lambda-powertool-typescript',
              version: '0.2.4',
            },
          },
        })
      );
    });

    test('when called, it DOES NOT remove persistent keys', () => {
      // Prepare
      const loggerOptions: ConstructorOptions = {
        persistentKeys: {
          aws_account_id: '123456789012',
          aws_region: 'eu-west-1',
          logger: {
            name: 'aws-lambda-powertool-typescript',
            version: '0.2.4',
          },
        },
      };
      const logger = new Logger(loggerOptions);

      // Act
      logger.removeKeys(['aws_account_id', 'aws_region']);

      // Assess
      expect(logger).toEqual(
        expect.objectContaining({
          persistentLogAttributes: {
            aws_account_id: '123456789012',
            aws_region: 'eu-west-1',
            logger: {
              name: 'aws-lambda-powertool-typescript',
              version: '0.2.4',
            },
          },
        })
      );
    });

    test('when called with non-existing keys, the logger instance is not mutated and it does not throw an error', () => {
      // Prepare
      const logger = new Logger();
      logger.appendKeys({
        aws_account_id: '123456789012',
        aws_region: 'eu-west-1',
        logger: {
          name: 'aws-lambda-powertool-typescript',
          version: '0.2.4',
        },
      });
      const loggerBeforeKeysAreRemoved = { ...logger };

      // Act
      logger.removeKeys(['not_existing_key']);

      // Assess
      expect(logger).toEqual(loggerBeforeKeysAreRemoved);
      expect(logger).toEqual(
        expect.objectContaining({
          temporaryLogAttributes: {
            aws_account_id: '123456789012',
            aws_region: 'eu-west-1',
            logger: {
              name: 'aws-lambda-powertool-typescript',
              version: '0.2.4',
            },
          },
        })
      );
    });

    test('when called multiple times with the same keys, the outcome is the same', () => {
      // Prepare
      const logger = new Logger();
      logger.appendKeys({
        aws_account_id: '123456789012',
        aws_region: 'eu-west-1',
        logger: {
          name: 'aws-lambda-powertool-typescript',
          version: '0.2.4',
        },
      });

      // Act
      logger.removeKeys(['aws_account_id', 'aws_region']);
      logger.removeKeys(['aws_account_id', 'aws_region']);

      // Assess
      expect(logger).toEqual(
        expect.objectContaining({
          temporaryLogAttributes: {
            logger: {
              name: 'aws-lambda-powertool-typescript',
              version: '0.2.4',
            },
          },
        })
      );
    });
  });

  describe('Method: removePersistentLogAttributes', () => {
    test('when called, it removes persistent keys', () => {
      // Prepare
      const loggerOptions: ConstructorOptions = {
        persistentKeys: {
          aws_account_id: '123456789012',
          aws_region: 'eu-west-1',
          logger: {
            name: 'aws-lambda-powertool-typescript',
            version: '0.2.4',
          },
        },
      };
      const logger = new Logger(loggerOptions);

      // Act
      logger.removePersistentLogAttributes(['aws_account_id', 'aws_region']);

      // Assess
      expect(logger).toEqual(
        expect.objectContaining({
          persistentLogAttributes: {
            logger: {
              name: 'aws-lambda-powertool-typescript',
              version: '0.2.4',
            },
          },
        })
      );
    });

    test('when called, it DOES NOT remove temporary keys', () => {
      // Prepare
      const logger = new Logger();
      logger.appendKeys({
        aws_account_id: '123456789012',
        aws_region: 'eu-west-1',
      });

      // Act
      logger.removePersistentLogAttributes(['aws_account_id', 'aws_region']);

      // Assess
      expect(logger).toEqual(
        expect.objectContaining({
          temporaryLogAttributes: {
            aws_account_id: '123456789012',
            aws_region: 'eu-west-1',
          },
        })
      );
    });
  });

  describe('Method: resetKeys', () => {
    test('when called, it removes all keys added with appendKeys() method', () => {
      // Prepare
      const logger = new Logger();
      logger.appendKeys({
        aws_account_id: '123456789012',
        aws_region: 'eu-west-1',
        logger: {
          name: 'aws-lambda-powertool-typescript',
          version: '0.2.4',
        },
      });

      // Act
      logger.resetKeys();

      // Assess
      expect(logger).toEqual(
        expect.objectContaining({
          temporaryLogAttributes: {},
        })
      );
    });

    test('when called, it DOES NOT remove persistent keys', () => {
      // Prepare
      const loggerOptions: ConstructorOptions = {
        persistentKeys: {
          aws_account_id: '123456789012',
          aws_region: 'eu-west-1',
          logger: {
            name: 'aws-lambda-powertool-typescript',
            version: '0.2.4',
          },
        },
      };
      const logger = new Logger(loggerOptions);
      logger.appendKeys({ foo: 'bar' });

      // Act
      logger.resetKeys();

      // Assess
      expect(logger).toEqual(
        expect.objectContaining({
          persistentLogAttributes: {
            aws_account_id: '123456789012',
            aws_region: 'eu-west-1',
            logger: {
              name: 'aws-lambda-powertool-typescript',
              version: '0.2.4',
            },
          },
          temporaryLogAttributes: {},
        })
      );
    });

    it('preserves persistent keys that were previously overwritten', () => {
      // Prepare
      const logger = new Logger({
        persistentKeys: {
          aws_region: 'eu-west-1',
        },
      });
      const debugSpy = jest.spyOn(logger['console'], 'info');
      logger.appendKeys({
        aws_region: 'us-east-1',
      });

      // Act
      logger.resetKeys();
      logger.info('foo');

      // Assess
      const log = JSON.parse(debugSpy.mock.calls[0][0]);
      expect(log).toStrictEqual(
        expect.objectContaining({ aws_region: 'eu-west-1' })
      );
    });
  });

  describe('method: setPersistentLogAttributes (deprecated)', () => {
    test('when called, it overwrites all persistent keys', () => {
      // Prepare
      const loggerOptions: ConstructorOptions = {
        persistentKeys: {
          aws_account_id: '123456789012',
          aws_region: 'eu-west-1',
          logger: {
            name: 'aws-lambda-powertool-typescript',
            version: '0.2.4',
          },
        },
      };
      const logger = new Logger(loggerOptions);

      // Act
      logger.setPersistentLogAttributes({
        foo: 'bar',
      });

      // Assess
      expect(logger).toEqual(
        expect.objectContaining({
          persistentLogAttributes: {
            foo: 'bar',
          },
        })
      );
    });
  });

  describe('Method: appendPersistentKeys', () => {
    it('overwrites existing persistent keys with new ones', () => {
      // Prepare
      const logger = new Logger({
        persistentKeys: {
          aws_account_id: '123456789012',
        },
      });

      // Act
      logger.appendPersistentKeys({
        aws_account_id: '0987654321',
      });

      // Assess
      expect(logger).toEqual(
        expect.objectContaining({
          persistentLogAttributes: {
            aws_account_id: '0987654321',
          },
        })
      );
    });

    it('overwrites existing temporary keys with new ones in the next log', () => {
      // Prepare
      const logger = new Logger();
      const debugSpy = jest.spyOn(logger['console'], 'info');
      logger.appendKeys({
        aws_account_id: '123456789012',
      });

      // Act
      logger.appendPersistentKeys({
        aws_account_id: '0987654321',
      });
      logger.info('This is an INFO log with some log attributes');

      // Assess
      const log = JSON.parse(debugSpy.mock.calls[0][0]);
      expect(log).toStrictEqual(
        expect.objectContaining({ aws_account_id: '0987654321' })
      );
    });
  });

  describe('Method: injectLambdaContext', () => {
    beforeEach(() => {
      jest.spyOn(console, 'log').mockImplementation(() => ({}));
    });

    test('it returns a decorated method with the correct scope of the decorated class', async () => {
      // Prepare

      const logger = new Logger();
      const consoleSpy = jest.spyOn(logger['console'], 'info');
      class LambdaFunction implements LambdaInterface {
        @logger.injectLambdaContext()
        public async handler<TEvent>(
          _event: TEvent,
          _context: Context
        ): Promise<void> {
          this.myClassMethod();
        }

        private myClassMethod(): void {
          logger.info('This is an INFO log with some context');
        }
      }
      const handlerClass = new LambdaFunction();
      const handler = handlerClass.handler.bind(handlerClass);

      // Act
      await handler(event, context);

      // Assess
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const log = JSON.parse(consoleSpy.mock.calls[0][0]);
      expect(log).toEqual(
        expect.objectContaining({
          cold_start: true,
          function_arn:
            'arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function',
          function_memory_size: '128',
          function_name: 'foo-bar-function',
          function_request_id: 'c6af9ac6-7b61-11e6-9a41-93e812345678',
          level: 'INFO',
          message: 'This is an INFO log with some context',
          sampling_rate: 0,
          service: 'hello-world',
          timestamp: '2016-06-20T12:08:10.000Z',
          xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
        })
      );
    });

    test('it captures Lambda context information and adds it in the printed logs', async () => {
      // Prepare
      const logger = new Logger();
      const consoleSpy = jest.spyOn(logger['console'], 'info');
      class LambdaFunction implements LambdaInterface {
        @logger.injectLambdaContext()
        public async handler<TEvent>(
          _event: TEvent,
          _context: Context
        ): Promise<void> {
          logger.info('This is an INFO log with some context');
        }
      }
      const handlerClass = new LambdaFunction();
      const handler = handlerClass.handler.bind(handlerClass);

      // Act
      logger.info('An INFO log without context!');
      await handler(event, context);

      // Assess

      expect(consoleSpy).toHaveBeenCalledTimes(2);
      const log1 = JSON.parse(consoleSpy.mock.calls[0][0]);
      expect(log1).toStrictEqual(
        expect.objectContaining({
          level: 'INFO',
          message: 'An INFO log without context!',
          sampling_rate: 0,
          service: 'hello-world',
          timestamp: '2016-06-20T12:08:10.000Z',
          xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
        })
      );
      const log2 = JSON.parse(consoleSpy.mock.calls[1][0]);
      expect(log2).toStrictEqual(
        expect.objectContaining({
          cold_start: true,
          function_arn:
            'arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function',
          function_memory_size: '128',
          function_name: 'foo-bar-function',
          function_request_id: 'c6af9ac6-7b61-11e6-9a41-93e812345678',
          level: 'INFO',
          message: 'This is an INFO log with some context',
          sampling_rate: 0,
          service: 'hello-world',
          timestamp: '2016-06-20T12:08:10.000Z',
          xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
        })
      );
    });

    test('it captures Lambda context information and adds it in the printed logs for async methods', async () => {
      // Prepare
      const expectedReturnValue = 'Lambda invoked!';
      const logger = new Logger();
      const consoleSpy = jest.spyOn(logger['console'], 'info');
      class LambdaFunction implements LambdaInterface {
        @logger.injectLambdaContext()
        public async handler<TEvent>(
          _event: TEvent,
          _context: Context
        ): Promise<string> {
          logger.info('This is an INFO log with some context');

          return expectedReturnValue;
        }
      }
      const handlerClass = new LambdaFunction();
      const handler = handlerClass.handler.bind(handlerClass);

      // Act
      logger.info('An INFO log without context!');
      const actualResult = await handler(event, context);

      // Assess

      expect(actualResult).toEqual(expectedReturnValue);
      expect(consoleSpy).toHaveBeenCalledTimes(2);
      const log1 = JSON.parse(consoleSpy.mock.calls[0][0]);
      expect(log1).toStrictEqual(
        expect.objectContaining({
          level: 'INFO',
          message: 'An INFO log without context!',
          sampling_rate: 0,
          service: 'hello-world',
          timestamp: '2016-06-20T12:08:10.000Z',
          xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
        })
      );
      const log2 = JSON.parse(consoleSpy.mock.calls[1][0]);
      expect(log2).toStrictEqual(
        expect.objectContaining({
          cold_start: true,
          function_arn:
            'arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function',
          function_memory_size: '128',
          function_name: 'foo-bar-function',
          function_request_id: 'c6af9ac6-7b61-11e6-9a41-93e812345678',
          level: 'INFO',
          message: 'This is an INFO log with some context',
          sampling_rate: 0,
          service: 'hello-world',
          timestamp: '2016-06-20T12:08:10.000Z',
          xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
        })
      );
    });

    test('when enabled, it clears all the log attributes added with appendKeys() inside and outside of the handler function', async () => {
      // Prepare
      const logger = new Logger({
        logLevel: 'DEBUG',
      });
      logger.appendKeys({
        foo: 'bar',
        biz: 'baz',
      });

      const debugSpy = jest.spyOn(logger['console'], 'debug');

      class LambdaFunction implements LambdaInterface {
        @logger.injectLambdaContext({ clearState: true })
        public async handler<TEvent>(
          _event: TEvent,
          _context: Context
        ): Promise<void> {
          // Only add these keys for the scope of this lambda handler
          logger.appendKeys({
            details: { user_id: '1234' },
          });
          logger.debug('This is a DEBUG log with the user_id');
        }
      }

      const handlerClass = new LambdaFunction();
      const handler = handlerClass.handler.bind(handlerClass);

      // Act
      await handler(event, context);
      logger.debug('Checking state after handler execution');

      // Assess
      expect(debugSpy).toHaveBeenCalledTimes(2);
      const log1 = JSON.parse(debugSpy.mock.calls[0][0]);
      expect(log1).toStrictEqual(
        expect.objectContaining({
          cold_start: true,
          function_arn:
            'arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function',
          function_memory_size: '128',
          function_name: 'foo-bar-function',
          function_request_id: 'c6af9ac6-7b61-11e6-9a41-93e812345678',
          level: 'DEBUG',
          message: 'This is a DEBUG log with the user_id',
          sampling_rate: 0,
          service: 'hello-world',
          timestamp: '2016-06-20T12:08:10.000Z',
          xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
          foo: 'bar',
          biz: 'baz',
          details: { user_id: '1234' },
        })
      );
      const log2 = JSON.parse(debugSpy.mock.calls[1][0]);
      expect(log2).toStrictEqual(
        expect.objectContaining({
          cold_start: true,
          function_arn:
            'arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function',
          function_memory_size: '128',
          function_name: 'foo-bar-function',
          function_request_id: 'c6af9ac6-7b61-11e6-9a41-93e812345678',
          level: 'DEBUG',
          message: 'Checking state after handler execution',
          sampling_rate: 0,
          service: 'hello-world',
          timestamp: '2016-06-20T12:08:10.000Z',
          xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
        })
      );
    });

    test('when clearState is enabled, the persistent log attributes added in the handler ARE NOT cleared when the method returns', async () => {
      // Prepare
      const logger = new Logger({
        logLevel: 'DEBUG',
        persistentLogAttributes: {
          foo: 'bar',
          biz: 'baz',
        },
      });
      class LambdaFunction implements LambdaInterface {
        @logger.injectLambdaContext({ clearState: true })
        public async handler<TEvent>(
          _event: TEvent,
          _context: Context
        ): Promise<void> {
          // These persistent attributes stay persistent
          logger.appendPersistentKeys({
            details: { user_id: '1234' },
          });
          logger.debug('This is a DEBUG log with the user_id');
          logger.debug('This is another DEBUG log with the user_id');
        }
      }
      const handlerClass = new LambdaFunction();
      const handler = handlerClass.handler.bind(handlerClass);
      const persistentAttribsBeforeInvocation = {
        ...logger.getPersistentLogAttributes(),
      };

      // Act
      await handler(event, context);
      const persistentAttribsAfterInvocation = {
        ...logger.getPersistentLogAttributes(),
      };

      // Assess
      expect(persistentAttribsBeforeInvocation).toEqual({
        foo: 'bar',
        biz: 'baz',
      });
      expect(persistentAttribsAfterInvocation).toEqual({
        foo: 'bar',
        biz: 'baz',
        details: { user_id: '1234' },
      });
    });

    test('when clearState is enabled, persistent log attributes added in the handler stay persistent, but temporary added in the handler are cleared when the method returns', async () => {
      // Prepare
      const logger = new Logger({
        logLevel: 'DEBUG',
      });

      const debugSpy = jest.spyOn(logger['console'], 'debug');

      class LambdaFunction implements LambdaInterface {
        @logger.injectLambdaContext({ clearState: true })
        public async handler<TEvent>(
          _event: TEvent,
          _context: Context
        ): Promise<void> {
          // This key is persistent and will stay persistent
          logger.appendPersistentKeys({
            foo: 'bar',
          });
          // This attribute is temporary and will be cleared
          logger.appendKeys({
            biz: 'baz',
          });
          logger.debug(
            'This is a DEBUG log with both pesistent and temporary keys'
          );
        }
      }
      const handlerClass = new LambdaFunction();
      const handler = handlerClass.handler.bind(handlerClass);

      // Act
      await handler(event, context);
      logger.debug('Checking state after handler execution');

      // Assess
      expect(debugSpy).toHaveBeenCalledTimes(2);
      const log1 = JSON.parse(debugSpy.mock.calls[0][0]);
      expect(log1).toStrictEqual(
        expect.objectContaining({
          cold_start: true,
          function_arn:
            'arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function',
          function_memory_size: '128',
          function_name: 'foo-bar-function',
          function_request_id: 'c6af9ac6-7b61-11e6-9a41-93e812345678',
          level: 'DEBUG',
          message: 'This is a DEBUG log with both pesistent and temporary keys',
          sampling_rate: 0,
          service: 'hello-world',
          timestamp: '2016-06-20T12:08:10.000Z',
          xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
          foo: 'bar',
          biz: 'baz',
        })
      );
      const log2 = JSON.parse(debugSpy.mock.calls[1][0]);
      expect(log2).toStrictEqual(
        expect.objectContaining({
          cold_start: true,
          function_arn:
            'arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function',
          function_memory_size: '128',
          function_name: 'foo-bar-function',
          function_request_id: 'c6af9ac6-7b61-11e6-9a41-93e812345678',
          level: 'DEBUG',
          message: 'Checking state after handler execution',
          sampling_rate: 0,
          service: 'hello-world',
          timestamp: '2016-06-20T12:08:10.000Z',
          xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
          foo: 'bar',
        })
      );

      debugSpy.mockRestore();
    });

    test('when clearState is enabled, the temporary log attributes added in the handler are cleared when the method throws', async () => {
      // Prepare
      const logger = new Logger({
        logLevel: 'DEBUG',
      });

      const debugSpy = jest.spyOn(logger['console'], 'debug');

      class LambdaFunction implements LambdaInterface {
        @logger.injectLambdaContext({ clearState: true })
        public async handler<TEvent>(
          _event: TEvent,
          _context: Context
        ): Promise<string> {
          // This key is persistent and will stay persistent
          logger.appendPersistentKeys({
            foo: 'bar',
          });
          // This attribute is temporary and will be cleared
          logger.appendKeys({
            biz: 'baz',
          });
          logger.debug(
            'This is a DEBUG log with both pesistent and temporary keys'
          );
          throw new Error('Unexpected error occurred!');
        }
      }
      const handlerClass = new LambdaFunction();
      const handler = handlerClass.handler.bind(handlerClass);

      // Act & Assess
      await expect(handler(event, context)).rejects.toThrow();

      expect(debugSpy).toHaveBeenCalledTimes(1);
      const log = JSON.parse(debugSpy.mock.calls[0][0]);
      expect(log).toStrictEqual(
        expect.objectContaining({
          cold_start: true,
          function_arn:
            'arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function',
          function_memory_size: '128',
          function_name: 'foo-bar-function',
          function_request_id: 'c6af9ac6-7b61-11e6-9a41-93e812345678',
          level: 'DEBUG',
          message: 'This is a DEBUG log with both pesistent and temporary keys',
          sampling_rate: 0,
          service: 'hello-world',
          timestamp: '2016-06-20T12:08:10.000Z',
          xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
          foo: 'bar',
          biz: 'baz',
        })
      );

      expect(logger).toEqual(
        expect.objectContaining({
          persistentLogAttributes: {
            foo: 'bar',
          },
          temporaryLogAttributes: {},
        })
      );

      debugSpy.mockRestore();
    });

    test('when logEvent is enabled, it logs the event in the first log', async () => {
      // Prepare
      const logger = new Logger({
        logLevel: 'DEBUG',
      });
      const consoleSpy = jest.spyOn(logger['console'], 'info');
      class LambdaFunction implements LambdaInterface {
        @logger.injectLambdaContext({ logEvent: true })
        public async handler<TEvent>(
          _event: TEvent,
          _context: Context
        ): Promise<void> {
          return;
        }
      }
      const handlerClass = new LambdaFunction();
      const handler = handlerClass.handler.bind(handlerClass);

      // Act
      await handler(event, context);

      // Assess
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const log = JSON.parse(consoleSpy.mock.calls[0][0]);
      expect(log).toStrictEqual(
        expect.objectContaining({
          cold_start: true,
          function_arn:
            'arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function',
          function_memory_size: '128',
          function_name: 'foo-bar-function',
          function_request_id: 'c6af9ac6-7b61-11e6-9a41-93e812345678',
          level: 'INFO',
          message: 'Lambda invocation event',
          sampling_rate: 0,
          service: 'hello-world',
          timestamp: '2016-06-20T12:08:10.000Z',
          xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
          event: {
            foo: 'bar',
            bar: 'baz',
          },
        })
      );
    });

    test('when logEvent is enabled via POWERTOOLS_LOGGER_LOG_EVENT env var, it logs the event', async () => {
      // Prepare
      process.env.POWERTOOLS_LOGGER_LOG_EVENT = 'true';
      const logger = new Logger({
        logLevel: 'DEBUG',
      });
      const consoleSpy = jest.spyOn(logger['console'], 'info');
      class LambdaFunction implements LambdaInterface {
        @logger.injectLambdaContext()
        public async handler<TEvent>(
          _event: TEvent,
          _context: Context
        ): Promise<void> {
          return;
        }
      }
      const handlerClass = new LambdaFunction();
      const handler = handlerClass.handler.bind(handlerClass);

      // Act
      await handler(event, context);

      // Assess
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const log = JSON.parse(consoleSpy.mock.calls[0][0]);
      expect(log).toStrictEqual(
        expect.objectContaining({
          cold_start: true,
          function_arn:
            'arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function',
          function_memory_size: '128',
          function_name: 'foo-bar-function',
          function_request_id: 'c6af9ac6-7b61-11e6-9a41-93e812345678',
          level: 'INFO',
          message: 'Lambda invocation event',
          sampling_rate: 0,
          service: 'hello-world',
          timestamp: '2016-06-20T12:08:10.000Z',
          xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
          event: {
            foo: 'bar',
            bar: 'baz',
          },
        })
      );
    });

    test('it preserves the value of `this` of the decorated method/class', async () => {
      // Prepare
      const logger = new Logger({
        logLevel: 'DEBUG',
      });
      const consoleSpy = jest.spyOn(logger['console'], 'info');
      class LambdaFunction implements LambdaInterface {
        private readonly memberVariable: string;

        public constructor(memberVariable: string) {
          this.memberVariable = memberVariable;
        }

        @logger.injectLambdaContext()
        public async handler<TEvent>(
          _event: TEvent,
          _context: Context
        ): Promise<void> {
          this.dummyMethod();

          return;
        }

        private dummyMethod(): void {
          logger.info({ message: `memberVariable:${this.memberVariable}` });
        }
      }
      const lambda = new LambdaFunction('someValue');
      const handler = lambda.handler.bind(lambda);

      // Act
      await handler({}, context);

      // Assess
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const log = JSON.parse(consoleSpy.mock.calls[0][0]);
      expect(log).toStrictEqual(
        expect.objectContaining({
          cold_start: true,
          function_arn:
            'arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function',
          function_memory_size: '128',
          function_name: 'foo-bar-function',
          function_request_id: 'c6af9ac6-7b61-11e6-9a41-93e812345678',
          level: 'INFO',
          message: 'memberVariable:someValue',
          sampling_rate: 0,
          service: 'hello-world',
          timestamp: '2016-06-20T12:08:10.000Z',
          xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
        })
      );
    });

    test('it awaits the decorated method correctly', async () => {
      // Prepare
      const logger = new Logger({
        logLevel: 'DEBUG',
      });
      const resetKeysSpy = jest.spyOn(logger, 'resetKeys');
      const consoleSpy = jest.spyOn(logger['console'], 'info');
      class LambdaFunction implements LambdaInterface {
        @logger.injectLambdaContext({ clearState: true })
        public async handler(
          _event: unknown,
          _context: unknown
        ): Promise<unknown> {
          await this.dummyMethod();
          logger.info('This is a DEBUG log');

          return;
        }

        private async dummyMethod(): Promise<void> {
          return;
        }
      }
      const lambda = new LambdaFunction();
      const handler = lambda.handler.bind(lambda);

      // Act
      await handler({}, context);

      // Assess
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      // Here we assert that the logger.info method is called before the cleanup function that should always
      // be called ONLY after the handler has returned. If logger.info is called after the cleanup function
      // it means the decorator is NOT awaiting the handler which would cause the test to fail.
      expect(consoleSpy.mock.invocationCallOrder[0]).toBeLessThan(
        resetKeysSpy.mock.invocationCallOrder[0]
      );
    });

    test('when logEvent and clearState are both TRUE, and the logger has persistent attributes, any key added with appendKeys() in the handler is cleared properly', async () => {
      // Prepare
      const logger = new Logger({
        persistentKeys: {
          version: '1.0.0',
        },
      });
      const consoleSpy = jest.spyOn(logger['console'], 'info');
      class LambdaFunction implements LambdaInterface {
        @logger.injectLambdaContext({ clearState: true, logEvent: true })
        public async handler(
          event: { foo: string },
          _context: unknown
        ): Promise<unknown> {
          logger.appendKeys({ foo: event.foo });

          return;
        }
      }
      const lambda = new LambdaFunction();
      const handler = lambda.handler.bind(lambda);

      // Act
      await handler({ foo: 'bar' }, {} as Context);
      await handler({ foo: 'baz' }, {} as Context);
      await handler({ foo: 'biz' }, {} as Context);
      await handler({ foo: 'buz' }, {} as Context);
      await handler({ foo: 'boz' }, {} as Context);

      expect(consoleSpy).toBeCalledTimes(5);
      for (let i = 1; i === 5; i++) {
        expect(consoleSpy).toHaveBeenNthCalledWith(
          i,
          expect.stringContaining('"message":"Lambda invocation event"')
        );
        expect(consoleSpy).toHaveBeenNthCalledWith(
          i,
          expect.stringContaining('"version":"1.0.0"')
        );
      }
      expect(consoleSpy).toHaveBeenNthCalledWith(
        2,
        expect.not.stringContaining('"foo":"bar"')
      );
      expect(consoleSpy).toHaveBeenNthCalledWith(
        3,
        expect.not.stringContaining('"foo":"baz"')
      );
      expect(consoleSpy).toHaveBeenNthCalledWith(
        4,
        expect.not.stringContaining('"foo":"biz"')
      );
      expect(consoleSpy).toHaveBeenNthCalledWith(
        5,
        expect.not.stringContaining('"foo":"buz"')
      );
    });
  });

  describe('Method: createChild', () => {
    test('child and grandchild loggers should have all the options of its ancestor', () => {
      // Prepare
      const INDENTATION = LogJsonIndent.COMPACT;
      const loggerOptions = {
        serviceName: 'parent-service-name',
        sampleRateValue: 0,
      };
      const parentLogger = new Logger(loggerOptions);

      // Act
      const childLoggerOptions = { sampleRateValue: 1 };
      const childLogger = parentLogger.createChild(childLoggerOptions);

      const grandchildLoggerOptions = { serviceName: 'grandchild-logger-name' };
      const grandchildLogger = childLogger.createChild(grandchildLoggerOptions);

      // Assess
      expect(parentLogger === childLogger).toBe(false);
      expect(childLogger === grandchildLogger).toBe(false);
      expect(parentLogger === grandchildLogger).toBe(false);

      expect(parentLogger).toEqual({
        console: expect.objectContaining({
          debug: expect.any(Function),
          error: expect.any(Function),
          info: expect.any(Function),
          warn: expect.any(Function),
        }),
        coldStart: true,
        customConfigService: undefined,
        defaultServiceName: 'service_undefined',
        envVarsService: expect.any(EnvironmentVariablesService),
        logEvent: false,
        logIndentation: INDENTATION,
        logFormatter: expect.any(PowertoolsLogFormatter),
        logLevel: 8,
        logLevelThresholds: {
          ...logLevelThresholds,
        },
        persistentLogAttributes: {},
        temporaryLogAttributes: {},
        powertoolsLogData: {
          awsRegion: 'eu-west-1',
          environment: '',
          sampleRateValue: 0,
          serviceName: 'parent-service-name',
        },
      });

      expect(childLogger).toEqual({
        console: expect.objectContaining({
          debug: expect.any(Function),
          error: expect.any(Function),
          info: expect.any(Function),
          warn: expect.any(Function),
        }),
        coldStart: true,
        customConfigService: undefined,
        defaultServiceName: 'service_undefined',
        envVarsService: expect.any(EnvironmentVariablesService),
        logEvent: false,
        logIndentation: INDENTATION,
        logFormatter: expect.any(PowertoolsLogFormatter),
        logLevel: 8,
        logLevelThresholds: {
          ...logLevelThresholds,
        },
        persistentLogAttributes: {},
        temporaryLogAttributes: {},
        powertoolsLogData: {
          awsRegion: 'eu-west-1',
          environment: '',
          sampleRateValue: 1,
          serviceName: 'parent-service-name',
        },
      });

      expect(grandchildLogger).toEqual({
        console: expect.objectContaining({
          debug: expect.any(Function),
          error: expect.any(Function),
          info: expect.any(Function),
          warn: expect.any(Function),
        }),
        coldStart: true,
        customConfigService: undefined,
        defaultServiceName: 'service_undefined',
        envVarsService: expect.any(EnvironmentVariablesService),
        logEvent: false,
        logIndentation: INDENTATION,
        logFormatter: expect.any(PowertoolsLogFormatter),
        logLevel: 8,
        logLevelThresholds: {
          ...logLevelThresholds,
        },
        persistentLogAttributes: {},
        temporaryLogAttributes: {},
        powertoolsLogData: {
          awsRegion: 'eu-west-1',
          environment: '',
          sampleRateValue: 1,
          serviceName: 'grandchild-logger-name',
        },
      });
    });

    test('child logger should be a DISTINCT clone of the logger instance', () => {
      // Prepare
      const INDENTATION = LogJsonIndent.COMPACT;
      const parentLogger = new Logger();

      // Act
      const childLogger = parentLogger.createChild();

      const optionsWithPermanentAttributes = {
        persistentLogAttributes: {
          extra:
            'This is an attribute that will be logged only by the child logger',
        },
      };
      const childLoggerWithPermanentAttributes = parentLogger.createChild(
        optionsWithPermanentAttributes
      );

      const optionsWithSampleRateEnabled = {
        sampleRateValue: 1,
      };
      const childLoggerWithSampleRateEnabled = parentLogger.createChild(
        optionsWithSampleRateEnabled
      );

      const optionsWithErrorLogLevel: ConstructorOptions = {
        logLevel: 'ERROR',
      };
      const childLoggerWithErrorLogLevel = parentLogger.createChild(
        optionsWithErrorLogLevel
      );

      // Assess
      expect(parentLogger === childLogger).toBe(false);
      expect(childLogger).toEqual({
        ...parentLogger,
        console: expect.objectContaining({
          debug: expect.any(Function),
          error: expect.any(Function),
          info: expect.any(Function),
          warn: expect.any(Function),
        }),
      });
      expect(parentLogger === childLoggerWithPermanentAttributes).toBe(false);
      expect(parentLogger === childLoggerWithSampleRateEnabled).toBe(false);
      expect(parentLogger === childLoggerWithErrorLogLevel).toBe(false);

      expect(parentLogger).toEqual({
        console: expect.objectContaining({
          debug: expect.any(Function),
          error: expect.any(Function),
          info: expect.any(Function),
          warn: expect.any(Function),
        }),
        coldStart: true,
        customConfigService: undefined,
        defaultServiceName: 'service_undefined',
        envVarsService: expect.any(EnvironmentVariablesService),
        logEvent: false,
        logIndentation: INDENTATION,
        logFormatter: expect.any(PowertoolsLogFormatter),
        logLevel: 8,
        logLevelThresholds: {
          ...logLevelThresholds,
        },
        persistentLogAttributes: {},
        temporaryLogAttributes: {},
        powertoolsLogData: {
          awsRegion: 'eu-west-1',
          environment: '',
          sampleRateValue: 0,
          serviceName: 'hello-world',
        },
      });

      expect(childLoggerWithPermanentAttributes).toEqual({
        console: expect.objectContaining({
          debug: expect.any(Function),
          error: expect.any(Function),
          info: expect.any(Function),
          warn: expect.any(Function),
        }),
        coldStart: true,
        customConfigService: undefined,
        defaultServiceName: 'service_undefined',
        envVarsService: expect.any(EnvironmentVariablesService),
        logEvent: false,
        logIndentation: INDENTATION,
        logFormatter: expect.any(PowertoolsLogFormatter),
        logLevel: 8,
        logLevelThresholds: {
          ...logLevelThresholds,
        },
        persistentLogAttributes: {
          extra:
            'This is an attribute that will be logged only by the child logger',
        },
        temporaryLogAttributes: {},
        powertoolsLogData: {
          awsRegion: 'eu-west-1',
          environment: '',
          sampleRateValue: 0,
          serviceName: 'hello-world',
        },
      });

      expect(childLoggerWithSampleRateEnabled).toEqual({
        console: expect.objectContaining({
          debug: expect.any(Function),
          error: expect.any(Function),
          info: expect.any(Function),
          warn: expect.any(Function),
        }),
        coldStart: true,
        customConfigService: undefined,
        defaultServiceName: 'service_undefined',
        envVarsService: expect.any(EnvironmentVariablesService),
        logEvent: false,
        logIndentation: INDENTATION,
        logFormatter: expect.any(PowertoolsLogFormatter),
        logLevel: 8,
        logLevelThresholds: {
          ...logLevelThresholds,
        },
        persistentLogAttributes: {},
        temporaryLogAttributes: {},
        powertoolsLogData: {
          awsRegion: 'eu-west-1',
          environment: '',
          sampleRateValue: 1,
          serviceName: 'hello-world',
        },
      });

      expect(childLoggerWithErrorLogLevel).toEqual({
        console: expect.objectContaining({
          debug: expect.any(Function),
          error: expect.any(Function),
          info: expect.any(Function),
          warn: expect.any(Function),
        }),
        coldStart: true,
        customConfigService: undefined,
        defaultServiceName: 'service_undefined',
        envVarsService: expect.any(EnvironmentVariablesService),
        logEvent: false,
        logIndentation: INDENTATION,
        logFormatter: expect.any(PowertoolsLogFormatter),
        logLevel: 20,
        logLevelThresholds: {
          ...logLevelThresholds,
        },
        persistentLogAttributes: {},
        temporaryLogAttributes: {},
        powertoolsLogData: {
          awsRegion: 'eu-west-1',
          environment: '',
          sampleRateValue: 0,
          serviceName: 'hello-world',
        },
      });
    });

    test('child logger should have same keys in persistentLogAttributes as its parent', () => {
      // Prepare
      const parentLogger = new Logger();
      const childLogger = parentLogger.createChild();

      // Act
      parentLogger.appendPersistentKeys({
        aws_account_id: '123456789012',
        aws_region: 'eu-west-1',
        logger: {
          name: 'aws-lambda-powertool-typescript',
          version: '0.2.4',
        },
        test_key: 'key-for-test',
      });
      const childLoggerWithKeys = parentLogger.createChild();

      // Assess
      expect(childLogger.getPersistentLogAttributes()).toEqual({});

      expect(childLoggerWithKeys.getPersistentLogAttributes()).toEqual({
        aws_account_id: '123456789012',
        aws_region: 'eu-west-1',
        logger: {
          name: 'aws-lambda-powertool-typescript',
          version: '0.2.4',
        },
        test_key: 'key-for-test',
      });

      expect(parentLogger.getPersistentLogAttributes()).toEqual({
        aws_account_id: '123456789012',
        aws_region: 'eu-west-1',
        logger: {
          name: 'aws-lambda-powertool-typescript',
          version: '0.2.4',
        },
        test_key: 'key-for-test',
      });
    });

    test('child logger should have same context as its parent', () => {
      // Prepare
      const parentLogger = new Logger();

      // Act
      parentLogger.addContext(context);
      const childLoggerWithContext = parentLogger.createChild();

      // Assess
      expect(childLoggerWithContext).toEqual(
        expect.objectContaining({
          coldStart: false, // This is now false because the `coldStart` attribute has been already accessed once by the `addContext` method
          powertoolsLogData: {
            awsRegion: 'eu-west-1',
            environment: '',
            lambdaContext: {
              awsRequestId: 'c6af9ac6-7b61-11e6-9a41-93e812345678',
              coldStart: true,
              functionName: 'foo-bar-function',
              functionVersion: '$LATEST',
              invokedFunctionArn:
                'arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function',
              memoryLimitInMB: '128',
            },
            sampleRateValue: 0,
            serviceName: 'hello-world',
          },
        })
      );
    });

    test('child logger should have the same logFormatter as its parent', () => {
      // Prepare
      class MyCustomLogFormatter extends PowertoolsLogFormatter {}
      const parentLogger = new Logger({
        logFormatter: new MyCustomLogFormatter(),
      });

      // Act
      const childLoggerWithParentLogFormatter = parentLogger.createChild();

      // Assess
      expect(childLoggerWithParentLogFormatter).toEqual(
        expect.objectContaining({
          logFormatter: expect.any(MyCustomLogFormatter),
        })
      );
    });

    test('child logger with custom logFormatter in options should have provided logFormatter', () => {
      // Prepare
      class MyCustomLogFormatter extends PowertoolsLogFormatter {}
      const parentLogger = new Logger();

      // Act
      const childLoggerWithCustomLogFormatter = parentLogger.createChild({
        logFormatter: new MyCustomLogFormatter(),
      });

      // Assess
      expect(parentLogger).toEqual(
        expect.objectContaining({
          logFormatter: expect.any(PowertoolsLogFormatter),
        })
      );

      expect(childLoggerWithCustomLogFormatter).toEqual(
        expect.objectContaining({
          logFormatter: expect.any(MyCustomLogFormatter),
        })
      );
    });

    test('child logger should have exact same attributes as the parent logger created with all non-default options', () => {
      // Prepare
      class MyCustomLogFormatter extends PowertoolsLogFormatter {}
      class MyCustomEnvironmentVariablesService extends EnvironmentVariablesService {}

      const options: ConstructorOptions = {
        logLevel: 'ERROR',
        serviceName: 'test-service-name',
        sampleRateValue: 1,
        logFormatter: new MyCustomLogFormatter(),
        customConfigService: new MyCustomEnvironmentVariablesService(),
        persistentLogAttributes: {
          aws_account_id: '1234567890',
          aws_region: 'eu-west-1',
        },
        environment: 'local',
      };
      const parentLogger = new Logger(options);

      // Act
      const childLogger = parentLogger.createChild();

      // Assess
      expect(childLogger).toEqual({
        ...parentLogger,
        console: expect.objectContaining({
          debug: expect.any(Function),
          error: expect.any(Function),
          info: expect.any(Function),
          warn: expect.any(Function),
        }),
      });

      expect(childLogger).toEqual(
        expect.objectContaining({
          logFormatter: expect.any(MyCustomLogFormatter),
        })
      );

      expect(childLogger).toEqual(
        expect.objectContaining({
          customConfigService: expect.any(MyCustomEnvironmentVariablesService),
        })
      );
    });
  });

  describe('Method: logEventIfEnabled', () => {
    test('When the feature is disabled, it DOES NOT log the event', () => {
      // Prepare
      const logger = new Logger();
      const consoleSpy = jest.spyOn(logger['console'], 'info');
      // Act
      logger.logEventIfEnabled(event);

      // Assess
      expect(consoleSpy).toBeCalledTimes(0);
    });

    test('When the feature is enabled via overwrite flag, it DOES log the event', () => {
      // Prepare
      const event = {
        something: 'happened!',
      };
      const logger = new Logger();
      const consoleSpy = jest.spyOn(logger['console'], 'info');
      // Act
      logger.logEventIfEnabled(event, true);

      // Assess
      expect(consoleSpy).toBeCalledTimes(1);
      expect(consoleSpy).toHaveBeenNthCalledWith(
        1,
        JSON.stringify({
          level: 'INFO',
          message: 'Lambda invocation event',
          sampling_rate: 0,
          service: 'hello-world',
          timestamp: '2016-06-20T12:08:10.000Z',
          xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
          event: {
            something: 'happened!',
          },
        })
      );
    });
  });

  describe('Feature: Pretty indentation for a local or non-production environment', () => {
    test('when the `POWERTOOLS_DEV` env var is SET it makes log output has multiple lines', () => {
      // Prepare
      process.env.POWERTOOLS_DEV = 'true';
      const INDENTATION = LogJsonIndent.PRETTY;
      const logger = new Logger();
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();

      // Act
      logger.info('Message with pretty identation');

      // Assess
      expect(consoleSpy).toBeCalledTimes(1);
      expect(consoleSpy).toHaveBeenNthCalledWith(
        1,
        JSON.stringify(
          {
            level: 'INFO',
            message: 'Message with pretty identation',
            sampling_rate: 0,
            service: 'hello-world',
            timestamp: '2016-06-20T12:08:10.000Z',
            xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
          },
          null,
          INDENTATION
        )
      );
    });

    test('when the `POWERTOOLS_DEV` env var is NOT SET it makes log output as one-liner', () => {
      // Prepare
      const logger = new Logger();
      const consoleSpy = jest.spyOn(logger['console'], 'info');
      // Act
      logger.info('Message without pretty identation');

      // Assess
      expect(consoleSpy).toBeCalledTimes(1);
      expect(consoleSpy).toHaveBeenNthCalledWith(
        1,
        JSON.stringify({
          level: 'INFO',
          message: 'Message without pretty identation',
          sampling_rate: 0,
          service: 'hello-world',
          timestamp: '2016-06-20T12:08:10.000Z',
          xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
        })
      );
    });
  });

  describe('Method: setConsole()', () => {
    test('When the `POWERTOOLS_DEV` env var is SET console object is set to the global node console otherwise to the instance of the internal version of console', () => {
      // Prepare
      const logger = new Logger();
      process.env.POWERTOOLS_DEV = 'true';
      const devLogger = new Logger();

      // Assess
      expect(devLogger).toEqual({
        ...devLogger,
        console: console,
      });
      // since instances of a class are not equal objects,
      // we assert the opposite – console is not the global node object
      expect(logger).not.toEqual({
        ...logger,
        console: console,
      });
    });
  });

  describe('Method: setLogLevel', () => {
    test('it sets the correct log level provided', () => {
      // Prepare
      const logger = new Logger();

      // Act
      logger.setLogLevel('ERROR');

      // Assess
      expect(logger.level).toBe(20);
      expect(logger.getLevelName()).toBe('ERROR');
    });

    test('it throws when passed an invalid log level name', () => {
      // Prepare
      const logger = new Logger();

      // Act & Assess
      expect(() => logger.setLogLevel('INVALID' as LogLevel)).toThrow(
        'Invalid log level: INVALID'
      );
    });

    test('it uses log level set by ALC & emits a warning when setting a higher log level than ALC', () => {
      // Prepare
      process.env.AWS_LAMBDA_LOG_LEVEL = 'ERROR';
      process.env.LOG_LEVEL = undefined;
      process.env.POWERTOOLS_LOG_LEVEL = undefined;
      const logger = new Logger();
      const warningSpy = jest.spyOn(logger, 'warn');

      // Act
      logger.setLogLevel('WARN');

      // Assess
      expect(logger.level).toBe(20);
      expect(logger.getLevelName()).toBe('ERROR');
      expect(warningSpy).toHaveBeenCalledTimes(1);
      expect(warningSpy).toHaveBeenCalledWith(
        'Current log level (WARN) does not match AWS Lambda Advanced Logging Controls minimum log level (ERROR). This can lead to data loss, consider adjusting them.'
      );
    });

    test('it uses log level set by ALC & emits a warning when initializing with a higher log level than ALC', () => {
      // Prepare
      process.env.AWS_LAMBDA_LOG_LEVEL = 'INFO';
      process.env.LOG_LEVEL = undefined;
      process.env.POWERTOOLS_LOG_LEVEL = undefined;
      // Since the buffer is private and we are bypassing the public warn method, we need to spy on the console.warn
      process.env.POWERTOOLS_DEV = 'true';
      const warningSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Act
      const logger = new Logger({ logLevel: 'DEBUG' });

      // Assess
      expect(logger.level).toBe(12);
      expect(logger.getLevelName()).toBe('INFO');
      expect(warningSpy).toHaveBeenCalledTimes(1);
      expect(warningSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Current log level (DEBUG) does not match AWS Lambda Advanced Logging Controls minimum log level (INFO). This can lead to data loss, consider adjusting them.'
        )
      );
    });
  });

  describe('Feature: Sampling debug logs', () => {
    test('when sample rate is set in constructor, it DOES change log level to DEBUG', () => {
      // Prepare & Act
      const logger: Logger = new Logger({
        logLevel: 'ERROR',
        sampleRateValue: 1,
      });

      // Assess
      expect(logger.level).toBe(8);
      expect(logger.getLevelName()).toBe('DEBUG');
    });

    test('when sample rate is set in custom config service, it DOES change log level to DEBUG', () => {
      // Prepare & Act
      class MyCustomEnvironmentVariablesService extends EnvironmentVariablesService {
        private sampleRateValue = 1;
        public getSampleRateValue(): number {
          return this.sampleRateValue;
        }
      }

      const loggerOptions: ConstructorOptions = {
        logLevel: 'ERROR',
        customConfigService: new MyCustomEnvironmentVariablesService(),
      };
      const logger: Logger = new Logger(loggerOptions);

      // Assess
      expect(logger.level).toBe(8);
      expect(logger.getLevelName()).toBe('DEBUG');
    });

    test('when sample rate is set in environmental variable, it DOES change log level to DEBUG', () => {
      // Prepare & Act
      process.env.POWERTOOLS_LOGGER_SAMPLE_RATE = '1';

      const logger: Logger = new Logger({
        logLevel: 'ERROR',
      });

      // Assess
      expect(logger.level).toBe(8);
      expect(logger.getLevelName()).toBe('DEBUG');
    });

    test('when sample rate is disabled it DOES NOT changes log level to DEBUG', () => {
      // Prepare & Act
      const logger: Logger = new Logger({
        logLevel: 'ERROR',
        sampleRateValue: 0,
      });

      // Assess
      expect(logger.level).toBe(20);
      expect(logger.getLevelName()).toBe('ERROR');
    });

    test('when sample rate is set in constructor, custom config, and environmental variable, it should prioritize constructor value', () => {
      // Prepare
      process.env.POWERTOOLS_LOGGER_SAMPLE_RATE = '0.5';

      class MyCustomEnvironmentVariablesService extends EnvironmentVariablesService {
        private sampleRateValue = 0.75;
        public getSampleRateValue(): number {
          return this.sampleRateValue;
        }
      }
      const loggerOptions: ConstructorOptions = {
        sampleRateValue: 1,
        customConfigService: new MyCustomEnvironmentVariablesService(),
      };
      const logger: Logger = new Logger(loggerOptions);
      const consoleSpy = jest.spyOn(logger['console'], 'info');
      // Act
      logger.info('foo');

      // Assess
      expect(consoleSpy).toBeCalledTimes(1);
      expect(consoleSpy).toHaveBeenNthCalledWith(
        1,
        JSON.stringify({
          level: 'INFO',
          message: 'foo',
          sampling_rate: 1,
          service: 'hello-world',
          timestamp: '2016-06-20T12:08:10.000Z',
          xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
        })
      );
    });

    test('when sample rate is set in custom config and environmental variable, it should prioritize custom config value', () => {
      // Prepare
      process.env.POWERTOOLS_LOGGER_SAMPLE_RATE = '0.75';

      class MyCustomEnvironmentVariablesService extends EnvironmentVariablesService {
        private sampleRateValue = 1;
        public getSampleRateValue(): number {
          return this.sampleRateValue;
        }
      }
      const loggerOptions: ConstructorOptions = {
        customConfigService: new MyCustomEnvironmentVariablesService(),
      };
      const logger: Logger = new Logger(loggerOptions);
      const consoleSpy = jest.spyOn(logger['console'], 'info');
      // Act
      logger.info('foo');

      // Assess
      expect(consoleSpy).toBeCalledTimes(1);
      expect(consoleSpy).toHaveBeenNthCalledWith(
        1,
        JSON.stringify({
          level: 'INFO',
          message: 'foo',
          sampling_rate: 1,
          service: 'hello-world',
          timestamp: '2016-06-20T12:08:10.000Z',
          xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
        })
      );
    });

    test('when sample rate is set in environmental variable, it should use POWERTOOLS_LOGGER_SAMPLE_RATE value', () => {
      // Prepare
      process.env.POWERTOOLS_LOGGER_SAMPLE_RATE = '1';
      const logger: Logger = new Logger();
      const consoleSpy = jest.spyOn(logger['console'], 'debug');
      // Act
      logger.debug('foo');

      // Assess
      expect(consoleSpy).toBeCalledTimes(2);
      expect(consoleSpy).toHaveBeenNthCalledWith(
        1,
        JSON.stringify({
          level: 'DEBUG',
          message: 'Setting log level to DEBUG due to sampling rate',
          sampling_rate: 1,
          service: 'hello-world',
          timestamp: '2016-06-20T12:08:10.000Z',
          xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
        })
      );
      expect(consoleSpy).toHaveBeenNthCalledWith(
        2,
        JSON.stringify({
          level: 'DEBUG',
          message: 'foo',
          sampling_rate: 1,
          service: 'hello-world',
          timestamp: '2016-06-20T12:08:10.000Z',
          xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
        })
      );
    });

    test('when sample rate is set in custom config service, it should use custom config service value', () => {
      // Prepare
      class MyCustomEnvironmentVariablesService extends EnvironmentVariablesService {
        private sampleRateValue = 1;
        public getSampleRateValue(): number {
          return this.sampleRateValue;
        }
      }
      const loggerOptions: ConstructorOptions = {
        customConfigService: new MyCustomEnvironmentVariablesService(),
      };

      const logger: Logger = new Logger(loggerOptions);
      const consoleSpy = jest.spyOn(logger['console'], 'info');
      // Act
      logger.info('foo');

      // Assess
      expect(consoleSpy).toBeCalledTimes(1);
      expect(consoleSpy).toHaveBeenNthCalledWith(
        1,
        JSON.stringify({
          level: 'INFO',
          message: 'foo',
          sampling_rate: 1,
          service: 'hello-world',
          timestamp: '2016-06-20T12:08:10.000Z',
          xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
        })
      );
    });

    test('when sample rate in constructor is out of expected range, it should be ignored', () => {
      // Prepare
      const logger: Logger = new Logger({
        logLevel: 'INFO',
        sampleRateValue: 42,
      });
      const consoleSpy = jest.spyOn(logger['console'], 'info');
      // Act
      logger.info('foo');

      // Assess
      expect(consoleSpy).toBeCalledTimes(1);
      expect(consoleSpy).toHaveBeenNthCalledWith(
        1,
        JSON.stringify({
          level: 'INFO',
          message: 'foo',
          sampling_rate: 0,
          service: 'hello-world',
          timestamp: '2016-06-20T12:08:10.000Z',
          xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
        })
      );
    });

    test('when sample rate in custom config service is out of expected range, it should be ignored', () => {
      // Prepare
      class MyCustomEnvironmentVariablesService extends EnvironmentVariablesService {
        private sampleRateValue = 42;
        public getSampleRateValue(): number {
          return this.sampleRateValue;
        }
      }
      const loggerOptions: ConstructorOptions = {
        logLevel: 'INFO',
        customConfigService: new MyCustomEnvironmentVariablesService(),
      };

      const logger: Logger = new Logger(loggerOptions);
      const consoleSpy = jest.spyOn(logger['console'], 'info');
      // Act
      logger.info('foo');

      // Assess
      expect(consoleSpy).toBeCalledTimes(1);
      expect(consoleSpy).toHaveBeenNthCalledWith(
        1,
        JSON.stringify({
          level: 'INFO',
          message: 'foo',
          sampling_rate: 0,
          service: 'hello-world',
          timestamp: '2016-06-20T12:08:10.000Z',
          xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
        })
      );
    });

    test('when sample rate in environmental variable is out of expected range, it should be ignored', () => {
      // Prepare
      process.env.POWERTOOLS_LOGGER_SAMPLE_RATE = '42';
      const logger: Logger = new Logger({
        logLevel: 'INFO',
      });
      const consoleSpy = jest.spyOn(logger['console'], 'info');
      // Act
      logger.info('foo');

      // Assess
      expect(consoleSpy).toBeCalledTimes(1);
      expect(consoleSpy).toHaveBeenNthCalledWith(
        1,
        JSON.stringify({
          level: 'INFO',
          message: 'foo',
          sampling_rate: 0,
          service: 'hello-world',
          timestamp: '2016-06-20T12:08:10.000Z',
          xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
        })
      );
    });

    test('logs a DEBUG log when the sample rate sets the level to DEBUG', () => {
      // Prepare
      // Since the buffer is private and we are bypassing the public warn method, we need to spy on the console.warn
      process.env.POWERTOOLS_DEV = 'true';
      const debugSpy = jest.spyOn(console, 'debug').mockImplementation();

      // Act
      new Logger({ sampleRateValue: 1 });

      // Assess
      expect(debugSpy).toHaveBeenCalledTimes(1);
      expect(debugSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Setting log level to DEBUG due to sampling rate'
        )
      );
    });

    describe('Method: refreshSampleRateCalculation', () => {
      test('when sample rate calculation is refreshed, it DOES NOT overwrite the sample rate value', () => {
        // Prepare
        const logger = new Logger({
          logLevel: 'INFO',
          sampleRateValue: 1,
        });
        const consoleSpy = jest.spyOn(logger['console'], 'info');
        // Act
        logger.refreshSampleRateCalculation();
        logger.info('foo');

        // Assess
        expect(consoleSpy).toBeCalledTimes(1);
        expect(consoleSpy).toHaveBeenNthCalledWith(
          1,
          JSON.stringify({
            level: 'INFO',
            message: 'foo',
            sampling_rate: 1,
            service: 'hello-world',
            timestamp: '2016-06-20T12:08:10.000Z',
            xray_trace_id: '1-5759e988-bd862e3fe1be46a994272793',
          })
        );
      });

      test('when sample rate calculation is refreshed, it respects probability sampling and change log level to DEBUG ', () => {
        // Prepare
        const logger = new Logger({
          logLevel: 'ERROR',
          sampleRateValue: 0.1, // 10% probability
        });

        let logLevelChangedToDebug = 0;
        const numOfIterations = 1000;
        const minExpected = numOfIterations * 0.05; // Min expected based on 5% probability
        const maxExpected = numOfIterations * 0.15; // Max expected based on 15% probability

        // Act
        for (let i = 0; i < numOfIterations; i++) {
          logger.refreshSampleRateCalculation();
          if (logger.getLevelName() === 'DEBUG') {
            logLevelChangedToDebug++;
          }
        }

        // Assess
        expect(logLevelChangedToDebug).toBeGreaterThanOrEqual(minExpected);
        expect(logLevelChangedToDebug).toBeLessThanOrEqual(maxExpected);
      });
    });
  });
});
