import { Console } from 'console';
import type { Context, Handler } from 'aws-lambda';
import { Utility } from '@aws-lambda-powertools/commons';
import { LogFormatterInterface, PowertoolLogFormatter } from './formatter';
import { LogItem } from './log';
import merge from 'lodash.merge';
import { ConfigServiceInterface, EnvironmentVariablesService } from './config';
import { LogJsonIndent } from './types';
import type {
  ClassThatLogs,
  Environment,
  HandlerMethodDecorator,
  LambdaFunctionContext,
  LogAttributes,
  ConstructorOptions,
  LogItemExtraInput,
  LogItemMessage,
  LogLevel,
  LogLevelThresholds,
  PowertoolLogData,
  HandlerOptions,
} from './types';

/**
 * ## Intro
 * The Logger utility provides an opinionated logger with output structured as JSON.
 *
 * ## Key features
 *  * Capture key fields from Lambda context, cold start and structures logging output as JSON
 *  * Log Lambda context when instructed (disabled by default)
 *  * Log sampling prints all logs for a percentage of invocations (disabled by default)
 *  * Append additional keys to structured log at any point in time
 *
 * ## Usage
 *
 * For more usage examples, see [our documentation](https://awslabs.github.io/aws-lambda-powertools-typescript/latest/core/logger/).
 *
 * ### Basic usage
 *
 * @example
 * ```typescript
 * import { Logger } from '@aws-lambda-powertools/logger';
 *
 * // Logger parameters fetched from the environment variables:
 * const logger = new Logger();
 * ```
 * 
 * ### Functions usage with middleware
 *
 * If you use function-based Lambda handlers you can use the [injectLambdaContext()](#injectLambdaContext)
 * middy middleware to automatically add context to your Lambda logs.
 *
 * @example
 * ```typescript
 * import { Logger, injectLambdaContext } from '@aws-lambda-powertools/logger';
 * import middy from '@middy/core';
 *
 * const logger = new Logger();
 *
 * const lambdaHandler = async (_event: any, _context: any) => {
 *     logger.info('This is an INFO log with some context');
 * };
 *
 * export const handler = middy(lambdaHandler).use(injectLambdaContext(logger));
 * ```
 *
 * ### Object oriented usage with decorators
 *
 * If instead you use TypeScript classes to wrap your Lambda handler you can use the [@logger.injectLambdaContext()](./_aws_lambda_powertools_logger.Logger.html#injectLambdaContext) decorator.
 *
 * @example
 * ```typescript
 * import { Logger } from '@aws-lambda-powertools/logger';
 * import { LambdaInterface } from '@aws-lambda-powertools/commons';
 *
 * const logger = new Logger();
 *
 * class Lambda implements LambdaInterface {
 * 
 *   // FYI: Decorator might not render properly in VSCode mouse over due to https://github.com/microsoft/TypeScript/issues/47679 and might show as *@logger* instead of `@logger.injectLambdaContext`
 * 
 *     // Decorate your handler class method
 *     @logger.injectLambdaContext()
 *     public async handler(_event: any, _context: any): Promise<void> {
 *         logger.info('This is an INFO log with some context');
 *     }
 * }
 *
 * const handlerClass = new Lambda();
 * export const handler = handlerClass.handler.bind(handlerClass);
 * ```
 * 
 * ### Functions usage with manual instrumentation
 *
 * If you prefer to manually instrument your Lambda handler you can use the methods in the Logger class directly.
 *
 * @example
 * ```typescript
 * import { Logger } from '@aws-lambda-powertools/logger';
 *
 * const logger = new Logger();
 *
 * export const handler = async (_event, context) => {
 *     logger.addContext(context);
 *     logger.info('This is an INFO log with some context');
 * };
 * ```
 *
 * @class
 * @implements {ClassThatLogs}
 * @see https://awslabs.github.io/aws-lambda-powertools-typescript/latest/core/logger/
 */
class Logger extends Utility implements ClassThatLogs {

  // console is initialized in the constructor in setOptions()
  private console!: Console;

  private customConfigService?: ConfigServiceInterface;

  private static readonly defaultLogLevel: LogLevel = 'INFO';

  // envVarsService is always initialized in the constructor in setOptions()
  private envVarsService!: EnvironmentVariablesService;

  private logEvent: boolean = false;

  private logFormatter?: LogFormatterInterface;

  private logIndentation: number = LogJsonIndent.COMPACT;

  private logLevel?: LogLevel;

  private readonly logLevelThresholds: LogLevelThresholds = {
    DEBUG: 8,
    INFO: 12,
    WARN: 16,
    ERROR: 20,
  };

  private logsSampled: boolean = false;

  private persistentLogAttributes?: LogAttributes = {};

  private powertoolLogData: PowertoolLogData = <PowertoolLogData>{};

  /**
   * It initializes the Logger class with an optional set of options (settings).
   * *
   * @param {ConstructorOptions} options
   */
  public constructor(options: ConstructorOptions = {}) {
    super();
    this.setOptions(options);
  }

  /**
   * It adds the current Lambda function's invocation context data to the powertoolLogData property of the instance.
   * This context data will be part of all printed log items.
   *
   * @param {Context} context
   * @returns {void}
   */
  public addContext(context: Context): void {
    const lambdaContext: Partial<LambdaFunctionContext> = {
      invokedFunctionArn: context.invokedFunctionArn,
      coldStart: this.getColdStart(),
      awsRequestId: context.awsRequestId,
      memoryLimitInMB: Number(context.memoryLimitInMB),
      functionName: context.functionName,
      functionVersion: context.functionVersion,
    };

    this.addToPowertoolLogData({
      lambdaContext,
    });
  }

  /**
   * It adds the given attributes (key-value pairs) to all log items generated by this Logger instance.
   *
   * @param {LogAttributes} attributes
   * @returns {void}
   */
  public addPersistentLogAttributes(attributes?: LogAttributes): void {
    merge(this.persistentLogAttributes, attributes);
  }

  /**
   * Alias for addPersistentLogAttributes.
   *
   * @param {LogAttributes} attributes
   * @returns {void}
   */
  public appendKeys(attributes?: LogAttributes): void {
    this.addPersistentLogAttributes(attributes);
  }

  /**
   * It creates a separate Logger instance, identical to the current one
   * It's possible to overwrite the new instance options by passing them.
   *
   * @param {ConstructorOptions} options
   * @returns {Logger}
   */
  public createChild(options: ConstructorOptions = {}): Logger {
    const parentsPowertoolsLogData = this.getPowertoolLogData();
    const childLogger = new Logger(merge({}, parentsPowertoolsLogData, options));
    
    const parentsPersistentLogAttributes = this.getPersistentLogAttributes();
    childLogger.addPersistentLogAttributes(parentsPersistentLogAttributes);
    
    if (parentsPowertoolsLogData.lambdaContext) {
      childLogger.addContext(parentsPowertoolsLogData.lambdaContext as Context);
    }
    
    return childLogger;
  }

  /**
   * It prints a log item with level DEBUG.
   *
   * @param {LogItemMessage} input
   * @param {Error | LogAttributes | string} extraInput
   * @returns {void}
   */
  public debug(input: LogItemMessage, ...extraInput: LogItemExtraInput): void {
    this.processLogItem('DEBUG', input, extraInput);
  }

  /**
   * It prints a log item with level ERROR.
   *
   * @param {LogItemMessage} input
   * @param {Error | LogAttributes | string} extraInput
   * @returns {void}
   */
  public error(input: LogItemMessage, ...extraInput: LogItemExtraInput): void {
    this.processLogItem('ERROR', input, extraInput);
  }

  /**
   * It returns a boolean value. True means that the Lambda invocation events
   * are printed in the logs.
   *
   * @returns {boolean}
   */
  public getLogEvent(): boolean {
    return this.logEvent;
  }

  /**
   * It returns a boolean value, if true all the logs will be printed.
   *
   * @returns {boolean}
   */
  public getLogsSampled(): boolean {
    return this.logsSampled;
  }

  /**
   * It returns the persistent log attributes, which are the attributes
   * that will be logged in all log items.
   *
   * @private
   * @returns {LogAttributes}
   */
  public getPersistentLogAttributes(): LogAttributes {
    return <LogAttributes> this.persistentLogAttributes;
  }

  /**
   * It prints a log item with level INFO.
   *
   * @param {LogItemMessage} input
   * @param {Error | LogAttributes | string} extraInput
   * @returns {void}
   */
  public info(input: LogItemMessage, ...extraInput: LogItemExtraInput): void {
    this.processLogItem('INFO', input, extraInput);
  }

  /**
   * Method decorator that adds the current Lambda function context as extra
   * information in all log items.
   * 
   * The decorator can be used only when attached to a Lambda function handler which
   * is written as method of a class, and should be declared just before the handler declaration.
   *
   * Note: Currently TypeScript only supports decorators on classes and methods. If you are using the
   * function syntax, you should use the middleware instead.
   * 
   * @example
   * ```typescript
   * import { Logger } from '@aws-lambda-powertools/logger';
   * import { LambdaInterface } from '@aws-lambda-powertools/commons';
   *
   * const logger = new Logger();
   *
   * class Lambda implements LambdaInterface {
   *     // Decorate your handler class method
   *     @logger.injectLambdaContext()
   *     public async handler(_event: any, _context: any): Promise<void> {
   *         logger.info('This is an INFO log with some context');
   *     }
   * }
   *
   * const handlerClass = new Lambda();
   * export const handler = handlerClass.handler.bind(handlerClass);
   * ```
   * 
   * @see https://www.typescriptlang.org/docs/handbook/decorators.html#method-decorators
   * @returns {HandlerMethodDecorator}
   */
  public injectLambdaContext(options?: HandlerOptions): HandlerMethodDecorator {
    return (_target, _propertyKey, descriptor) => {
      /**
       * The descriptor.value is the method this decorator decorates, it cannot be undefined.
       */
      const originalMethod = descriptor.value;

      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const loggerRef = this;
      // Use a function() {} instead of an () => {} arrow function so that we can
      // access `myClass` as `this` in a decorated `myClass.myMethod()`.
      descriptor.value = (async function (this: Handler, event, context, callback) {

        let initialPersistentAttributes = {};
        if (options && options.clearState === true) {
          initialPersistentAttributes = { ...loggerRef.getPersistentLogAttributes() };
        }

        Logger.injectLambdaContextBefore(loggerRef, event, context, options);

        /* eslint-disable  @typescript-eslint/no-non-null-assertion */
        let result: unknown;
        try {
          result = await originalMethod!.apply(this, [ event, context, callback ]);
        } catch (error) {
          throw error;
        } finally {
          Logger.injectLambdaContextAfterOrOnError(loggerRef, initialPersistentAttributes, options);
        }

        return result;
      });
    };
  }

  public static injectLambdaContextAfterOrOnError(logger: Logger, initialPersistentAttributes: LogAttributes, options?: HandlerOptions): void {
    if (options && options.clearState === true) {
      logger.setPersistentLogAttributes(initialPersistentAttributes);
    }
  }

  public static injectLambdaContextBefore(logger: Logger, event: unknown, context: Context, options?: HandlerOptions): void {
    logger.addContext(context);

    let shouldLogEvent = undefined;
    if (options && options.hasOwnProperty('logEvent')) {
      shouldLogEvent = options.logEvent;
    }
    logger.logEventIfEnabled(event, shouldLogEvent);
  }

  /**
   * Logs a Lambda invocation event, if it *should*.
   *
   ** @param {unknown} event
   * @param {boolean} [overwriteValue]
   * @returns {void}
   */
  public logEventIfEnabled(event: unknown, overwriteValue?: boolean): void {
    if (!this.shouldLogEvent(overwriteValue)) {
      return;
    }
    this.info('Lambda invocation event', { event });
  }

  /**
   * If the sample rate feature is enabled, the calculation that determines whether the logs
   * will actually be printed or not for this invocation is done when the Logger class is
   * initialized.
   * This method will repeat that calculation (with possible different outcome).
   *
   * @returns {void}
   */
  public refreshSampleRateCalculation(): void {
    this.setLogsSampled();
  }

  /**
   * Alias for removePersistentLogAttributes.
   *
   * @param {string[]} keys
   * @returns {void}
   */
  public removeKeys(keys: string[]): void {
    this.removePersistentLogAttributes(keys);
  }

  /**
   * It removes attributes based on provided keys to all log items generated by this Logger instance.
   *
   * @param {string[]} keys
   * @returns {void}
   */
  public removePersistentLogAttributes(keys: string[]): void {
    keys.forEach((key) => {
      if (this.persistentLogAttributes && key in this.persistentLogAttributes) {
        delete this.persistentLogAttributes[key];
      }
    });
  }

  /**
   * It sets the given attributes (key-value pairs) to all log items generated by this Logger instance.
   * Note: this replaces the pre-existing value.
   *
   * @param {LogAttributes} attributes
   * @returns {void}
   */
  public setPersistentLogAttributes(attributes: LogAttributes): void {
    this.persistentLogAttributes = attributes;
  }

  /**
   * It sets the user-provided sample rate value.
   *
   * @param {number} [sampleRateValue]
   * @returns {void}
   */
  public setSampleRateValue(sampleRateValue?: number): void {
    this.powertoolLogData.sampleRateValue =
      sampleRateValue ||
      this.getCustomConfigService()?.getSampleRateValue() ||
      this.getEnvVarsService().getSampleRateValue();
  }

  /**
   * It checks whether the current Lambda invocation event should be printed in the logs or not.
   *
   * @private
   * @param {boolean} [overwriteValue]
   * @returns {boolean}
   */
  public shouldLogEvent(overwriteValue?: boolean): boolean {
    if (typeof overwriteValue === 'boolean') {
      return overwriteValue;
    }

    return this.getLogEvent();
  }

  /**
   * It prints a log item with level WARN.
   *
   * @param {LogItemMessage} input
   * @param {Error | LogAttributes | string} extraInput
   * @returns {void}
   */
  public warn(input: LogItemMessage, ...extraInput: LogItemExtraInput): void {
    this.processLogItem('WARN', input, extraInput);
  }

  /**
   * It stores information that is printed in all log items.
   *
   * @param {Partial<PowertoolLogData>} attributesArray
   * @private
   * @returns {void}
   */
  private addToPowertoolLogData(...attributesArray: Array<Partial<PowertoolLogData>>): void {
    attributesArray.forEach((attributes: Partial<PowertoolLogData>) => {
      merge(this.powertoolLogData, attributes);
    });
  }

  /**
   * It processes a particular log item so that it can be printed to stdout:
   * - Merges ephemeral log attributes with persistent log attributes (printed for all logs) and additional info;
   * - Formats all the log attributes;
   *
   * @private
   * @param {LogLevel} logLevel
   * @param {LogItemMessage} input
   * @param {LogItemExtraInput} extraInput
   * @returns {LogItem}
   */
  private createAndPopulateLogItem(logLevel: LogLevel, input: LogItemMessage, extraInput: LogItemExtraInput): LogItem {
    // TODO: this method's logic is hard to understand, there is an opportunity here to simplify this logic.
    const unformattedBaseAttributes = merge({
      logLevel,
      timestamp: new Date(),
      message: typeof input === 'string' ? input : input.message,
      xRayTraceId: this.envVarsService.getXrayTraceId(),
    }, this.getPowertoolLogData());

    const logItem = new LogItem({
      baseAttributes: this.getLogFormatter().formatAttributes(unformattedBaseAttributes),
      persistentAttributes: this.getPersistentLogAttributes(),
    });

    // Add ephemeral attributes
    if (typeof input !== 'string') {
      logItem.addAttributes(input);
    }
    extraInput.forEach((item: Error | LogAttributes | string) => {
      const attributes: LogAttributes =
        item instanceof Error ? { error: item } :
          typeof item === 'string' ? { extra: item } :
            item;

      logItem.addAttributes(attributes);
    });

    return logItem;
  }

  /**
   * It returns the custom config service, an abstraction used to fetch environment variables.
   *
   * @private
   * @returns {ConfigServiceInterface | undefined}
   */
  private getCustomConfigService(): ConfigServiceInterface | undefined {
    return this.customConfigService;
  }

  /**
   * It returns the instance of a service that fetches environment variables.
   *
   * @private
   * @returns {EnvironmentVariablesService}
   */
  private getEnvVarsService(): EnvironmentVariablesService {
    return <EnvironmentVariablesService> this.envVarsService;
  }

  /**
   * It returns the instance of a service that formats the structure of a
   * log item's keys and values in the desired way.
   *
   * @private
   * @returns {LogFormatterInterface}
   */
  private getLogFormatter(): LogFormatterInterface {
    return <LogFormatterInterface> this.logFormatter;
  }

  /**
   * It returns the log level set for the Logger instance.
   *
   * @private
   * @returns {LogLevel}
   */
  private getLogLevel(): LogLevel {
    return <LogLevel> this.logLevel;
  }

  /**
   * It returns information that will be added in all log item by
   * this Logger instance (different from user-provided persistent attributes).
   *
   * @private
   * @returns {LogAttributes}
   */
  private getPowertoolLogData(): PowertoolLogData {
    return this.powertoolLogData;
  }

  /**
   * It returns the numeric sample rate value.
   *
   * @private
   * @returns {number}
   */
  private getSampleRateValue(): number {
    if (!this.powertoolLogData.sampleRateValue) {
      this.setSampleRateValue();
    }

    return <number> this.powertoolLogData.sampleRateValue;
  }
  
  /**
   * It returns true if the provided log level is valid.
   *
   * @param {LogLevel} logLevel
   * @private
   * @returns {boolean}
   */
  private isValidLogLevel(logLevel?: LogLevel): boolean {
    return typeof logLevel === 'string' && logLevel.toUpperCase() in this.logLevelThresholds;
  }

  /**
   * It prints a given log with given log level.
   *
   * @param {LogLevel} logLevel
   * @param {LogItem} log
   * @private
   */
  private printLog(logLevel: LogLevel, log: LogItem): void {
    log.prepareForPrint();

    const consoleMethod = logLevel.toLowerCase() as keyof ClassThatLogs;

    this.console[consoleMethod](JSON.stringify(log.getAttributes(), this.removeCircularDependencies(), this.logIndentation));
  }

  /**
   * It prints a given log with given log level.
   *
   * @param {LogLevel} logLevel
   * @param {LogItem} log
   * @private
   */
  private processLogItem(logLevel: LogLevel, input: LogItemMessage, extraInput: LogItemExtraInput): void {
    if (!this.shouldPrint(logLevel)) {
      return;
    }
    this.printLog(logLevel, this.createAndPopulateLogItem(logLevel, input, extraInput));
  }

  /**
   * When the data added in the log item contains object references,
   * JSON.stringify() doesn't try to solve them and instead throws an error: TypeError: cyclic object value.
   * To mitigate this issue, this method will find and remove all cyclic references.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Cyclic_object_value
   * @private
   */
  private removeCircularDependencies(): (key: string, value: LogAttributes | Error) => void {
    const references = new WeakSet();

    return (key, value) => {
      let item = value;
      if (item instanceof Error) {
        item = this.getLogFormatter().formatError(item);
      }
      if (typeof item === 'object' && value !== null) {
        if (references.has(item)) {
          return;
        }
        references.add(item);
      }

      return item;
    };
  }

  /**
   * It initializes console property as an instance of the internal version of Console() class (PR #748)
   * or as the global node console if the `POWERTOOLS_DEV' env variable is set and has truthy value.
   *
   * @private
   * @returns {void}
   */
  private setConsole(): void {
    if (!this.getEnvVarsService().isDevMode()) {
      this.console = new Console({ stdout: process.stdout, stderr: process.stderr });
    } else {
      this.console = console;
    }
  }

  /**
   * Sets the Logger's customer config service instance, which will be used
   * to fetch environment variables.
   *
   * @private
   * @param {ConfigServiceInterface} customConfigService
   * @returns {void}
   */
  private setCustomConfigService(customConfigService?: ConfigServiceInterface): void {
    this.customConfigService = customConfigService ? customConfigService : undefined;
  }

  /**
   * Sets the Logger's custom config service instance, which will be used
   * to fetch environment variables.
   *
   * @private
   * @param {ConfigServiceInterface} customConfigService
   * @returns {void}
   */
  private setEnvVarsService(): void {
    this.envVarsService = new EnvironmentVariablesService();
  }

  /**
   * If the log event feature is enabled via env variable, it sets a property that tracks whether
   * the event passed to the Lambda function handler should be logged or not.
   *
   * @private
   * @returns {void}
   */
  private setLogEvent(): void {
    if (this.getEnvVarsService().getLogEvent()) {
      this.logEvent = true;
    }
  }

  /**
   * It sets the log formatter instance, in charge of giving a custom format
   * to the structured logs
   *
   * @private
   * @param {LogFormatterInterface} logFormatter
   * @returns {void}
   */
  private setLogFormatter(logFormatter?: LogFormatterInterface): void {
    this.logFormatter = logFormatter || new PowertoolLogFormatter();
  }

  /**
   * If the `POWERTOOLS_DEV' env variable is set,
   * it adds JSON indentation for pretty printing logs.
   *
   * @private
   * @returns {void}
   */
  private setLogIndentation(): void {
    if (this.getEnvVarsService().isDevMode()) {
      this.logIndentation = LogJsonIndent.PRETTY;
    }
  }

  /**
   * It sets the Logger's instance log level.
   *
   * @private
   * @param {LogLevel} logLevel
   * @returns {void}
   */
  private setLogLevel(logLevel?: LogLevel): void {
    if (this.isValidLogLevel(logLevel)) {
      this.logLevel = (<LogLevel>logLevel).toUpperCase();

      return;
    }
    const customConfigValue = this.getCustomConfigService()?.getLogLevel();
    if (this.isValidLogLevel(customConfigValue)) {
      this.logLevel = (<LogLevel>customConfigValue).toUpperCase();

      return;
    }
    const envVarsValue = this.getEnvVarsService().getLogLevel();
    if (this.isValidLogLevel(envVarsValue)) {
      this.logLevel = (<LogLevel>envVarsValue).toUpperCase();

      return;
    }

    this.logLevel = Logger.defaultLogLevel;
  }

  /**
   * If the sample rate feature is enabled, it sets a property that tracks whether this Lambda function invocation
   * will print logs or not.
   *
   * @private
   * @returns {void}
   */
  private setLogsSampled(): void {
    const sampleRateValue = this.getSampleRateValue();
    // TODO: revisit Math.random() as it's not a real randomization
    this.logsSampled = sampleRateValue !== undefined && (sampleRateValue === 1 || Math.random() < sampleRateValue);
  }

  /**
   * It configures the Logger instance settings that will affect the Logger's behaviour
   * and the content of all logs.
   *
   * @private
   * @param {ConstructorOptions} options
   * @returns {Logger}
   */
  private setOptions(options: ConstructorOptions): Logger {
    const {
      logLevel,
      serviceName,
      sampleRateValue,
      logFormatter,
      customConfigService,
      persistentLogAttributes,
      environment,
    } = options;

    this.setEnvVarsService();
    // order is important, it uses EnvVarsService()
    this.setConsole();
    this.setCustomConfigService(customConfigService);
    this.setLogLevel(logLevel);
    this.setSampleRateValue(sampleRateValue);
    this.setLogsSampled();
    this.setLogFormatter(logFormatter);
    this.setPowertoolLogData(serviceName, environment);
    this.setLogEvent();
    this.setLogIndentation();
    
    this.addPersistentLogAttributes(persistentLogAttributes);

    return this;
  }

  /**
   * It adds important data to the Logger instance that will affect the content of all logs.
   *
   * @param {string} serviceName
   * @param {Environment} environment
   * @param {LogAttributes} persistentLogAttributes
   * @private
   * @returns {void}
   */
  private setPowertoolLogData(
    serviceName?: string,
    environment?: Environment,
    persistentLogAttributes: LogAttributes = {},
  ): void {
    this.addToPowertoolLogData(
      {
        awsRegion: this.getEnvVarsService().getAwsRegion(),
        environment:
          environment ||
          this.getCustomConfigService()?.getCurrentEnvironment() ||
          this.getEnvVarsService().getCurrentEnvironment(),
        sampleRateValue: this.getSampleRateValue(),
        serviceName:
          serviceName || this.getCustomConfigService()?.getServiceName() || this.getEnvVarsService().getServiceName() || this.getDefaultServiceName(),
      },
      persistentLogAttributes,
    );
  }

  /**
   * It checks whether the current log item should/can be printed.
   *
   * @param {string} serviceName
   * @param {Environment} environment
   * @param {LogAttributes} persistentLogAttributes
   * @private
   * @returns {boolean}
   */
  private shouldPrint(logLevel: LogLevel): boolean {
    if (this.logLevelThresholds[logLevel] >= this.logLevelThresholds[this.getLogLevel()]) {
      return true;
    }

    return this.getLogsSampled();
  }
}

export { Logger };
