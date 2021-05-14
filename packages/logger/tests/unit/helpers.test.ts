import { LoggerOptions } from '../../types';
import { ConfigService, ConfigServiceInterface, EnvironmentVariablesService } from '../../src/config';
import { createLogger, Logger } from './../../src';
import { LogFormatter, PowertoolLogFormatter } from '../../src/formatter';

// logLevel?: LogLevel
// serviceName?: string
// sampleRateValue?: number
// logFormatter?: LogFormatterInterface
// customConfigService?: ConfigServiceInterface
// persistentLogAttributes?: LogAttributes
// environment?: Environment

describe('logger', () => {

  test('when no logger options are passed, returns a Logger instance with the correct proprieties', () => {

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
        awsRegion: 'eu-central-1',
        environment: '',
        serviceName: 'hello-world',
        xRayTraceId: 'abcdef123456abcdef123456abcdef123456'
      },
      envVarsService:  expect.any(EnvironmentVariablesService),
      customConfigService: undefined,
      logLevel: 'DEBUG',
      logFormatter: expect.any(PowertoolLogFormatter),
    }));

  });

  test('when a custom logFormatter is passed as parameter, returns a Logger instance with the correct proprieties', () => {

    // Prepare
    const loggerOptions:LoggerOptions = {
      logFormatter: expect.any(LogFormatter)
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
        awsRegion: 'eu-central-1',
        environment: '',
        serviceName: 'hello-world',
        xRayTraceId: 'abcdef123456abcdef123456abcdef123456'
      },
      envVarsService:  expect.any(EnvironmentVariablesService),
      customConfigService: undefined,
      logLevel: 'DEBUG',
      logFormatter: expect.any(LogFormatter),
    }));
  });

  test('when a custom serviceName is passed as parameter, returns a Logger instance with the correct proprieties', () => {

    // Prepare
    const loggerOptions:LoggerOptions = {
      serviceName: 'my-backend-service'
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
        awsRegion: 'eu-central-1',
        environment: '',
        serviceName: 'my-backend-service',
        xRayTraceId: 'abcdef123456abcdef123456abcdef123456'
      },
      envVarsService:  expect.any(EnvironmentVariablesService),
      customConfigService: undefined,
      logLevel: 'DEBUG',
      logFormatter: {}
    }));
  });

  test('when a custom logLevel is passed as parameter, returns a Logger instance with the correct proprieties', () => {

    // Prepare
    const loggerOptions:LoggerOptions = {
      logLevel: 'ERROR'
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
        awsRegion: 'eu-central-1',
        environment: '',
        serviceName: 'hello-world',
        xRayTraceId: 'abcdef123456abcdef123456abcdef123456'
      },
      envVarsService:  expect.any(EnvironmentVariablesService),
      customConfigService: undefined,
      logLevel: 'ERROR',
      logFormatter: expect.any(PowertoolLogFormatter),
    }));
  });

  test('when a custom sampleRateValue is passed as parameter, returns a Logger instance with the correct proprieties', () => {

    // Prepare
    const loggerOptions:LoggerOptions = {
      sampleRateValue: 1
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
        awsRegion: 'eu-central-1',
        environment: '',
        serviceName: 'hello-world',
        xRayTraceId: 'abcdef123456abcdef123456abcdef123456'
      },
      envVarsService:  expect.any(EnvironmentVariablesService),
      customConfigService: undefined,
      logLevel: 'DEBUG',
      logFormatter: {},
    }));
  });

  test('when a custom customConfigService is passed as parameter, returns a Logger instance with the correct proprieties', () => {

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
      }

    };
    // Prepare
    const loggerOptions:LoggerOptions = {
      customConfigService: configService
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
        awsRegion: 'eu-central-1',
        environment: 'dev',
        serviceName: 'my-backend-service',
        xRayTraceId: 'abcdef123456abcdef123456abcdef123456'
      },
      envVarsService:  expect.any(EnvironmentVariablesService),
      customConfigService: configService,
      logLevel: 'INFO',
      logFormatter: {},
    }));
  });

  test('when custom persistentLogAttributes is passed as parameter, returns a Logger instance with the correct proprieties', () => {

    // Prepare
    const loggerOptions:LoggerOptions = {
      persistentLogAttributes: {
        aws_account_id: '123456789012',
        aws_region: 'eu-central-1',
        logger: {
          name: 'aws-lambda-powertool-typescript',
          version: '0.2.4',
        }
      }
    };

    // Act
    const logger = createLogger(loggerOptions);

    // Assess
    expect(logger).toBeInstanceOf(Logger);
    expect(logger).toEqual(expect.objectContaining({
      logsSampled: false,
      persistentLogAttributes: {
        aws_account_id: '123456789012',
        aws_region: 'eu-central-1',
        logger: {
          name: 'aws-lambda-powertool-typescript',
          version: '0.2.4',
        }
      },
      powertoolLogData: {
        sampleRateValue: undefined,
        awsRegion: 'eu-central-1',
        environment: '',
        serviceName: 'hello-world',
        xRayTraceId: 'abcdef123456abcdef123456abcdef123456'
      },
      envVarsService:  expect.any(EnvironmentVariablesService),
      customConfigService: undefined,
      logLevel: 'DEBUG',
      logFormatter: {},
    }));
  });

  test('when custom environment is passed as parameter, returns a Logger instance with the correct proprieties', () => {

    // Prepare
    const loggerOptions:LoggerOptions = {
      environment: 'dev'
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
        awsRegion: 'eu-central-1',
        environment: 'dev',
        serviceName: 'hello-world',
        xRayTraceId: 'abcdef123456abcdef123456abcdef123456'
      },
      envVarsService:  expect.any(EnvironmentVariablesService),
      customConfigService: undefined,
      logLevel: 'DEBUG',
      logFormatter: {},
    }));
  });

});