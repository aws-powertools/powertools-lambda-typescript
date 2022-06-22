/**
 * Test Logger helpers
 *
 * @group unit/logger/all
 */

import { Console } from 'console';
import { ConfigServiceInterface, EnvironmentVariablesService } from '../../src/config';
import { LogFormatter, PowertoolLogFormatter } from '../../src/formatter';
import { ConstructorOptions } from '../../src/types';
import { createLogger, Logger } from './../../src';

describe('Helper: createLogger function', () => {

  const ENVIRONMENT_VARIABLES = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ENVIRONMENT_VARIABLES };
  });

  afterAll(() => {
    process.env = ENVIRONMENT_VARIABLES;
  });

  describe('LoggerOptions constructor parameters', () => {

    test('when no constructor parameters are set, returns a Logger instance with the options set in the environment variables', () => {

      // Prepare
      const loggerOptions = undefined;

      // Act
      const logger = createLogger(loggerOptions);

      // Assess
      expect(logger).toBeInstanceOf(Logger);
      expect(logger).toEqual(expect.objectContaining({
        logsSampled: false,
        persistentLogAttributes: {},
        powertoolLogData: {
          sampleRateValue: undefined,
          awsRegion: 'eu-west-1',
          environment: '',
          serviceName: 'hello-world',
        },
        envVarsService: expect.any(EnvironmentVariablesService),
        customConfigService: undefined,
        logLevel: 'DEBUG',
        logFormatter: expect.any(PowertoolLogFormatter),
      }));

    });

    test('when no parameters are set, returns a Logger instance with the correct proprieties', () => {

      // Prepare
      const loggerOptions = {
        logLevel: 'WARN',
        serviceName: 'my-lambda-service',
        sampleRateValue: 1,
        logFormatter: new PowertoolLogFormatter(),
        customConfigService: new EnvironmentVariablesService(),
        persistentLogAttributes: {
          awsAccountId: '123456789',
        },
        environment: 'prod',
      };

      // Act
      const logger = createLogger(loggerOptions);

      // Assess
      expect(logger).toBeInstanceOf(Logger);
      expect(logger).toEqual({
        coldStart: true,
        customConfigService: expect.any(EnvironmentVariablesService),
        envVarsService: expect.any(EnvironmentVariablesService),
        logFormatter: expect.any(PowertoolLogFormatter),
        logLevel: 'WARN',
        console: expect.any(Console),
        logLevelThresholds: {
          DEBUG: 8,
          ERROR: 20,
          INFO: 12,
          WARN: 16,
        },
        logsSampled: true,
        persistentLogAttributes: {
          awsAccountId: '123456789',
        },
        powertoolLogData: {
          awsRegion: 'eu-west-1',
          environment: 'prod',
          sampleRateValue: 1,
          serviceName: 'my-lambda-service',
        },
      });

    });

    test('when no constructor parameters and no environment variables are set, returns a Logger instance with the default proprieties', () => {

      // Prepare
      const loggerOptions = undefined;
      delete process.env.POWERTOOLS_SERVICE_NAME;
      delete process.env.LOG_LEVEL;

      // Act
      const logger = createLogger(loggerOptions);

      // Assess
      expect(logger).toBeInstanceOf(Logger);
      expect(logger).toEqual({
        coldStart: true,
        customConfigService: undefined,
        envVarsService: expect.any(EnvironmentVariablesService),
        logFormatter: expect.any(PowertoolLogFormatter),
        logLevel: 'INFO',
        console: expect.any(Console),
        logLevelThresholds: {
          DEBUG: 8,
          ERROR: 20,
          INFO: 12,
          WARN: 16,
        },
        logsSampled: false,
        persistentLogAttributes: {},
        powertoolLogData: {
          awsRegion: 'eu-west-1',
          environment: '',
          sampleRateValue: undefined,
          serviceName: 'service_undefined',
        },
      });

    });

    test('when a custom logFormatter is passed, returns a Logger instance with the correct proprieties', () => {

      // Prepare
      const loggerOptions:ConstructorOptions = {
        logFormatter: expect.any(LogFormatter),
      };

      // Act
      const logger = createLogger(loggerOptions);

      // Assess
      expect(logger).toBeInstanceOf(Logger);
      expect(logger).toEqual(expect.objectContaining({
        logsSampled: false,
        persistentLogAttributes: {},
        powertoolLogData: {
          sampleRateValue: undefined,
          awsRegion: 'eu-west-1',
          environment: '',
          serviceName: 'hello-world',
        },
        envVarsService: expect.any(EnvironmentVariablesService),
        customConfigService: undefined,
        logLevel: 'DEBUG',
        logFormatter: expect.any(LogFormatter),
      }));
    });

    test('when a custom serviceName is passed, returns a Logger instance with the correct proprieties', () => {

      // Prepare
      const loggerOptions:ConstructorOptions = {
        serviceName: 'my-backend-service',
      };

      // Act
      const logger = createLogger(loggerOptions);

      // Assess
      expect(logger).toBeInstanceOf(Logger);
      expect(logger).toEqual(expect.objectContaining({
        logsSampled: false,
        persistentLogAttributes: {},
        powertoolLogData: {
          sampleRateValue: undefined,
          awsRegion: 'eu-west-1',
          environment: '',
          serviceName: 'my-backend-service',
        },
        envVarsService: expect.any(EnvironmentVariablesService),
        customConfigService: undefined,
        logLevel: 'DEBUG',
        logFormatter: {},
      }));
    });

    test('when a custom logLevel is passed, returns a Logger instance with the correct proprieties', () => {

      // Prepare
      const loggerOptions:ConstructorOptions = {
        logLevel: 'ERROR',
      };

      // Act
      const logger = createLogger(loggerOptions);

      // Assess
      expect(logger).toBeInstanceOf(Logger);
      expect(logger).toEqual(expect.objectContaining({
        logsSampled: false,
        persistentLogAttributes: {},
        powertoolLogData: {
          sampleRateValue: undefined,
          awsRegion: 'eu-west-1',
          environment: '',
          serviceName: 'hello-world',
        },
        envVarsService: expect.any(EnvironmentVariablesService),
        customConfigService: undefined,
        logLevel: 'ERROR',
        logFormatter: expect.any(PowertoolLogFormatter),
      }));
    });

    test('when no log level is set, returns a Logger instance with INFO level', () => {

      // Prepare
      const loggerOptions:ConstructorOptions = {};
      delete process.env.LOG_LEVEL;

      // Act
      const logger = createLogger(loggerOptions);

      // Assess
      expect(logger).toBeInstanceOf(Logger);
      expect(logger).toEqual({
        coldStart: true,
        customConfigService: undefined,
        envVarsService: expect.any(EnvironmentVariablesService),
        logFormatter: expect.any(PowertoolLogFormatter),
        logLevel: 'INFO',
        console: expect.any(Console),
        logLevelThresholds: {
          DEBUG: 8,
          ERROR: 20,
          INFO: 12,
          WARN: 16,
        },
        logsSampled: false,
        persistentLogAttributes: {},
        powertoolLogData: {
          awsRegion: 'eu-west-1',
          environment: '',
          sampleRateValue: undefined,
          serviceName: 'hello-world',
        },
      });
    });

    test('when a custom sampleRateValue is passed, returns a Logger instance with the correct proprieties', () => {

      // Prepare
      const loggerOptions:ConstructorOptions = {
        sampleRateValue: 1,
      };

      // Act
      const logger = createLogger(loggerOptions);

      // Assess
      expect(logger).toBeInstanceOf(Logger);
      expect(logger).toEqual(expect.objectContaining({
        logsSampled: true,
        persistentLogAttributes: {},
        powertoolLogData: {
          sampleRateValue: 1,
          awsRegion: 'eu-west-1',
          environment: '',
          serviceName: 'hello-world',
        },
        envVarsService: expect.any(EnvironmentVariablesService),
        customConfigService: undefined,
        logLevel: 'DEBUG',
        logFormatter: {},
      }));
    });

    test('when a custom customConfigService is passed, returns a Logger instance with the correct proprieties', () => {

      const configService: ConfigServiceInterface = {
        get(name: string): string {
          return `a-string-from-${name}`;
        },
        getCurrentEnvironment(): string {
          return 'dev';
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

      };
      // Prepare
      const loggerOptions:ConstructorOptions = {
        customConfigService: configService,
      };

      // Act
      const logger = createLogger(loggerOptions);

      // Assess
      expect(logger).toBeInstanceOf(Logger);
      expect(logger).toEqual(expect.objectContaining({
        logsSampled: false,
        persistentLogAttributes: {},
        powertoolLogData: {
          sampleRateValue: undefined,
          awsRegion: 'eu-west-1',
          environment: 'dev',
          serviceName: 'my-backend-service',
        },
        envVarsService: expect.any(EnvironmentVariablesService),
        customConfigService: configService,
        logLevel: 'INFO',
        logFormatter: {},
      }));
    });

    test('when custom persistentLogAttributes is passed, returns a Logger instance with the correct proprieties', () => {

      // Prepare
      const loggerOptions:ConstructorOptions = {
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
      const logger = createLogger(loggerOptions);

      // Assess
      expect(logger).toBeInstanceOf(Logger);
      expect(logger).toEqual(expect.objectContaining({
        logsSampled: false,
        persistentLogAttributes: {
          aws_account_id: '123456789012',
          aws_region: 'eu-west-1',
          logger: {
            name: 'aws-lambda-powertool-typescript',
            version: '0.2.4',
          },
        },
        powertoolLogData: {
          sampleRateValue: undefined,
          awsRegion: 'eu-west-1',
          environment: '',
          serviceName: 'hello-world',
        },
        envVarsService: expect.any(EnvironmentVariablesService),
        customConfigService: undefined,
        logLevel: 'DEBUG',
        logFormatter: {},
      }));
    });

    test('when A custom environment is passed, returns a Logger instance with the correct proprieties', () => {

      // Prepare
      const loggerOptions:ConstructorOptions = {
        environment: 'dev',
      };

      // Act
      const logger = createLogger(loggerOptions);

      // Assess
      expect(logger).toBeInstanceOf(Logger);
      expect(logger).toEqual(expect.objectContaining({
        logsSampled: false,
        persistentLogAttributes: {},
        powertoolLogData: {
          sampleRateValue: undefined,
          awsRegion: 'eu-west-1',
          environment: 'dev',
          serviceName: 'hello-world',
        },
        envVarsService: expect.any(EnvironmentVariablesService),
        customConfigService: undefined,
        logLevel: 'DEBUG',
        logFormatter: {},
      }));
    });
  });

});