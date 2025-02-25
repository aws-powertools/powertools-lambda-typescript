import { Console } from 'node:console';
import { randomInt } from 'node:crypto';
import { Utility, isNullOrUndefined } from '@aws-lambda-powertools/commons';
import type {
  AsyncHandler,
  HandlerMethodDecorator,
  SyncHandler,
} from '@aws-lambda-powertools/commons/types';
import type { Context, Handler } from 'aws-lambda';
import merge from 'lodash.merge';
import { EnvironmentVariablesService } from './config/EnvironmentVariablesService.js';
import { LogJsonIndent, LogLevelThreshold, ReservedKeys } from './constants.js';
import type { LogFormatter } from './formatter/LogFormatter.js';
import type { LogItem } from './formatter/LogItem.js';
import { PowertoolsLogFormatter } from './formatter/PowertoolsLogFormatter.js';
import { CircularMap } from './logBuffer.js';
import type { ConfigServiceInterface } from './types/ConfigServiceInterface.js';
import type {
  ConstructorOptions,
  CustomJsonReplacerFn,
  InjectLambdaContextOptions,
  LogAttributes,
  LogFunction,
  LogItemExtraInput,
  LogItemMessage,
  LogLevel,
  LoggerInterface,
} from './types/Logger.js';
import type {
  LogKeys,
  PowertoolsLogData,
  UnformattedAttributes,
} from './types/logKeys.js';

/**
 * The Logger utility provides an opinionated logger with output structured as JSON for AWS Lambda.
 *
 * **Key features**
 * * Capture key fields from AWS Lambda context, cold start, and structure log output as JSON
 * * Append additional keys to one or all log items
 * * Switch log level to `DEBUG` based on a sample rate value for a percentage of invocations
 *
 * After initializing the Logger class, you can use the methods to log messages at different levels.
 *
 * @example
 * ```typescript
 * import { Logger } from '@aws-lambda-powertools/logger';
 *
 * const logger = new Logger({ serviceName: 'serverlessAirline' });
 *
 * export const handler = async (event, context) => {
 *   logger.info('This is an INFO log');
 *   logger.warn('This is a WARNING log');
 * };
 * ```
 *
 * To enrich the log items with information from the Lambda context, you can use the {@link Logger.addContext | addContext()} method.
 *
 * @example
 * ```typescript
 * import { Logger } from '@aws-lambda-powertools/logger';
 *
 * const logger = new Logger({ serviceName: 'serverlessAirline' });
 *
 * export const handler = async (event, context) => {
 *   logger.addContext(context);
 *
 *   logger.info('This is an INFO log with some context');
 * };
 * ```
 *
 * You can also add additional attributes to all log items using the {@link Logger.appendKeys | appendKeys()} method.
 *
 * @example
 * ```typescript
 * export const handler = async (event, context) => {
 *   logger.appendKeys({ key1: 'value1' });
 *
 *   logger.info('This is an INFO log with additional keys');
 *
 *   logger.removeKeys(['key1']);
 * };
 *```
 *
 * If you write your functions as classes and use TypeScript, you can use the {@link Logger.injectLambdaContext} class method decorator
 * to automatically add context to your logs and clear the state after the invocation.
 *
 * If instead you use Middy.js middlewares, you use the {@link "middleware/middy".injectLambdaContext | injectLambdaContext()} middleware.
 *
 * @see https://docs.powertools.aws.dev/lambda/typescript/latest/core/logger/
 */
class Logger extends Utility implements LoggerInterface {
  /**
   * Console instance used to print logs.
   *
   * In AWS Lambda, we create a new instance of the Console class so that we can have
   * full control over the output of the logs. In testing environments, we use the
   * default console instance.
   *
   * This property is initialized in the constructor in setOptions().
   */
  private console!: Console;
  /**
   * Custom config service instance used to configure the logger.
   */
  private customConfigService?: ConfigServiceInterface;
  /**
   * Environment variables service instance used to fetch environment variables.
   */
  private envVarsService = new EnvironmentVariablesService();
  /**
   * Whether to print the Lambda invocation event in the logs.
   */
  private logEvent = false;
  /**
   * Formatter used to format the log items.
   * @default new PowertoolsLogFormatter()
   */
  private logFormatter: ConstructorOptions['logFormatter'];
  /**
   * JSON indentation used to format the logs.
   */
  private logIndentation: number = LogJsonIndent.COMPACT;
  /**
   * Log level used internally by the current instance of Logger.
   */
  private logLevel: number = LogLevelThreshold.INFO;
  /**
   * Persistent log attributes that will be logged in all log items.
   */
  private persistentLogAttributes: LogAttributes = {};
  /**
   * Standard attributes managed by Powertools that will be logged in all log items.
   */
  private powertoolsLogData: PowertoolsLogData = <PowertoolsLogData>{};
  /**
   * Temporary log attributes that can be appended with `appendKeys()` method.
   */
  private temporaryLogAttributes: LogKeys = {};
  /**
   * Buffer used to store logs until the logger is initialized.
   *
   * Sometimes we need to log warnings before the logger is fully initialized, however we can't log them
   * immediately because the logger is not ready yet. This buffer stores those logs until the logger is ready.
   */
  readonly #initBuffer: [
    number,
    Parameters<Logger['createAndPopulateLogItem']>,
  ][] = [];
  /**
   * Flag used to determine if the logger is initialized.
   */
  #isInitialized = false;
  /**
   * Map used to hold the list of keys and their type.
   *
   * Because keys of different types can be overwritten, we keep a list of keys that were added and their last
   * type. We then use this map at log preparation time to pick the last one.
   */
  #keys: Map<string, 'temp' | 'persistent'> = new Map();
  /**
   * This is the initial log leval as set during the initialization of the logger.
   *
   * We keep this value to be able to reset the log level to the initial value when the sample rate is refreshed.
   */
  #initialLogLevel: number = LogLevelThreshold.INFO;
  /**
   * Replacer function used to serialize the log items.
   */
  #jsonReplacerFn?: CustomJsonReplacerFn;

  /**
   * Represents whether the buffering functionality is enabled in the logger
   */
  protected isBufferEnabled = false;

  /**
   * Log level threshold for the buffer
   * Logs with a level lower than this threshold will be buffered
   */
  protected bufferLogThreshold: number = LogLevelThreshold.DEBUG;
  /**
   * Max size of the buffer. Additions to the buffer beyond this size will
   * cause older logs to be evicted from the buffer
   */
  readonly #maxBufferBytesSize = 1024;

  /**
   * Contains buffered logs, grouped by _X_AMZN_TRACE_ID, each group with a max size of `maxBufferBytesSize`
   */
  readonly #buffer: CircularMap<string> = new CircularMap({
    maxBytesSize: this.#maxBufferBytesSize,
  });

  /**
   * Log level used by the current instance of Logger.
   *
   * Returns the log level as a number. The higher the number, the less verbose the logs.
   * To get the log level name, use the {@link getLevelName()} method.
   */
  public get level(): number {
    return this.logLevel;
  }

  public constructor(options: ConstructorOptions = {}) {
    super();
    const { customConfigService, ...rest } = options;
    this.setCustomConfigService(customConfigService);
    // all logs are buffered until the logger is initialized
    this.setOptions(rest);
    this.#isInitialized = true;
    for (const [level, log] of this.#initBuffer) {
      // we call the method directly and create the log item just in time
      this.printLog(level, this.createAndPopulateLogItem(...log));
    }
    this.#initBuffer = [];
  }

  /**
   * Add the current Lambda function's invocation context data to the powertoolLogData property of the instance.
   * This context data will be part of all printed log items.
   *
   * @param context - The Lambda function's invocation context.
   */
  public addContext(context: Context): void {
    this.addToPowertoolsLogData({
      lambdaContext: {
        invokedFunctionArn: context.invokedFunctionArn,
        coldStart: this.getColdStart(),
        awsRequestId: context.awsRequestId,
        memoryLimitInMB: context.memoryLimitInMB,
        functionName: context.functionName,
        functionVersion: context.functionVersion,
      },
    });
  }

  /**
   * @deprecated This method is deprecated and will be removed in the future major versions, please use {@link appendPersistentKeys() `appendPersistentKeys()`} instead.
   */
  public addPersistentLogAttributes(attributes: LogKeys): void {
    this.appendPersistentKeys(attributes);
  }

  /**
   * Add the given temporary attributes (key-value pairs) to all log items generated by this Logger instance.
   *
   * If the key already exists in the attributes, it will be overwritten. If the key is one of `level`, `message`, `sampling_rate`,
   * `service`, or `timestamp` we will log a warning and drop the value.
   *
   * @param attributes - The attributes to add to all log items.
   */
  public appendKeys(attributes: LogKeys): void {
    this.#appendKeys(attributes, 'temp');
  }

  /**
   * Add the given persistent attributes (key-value pairs) to all log items generated by this Logger instance.
   *
   * If the key already exists in the attributes, it will be overwritten. If the key is one of `level`, `message`, `sampling_rate`,
   * `service`, or `timestamp` we will log a warning and drop the value.
   *
   * @param attributes - The attributes to add to all log items.
   */
  public appendPersistentKeys(attributes: LogKeys): void {
    this.#appendKeys(attributes, 'persistent');
  }

  /**
   * Create a separate Logger instance, identical to the current one.
   * It's possible to overwrite the new instance options by passing them.
   *
   * @param options - The options to initialize the child logger with.
   */
  public createChild(options: ConstructorOptions = {}): Logger {
    const childLogger = this.createLogger(
      // Merge parent logger options with options passed to createChild,
      // the latter having precedence.
      merge(
        {},
        {
          logLevel: this.getLevelName(),
          serviceName: this.powertoolsLogData.serviceName,
          sampleRateValue: this.powertoolsLogData.sampleRateValue,
          logFormatter: this.getLogFormatter(),
          customConfigService: this.getCustomConfigService(),
          environment: this.powertoolsLogData.environment,
          persistentLogAttributes: this.persistentLogAttributes,
          temporaryLogAttributes: this.temporaryLogAttributes,
          jsonReplacerFn: this.#jsonReplacerFn,
        },
        options
      )
    );
    if (this.powertoolsLogData.lambdaContext)
      childLogger.addContext(
        this.powertoolsLogData.lambdaContext as unknown as Context
      );

    return childLogger;
  }

  /**
   * Print a log item with level CRITICAL.
   *
   * @param input - The log message.
   * @param extraInput - The extra input to log.
   */
  public critical(
    input: LogItemMessage,
    ...extraInput: LogItemExtraInput
  ): void {
    this.processLogItem(LogLevelThreshold.CRITICAL, input, extraInput);
  }

  /**
   * Print a log item with level DEBUG.
   *
   * @param input
   * @param extraInput - The extra input to log.
   */
  public debug(input: LogItemMessage, ...extraInput: LogItemExtraInput): void {
    this.processLogItem(LogLevelThreshold.DEBUG, input, extraInput);
  }

  /**
   * Print a log item with level ERROR.
   *
   * @param input - The log message.
   * @param extraInput - The extra input to log.
   */
  public error(input: LogItemMessage, ...extraInput: LogItemExtraInput): void {
    this.processLogItem(LogLevelThreshold.ERROR, input, extraInput);
  }

  /**
   * Get the log level name of the current instance of Logger.
   *
   * Returns the log level name, i.e. `INFO`, `DEBUG`, etc.
   * To get the log level as a number, use the {@link Logger.level} property.
   */
  public getLevelName(): Uppercase<LogLevel> {
    return this.getLogLevelNameFromNumber(this.logLevel);
  }

  /**
   * Return a boolean value. True means that the Lambda invocation events
   * are printed in the logs.
   */
  public getLogEvent(): boolean {
    return this.logEvent;
  }

  /**
   * Return the persistent log attributes, which are the attributes
   * that will be logged in all log items.
   */
  public getPersistentLogAttributes(): LogAttributes {
    return this.persistentLogAttributes;
  }

  /**
   * Print a log item with level INFO.
   *
   * @param input - The log message.
   * @param extraInput - The extra input to log.
   */
  public info(input: LogItemMessage, ...extraInput: LogItemExtraInput): void {
    this.processLogItem(LogLevelThreshold.INFO, input, extraInput);
  }

  /**
   * Class method decorator that adds the current Lambda function context as extra
   * information in all log items.
   *
   * This decorator is useful when you want to add the Lambda context to all log items
   * and it works only when decorating a class method that is a Lambda function handler.
   *
   * @example
   * ```typescript
   * import { Logger } from '@aws-lambda-powertools/logger';
   * import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
   *
   * const logger = new Logger({ serviceName: 'serverlessAirline' });
   *
   * class Lambda implements LambdaInterface {
   *   // Decorate your handler class method
   *   ⁣@logger.injectLambdaContext()
   *   public async handler(_event: unknown, _context: unknown): Promise<void> {
   *     logger.info('This is an INFO log with some context');
   *   }
   * }
   *
   * const handlerClass = new Lambda();
   * export const handler = handlerClass.handler.bind(handlerClass);
   * ```
   *
   * @see https://www.typescriptlang.org/docs/handbook/decorators.html#method-decorators
   */
  public injectLambdaContext(
    options?: InjectLambdaContextOptions
  ): HandlerMethodDecorator {
    return (_target, _propertyKey, descriptor) => {
      const originalMethod = descriptor.value as
        | SyncHandler<Handler>
        | AsyncHandler<Handler>;
      const loggerRef = this;
      // Use a function() {} instead of an () => {} arrow function so that we can
      // access `myClass` as `this` in a decorated `myClass.myMethod()`.
      descriptor.value = async function (
        this: Handler,
        event,
        context,
        callback
      ) {
        Logger.injectLambdaContextBefore(loggerRef, event, context, options);

        let result: unknown;
        try {
          result = await originalMethod.apply(this, [event, context, callback]);
        } finally {
          if (options?.clearState || options?.resetKeys) loggerRef.resetKeys();
        }

        return result;
      };
    };
  }

  /**
   * @deprecated This method is deprecated and will be removed in the future major versions. Use {@link resetKeys()} instead.
   */
  /* v8 ignore start */ public static injectLambdaContextAfterOrOnError(
    logger: Logger,
    _persistentAttributes: LogAttributes,
    options?: InjectLambdaContextOptions
  ): void {
    if (options && (options.clearState || options?.resetKeys)) {
      logger.resetKeys();
    }
  } /* v8 ignore stop */

  /**
   * @deprecated - This method is deprecated and will be removed in the next major version.
   */
  public static injectLambdaContextBefore(
    logger: Logger,
    event: unknown,
    context: Context,
    options?: InjectLambdaContextOptions
  ): void {
    logger.addContext(context);

    let shouldLogEvent = undefined;
    if (options && Object.hasOwn(options, 'logEvent')) {
      shouldLogEvent = options.logEvent;
    }
    logger.logEventIfEnabled(event, shouldLogEvent);
  }

  /**
   * Log the AWS Lambda event payload for the current invocation if the environment variable `POWERTOOLS_LOGGER_LOG_EVENT` is set to `true`.
   *
   * @example
   * ```ts
   * process.env.POWERTOOLS_LOGGER_LOG_EVENT = 'true';
   *
   * import { Logger } from '@aws-lambda-powertools/logger';
   *
   * const logger = new Logger();
   *
   * export const handler = async (event) => {
   *   logger.logEventIfEnabled(event);
   *   // ... your handler code
   * }
   * ```
   *
   * @param event - The AWS Lambda event payload.
   * @param overwriteValue - Overwrite the environment variable value.
   */
  public logEventIfEnabled(event: unknown, overwriteValue?: boolean): void {
    if (!this.shouldLogEvent(overwriteValue)) return;
    this.info('Lambda invocation event', { event });
  }

  /**
   * This method allows recalculating the initial sampling decision for changing
   * the log level to DEBUG based on a sample rate value used during initialization,
   * potentially yielding a different outcome.
   */
  public refreshSampleRateCalculation(): void {
    this.setInitialSampleRate(this.powertoolsLogData.sampleRateValue);
  }

  /**
   * Remove temporary attributes based on provided keys to all log items generated by this Logger instance.
   *
   * @param keys - The keys to remove.
   */
  public removeKeys(keys: string[]): void {
    for (const key of keys) {
      this.temporaryLogAttributes[key] = undefined;

      if (this.persistentLogAttributes[key]) {
        this.#keys.set(key, 'persistent');
      } else {
        this.#keys.delete(key);
      }
    }
  }

  /**
   * Remove the given keys from the persistent keys.
   *
   * @example
   * ```typescript
   * import { Logger } from '@aws-lambda-powertools/logger';
   *
   * const logger = new Logger({
   *   persistentKeys: {
   *     environment: 'prod',
   *   },
   * });
   *
   * logger.removePersistentKeys(['environment']);
   * ```
   *
   * @param keys - The keys to remove from the persistent attributes.
   */
  public removePersistentKeys(keys: string[]): void {
    for (const key of keys) {
      this.persistentLogAttributes[key] = undefined;

      if (this.temporaryLogAttributes[key]) {
        this.#keys.set(key, 'temp');
      } else {
        this.#keys.delete(key);
      }
    }
  }

  /**
   * @deprecated This method is deprecated and will be removed in the future major versions. Use {@link removePersistentKeys()} instead.
   */
  public removePersistentLogAttributes(keys: string[]): void {
    this.removePersistentKeys(keys);
  }

  /**
   * Remove all temporary log attributes added with {@link appendKeys() `appendKeys()`} method.
   */
  public resetKeys(): void {
    for (const key of Object.keys(this.temporaryLogAttributes)) {
      if (this.persistentLogAttributes[key]) {
        this.#keys.set(key, 'persistent');
      } else {
        this.#keys.delete(key);
      }
    }
    this.temporaryLogAttributes = {};
  }

  /**
   * Set the log level for this Logger instance.
   *
   * If the log level is set using AWS Lambda Advanced Logging Controls, it sets it
   * instead of the given log level to avoid data loss.
   *
   * @param logLevel The log level to set, i.e. `error`, `warn`, `info`, `debug`, etc.
   */
  public setLogLevel(logLevel: LogLevel): void {
    if (this.awsLogLevelShortCircuit(logLevel)) return;
    if (this.isValidLogLevel(logLevel)) {
      this.logLevel = LogLevelThreshold[logLevel];
    } else {
      throw new Error(`Invalid log level: ${logLevel}`);
    }
  }

  /**
   * @deprecated This method is deprecated and will be removed in the future major versions, please use {@link appendPersistentKeys() `appendPersistentKeys()`} instead.
   */
  public setPersistentLogAttributes(attributes: LogKeys): void {
    this.persistentLogAttributes = attributes;
  }

  /**
   * Check whether the current Lambda invocation event should be printed in the logs or not.
   *
   * @param overwriteValue - Overwrite the environment variable value.
   */
  public shouldLogEvent(overwriteValue?: boolean): boolean {
    if (typeof overwriteValue === 'boolean') {
      return overwriteValue;
    }

    return this.getLogEvent();
  }

  /**
   * Print a log item with level TRACE.
   *
   * @param input - The log message.
   * @param extraInput - The extra input to log.
   */
  public trace(input: LogItemMessage, ...extraInput: LogItemExtraInput): void {
    this.processLogItem(LogLevelThreshold.TRACE, input, extraInput);
  }

  /**
   * Print a log item with level WARN.
   *
   * @param input - The log message.
   * @param extraInput - The extra input to log.
   */
  public warn(input: LogItemMessage, ...extraInput: LogItemExtraInput): void {
    this.processLogItem(LogLevelThreshold.WARN, input, extraInput);
  }

  /**
   * Factory method for instantiating logger instances. Used by `createChild` method.
   * Important for customization and subclassing. It allows subclasses, like `MyOwnLogger`,
   * to override its behavior while keeping the main business logic in `createChild` intact.
   *
   * @example
   * ```typescript
   * // MyOwnLogger subclass
   * class MyOwnLogger extends Logger {
   *   protected createLogger(options?: ConstructorOptions): MyOwnLogger {
   *     return new MyOwnLogger(options);
   *   }
   *   // No need to re-implement business logic from `createChild` and keep track on changes
   *   public createChild(options?: ConstructorOptions): MyOwnLogger {
   *     return super.createChild(options) as MyOwnLogger;
   *   }
   * }
   * ```
   *
   * @param options - Logger configuration options.
   */
  protected createLogger(options?: ConstructorOptions): Logger {
    return new Logger(options);
  }

  /**
   * A custom JSON replacer function that is used to serialize the log items.
   *
   * By default, we already extend the default serialization behavior to handle `BigInt` and `Error` objects, as well as remove circular references.
   * When a custom JSON replacer function is passed to the Logger constructor, it will be called **before** our custom rules for each key-value pair in the object being stringified.
   *
   * This allows you to customize the serialization while still benefiting from the default behavior.
   *
   * @see {@link ConstructorOptions.jsonReplacerFn}
   */
  protected getJsonReplacer(): (key: string, value: unknown) => void {
    const references = new WeakSet();

    return (key, value) => {
      let replacedValue = value;
      if (this.#jsonReplacerFn)
        replacedValue = this.#jsonReplacerFn?.(key, replacedValue);

      if (replacedValue instanceof Error) {
        replacedValue = this.getLogFormatter().formatError(replacedValue);
      }
      if (typeof replacedValue === 'bigint') {
        return replacedValue.toString();
      }
      if (typeof replacedValue === 'object' && replacedValue !== null) {
        if (references.has(replacedValue)) {
          return;
        }
        references.add(replacedValue);
      }

      return replacedValue;
    };
  }

  /**
   * Store information that is printed in all log items.
   *
   * @param attributes - The attributes to add to all log items.
   */
  private addToPowertoolsLogData(attributes: Partial<PowertoolsLogData>): void {
    merge(this.powertoolsLogData, attributes);
  }

  /**
   * Shared logic for adding keys to the logger instance.
   *
   * @param attributes - The attributes to add to the log item.
   * @param type - The type of the attributes to add.
   */
  #appendKeys(attributes: LogKeys, type: 'temp' | 'persistent'): void {
    for (const attributeKey of Object.keys(attributes)) {
      if (this.#checkReservedKeyAndWarn(attributeKey) === false) {
        this.#keys.set(attributeKey, type);
      }
    }
    if (type === 'temp') {
      merge(this.temporaryLogAttributes, attributes);
    } else {
      merge(this.persistentLogAttributes, attributes);
    }
  }

  private awsLogLevelShortCircuit(selectedLogLevel?: string): boolean {
    const awsLogLevel = this.getEnvVarsService().getAwsLogLevel();
    if (this.isValidLogLevel(awsLogLevel)) {
      this.logLevel = LogLevelThreshold[awsLogLevel];

      if (
        this.isValidLogLevel(selectedLogLevel) &&
        this.logLevel > LogLevelThreshold[selectedLogLevel]
      ) {
        this.warn(
          `Current log level (${selectedLogLevel}) does not match AWS Lambda Advanced Logging Controls minimum log level (${awsLogLevel}). This can lead to data loss, consider adjusting them.`
        );
      }

      return true;
    }

    return false;
  }

  /**
   * Create a log item and populate it with the given log level, input, and extra input.
   */
  protected createAndPopulateLogItem(
    logLevel: number,
    input: LogItemMessage,
    extraInput: LogItemExtraInput
  ): LogItem {
    const unformattedBaseAttributes = {
      logLevel: this.getLogLevelNameFromNumber(logLevel),
      timestamp: new Date(),
      xRayTraceId: this.envVarsService.getXrayTraceId(),
      ...this.getPowertoolsLogData(),
      message: '',
    };
    const additionalAttributes = this.#createAdditionalAttributes();

    this.#processMainInput(
      input,
      unformattedBaseAttributes,
      additionalAttributes
    );
    this.#processExtraInput(extraInput, additionalAttributes);

    return this.getLogFormatter().formatAttributes(
      unformattedBaseAttributes,
      additionalAttributes
    );
  }

  /**
   * Create additional attributes from persistent and temporary keys
   */
  #createAdditionalAttributes(): LogAttributes {
    const attributes: LogAttributes = {};

    for (const [key, type] of this.#keys) {
      if (!this.#checkReservedKeyAndWarn(key)) {
        attributes[key] =
          type === 'persistent'
            ? this.persistentLogAttributes[key]
            : this.temporaryLogAttributes[key];
      }
    }

    return attributes;
  }

  /**
   * Process the main input message and add it to the attributes
   */
  #processMainInput(
    input: LogItemMessage,
    baseAttributes: UnformattedAttributes,
    additionalAttributes: LogAttributes
  ): void {
    if (typeof input === 'string') {
      baseAttributes.message = input;
      return;
    }

    const { message, ...rest } = input;
    baseAttributes.message = message;

    for (const [key, value] of Object.entries(rest)) {
      if (!this.#checkReservedKeyAndWarn(key)) {
        additionalAttributes[key] = value;
      }
    }
  }

  /**
   * Process extra input items and add them to additional attributes
   */
  #processExtraInput(
    extraInput: LogItemExtraInput,
    additionalAttributes: LogAttributes
  ): void {
    for (const item of extraInput) {
      if (isNullOrUndefined(item)) {
        continue;
      }
      if (item instanceof Error) {
        additionalAttributes.error = item;
      } else if (typeof item === 'string') {
        additionalAttributes.extra = item;
      } else {
        this.#processExtraObject(item, additionalAttributes);
      }
    }
  }

  /**
   * Process an extra input object and add its properties to additional attributes
   */
  #processExtraObject(
    item: Record<string, unknown>,
    additionalAttributes: LogAttributes
  ): void {
    for (const [key, value] of Object.entries(item)) {
      if (!this.#checkReservedKeyAndWarn(key)) {
        additionalAttributes[key] = value;
      }
    }
  }

  /**
   * Check if a given key is reserved and warn the user if it is.
   *
   * @param key - The key to check
   */
  #checkReservedKeyAndWarn(key: string): boolean {
    if (ReservedKeys.includes(key)) {
      this.warn(`The key "${key}" is a reserved key and will be dropped.`);
      return true;
    }
    return false;
  }

  /**
   * Get the custom config service, an abstraction used to fetch environment variables.
   */
  private getCustomConfigService(): ConfigServiceInterface | undefined {
    return this.customConfigService;
  }

  /**
   * Get the instance of a service that fetches environment variables.
   */
  private getEnvVarsService(): EnvironmentVariablesService {
    return this.envVarsService as EnvironmentVariablesService;
  }

  /**
   * Get the instance of a service that formats the structure of a
   * log item's keys and values in the desired way.
   */
  private getLogFormatter(): LogFormatter {
    return this.logFormatter as LogFormatter;
  }

  /**
   * Get the log level name from the log level number.
   *
   * For example, if the log level is 16, it will return 'WARN'.
   *
   * @param logLevel - The log level to get the name of
   */
  private getLogLevelNameFromNumber(logLevel: number): Uppercase<LogLevel> {
    let found: Uppercase<LogLevel> | undefined;
    for (const [key, value] of Object.entries(LogLevelThreshold)) {
      if (value === logLevel) {
        found = key as Uppercase<LogLevel>;
        break;
      }
    }

    return found as Uppercase<LogLevel>;
  }

  /**
   * Get information that will be added in all log item by
   * this Logger instance (different from user-provided persistent attributes).
   */
  private getPowertoolsLogData(): PowertoolsLogData {
    return this.powertoolsLogData;
  }

  /**
   * Check if a given log level is valid.
   *
   * @param logLevel - The log level to check
   */
  private isValidLogLevel(
    logLevel?: LogLevel | string
  ): logLevel is Uppercase<LogLevel> {
    return typeof logLevel === 'string' && logLevel in LogLevelThreshold;
  }

  /**
   * Check if a given sample rate value is valid.
   *
   * @param sampleRateValue - The sample rate value to check
   */
  private isValidSampleRate(
    sampleRateValue?: number
  ): sampleRateValue is number {
    return (
      typeof sampleRateValue === 'number' &&
      0 <= sampleRateValue &&
      sampleRateValue <= 1
    );
  }

  /**
   * Print a given log with given log level.
   *
   * @param logLevel - The log level
   * @param log - The log item to print
   */
  protected printLog(logLevel: number, log: LogItem): void {
    log.prepareForPrint();

    const consoleMethod =
      logLevel === LogLevelThreshold.CRITICAL
        ? 'error'
        : (this.getLogLevelNameFromNumber(logLevel).toLowerCase() as keyof Omit<
            LogFunction,
            'critical'
          >);

    this.console[consoleMethod](
      JSON.stringify(
        log.getAttributes(),
        this.getJsonReplacer(),
        this.logIndentation
      )
    );
  }

  /**
   * Print or buffer a given log with given log level.
   *
   * @param logLevel - The log level threshold
   * @param input - The log message
   * @param extraInput - The extra input to log
   */
  protected processLogItem(
    logLevel: number,
    input: LogItemMessage,
    extraInput: LogItemExtraInput
  ): void {
    if (logLevel >= this.logLevel) {
      if (this.#isInitialized) {
        this.printLog(
          logLevel,
          this.createAndPopulateLogItem(logLevel, input, extraInput)
        );
      } else {
        this.#initBuffer.push([logLevel, [logLevel, input, extraInput]]);
      }
      return;
    }

    const traceId = this.envVarsService.getXrayTraceId();
    if (traceId !== undefined && this.shouldBufferLog(traceId, logLevel)) {
      try {
        this.bufferLogItem(
          traceId,
          this.createAndPopulateLogItem(logLevel, input, extraInput),
          logLevel
        );
      } catch (error) {
        this.printLog(
          LogLevelThreshold.WARN,
          this.createAndPopulateLogItem(
            LogLevelThreshold.WARN,
            `Unable to buffer log: ${(error as Error).message}`,
            [error as Error]
          )
        );

        this.printLog(
          logLevel,
          this.createAndPopulateLogItem(logLevel, input, extraInput)
        );
      }
    }
  }

  /**
   * Initialize the console property as an instance of the internal version of Console() class (PR #748)
   * or as the global node console if the `POWERTOOLS_DEV' env variable is set and has truthy value.
   */
  private setConsole(): void {
    if (!this.getEnvVarsService().isDevMode()) {
      this.console = new Console({
        stdout: process.stdout,
        stderr: process.stderr,
      });
    } else {
      this.console = console;
    }

    /**
     * Patch `console.trace` to avoid printing a stack trace and aligning with AWS Lambda behavior - see #2902
     */
    this.console.trace = (message: string, ...optionalParams: unknown[]) => {
      this.console.log(message, ...optionalParams);
    };
  }

  /**
   * Set the Logger's customer config service instance, which will be used
   * to fetch environment variables.
   *
   * @param customConfigService - The custom config service
   */
  private setCustomConfigService(
    customConfigService?: ConfigServiceInterface
  ): void {
    this.customConfigService = customConfigService
      ? customConfigService
      : undefined;
  }

  /**
   * Set the initial Logger log level based on the following order:
   * 1. If a log level is set using AWS Lambda Advanced Logging Controls, it sets it.
   * 2. If a log level is passed to the constructor, it sets it.
   * 3. If a log level is set via custom config service, it sets it.
   * 4. If a log level is set via env variables, it sets it.
   *
   * If none of the above is true, the default log level applies (`INFO`).
   *
   * @param logLevel - Log level passed to the constructor
   */
  private setInitialLogLevel(logLevel?: ConstructorOptions['logLevel']): void {
    const constructorLogLevel = logLevel?.toUpperCase();

    if (this.awsLogLevelShortCircuit(constructorLogLevel)) return;

    if (this.isValidLogLevel(constructorLogLevel)) {
      this.logLevel = LogLevelThreshold[constructorLogLevel];
      this.#initialLogLevel = this.logLevel;

      return;
    }
    const customConfigValue = this.getCustomConfigService()
      ?.getLogLevel()
      ?.toUpperCase();
    if (this.isValidLogLevel(customConfigValue)) {
      this.logLevel = LogLevelThreshold[customConfigValue];
      this.#initialLogLevel = this.logLevel;

      return;
    }
    const envVarsValue = this.getEnvVarsService()?.getLogLevel()?.toUpperCase();
    if (this.isValidLogLevel(envVarsValue)) {
      this.logLevel = LogLevelThreshold[envVarsValue];
      this.#initialLogLevel = this.logLevel;

      return;
    }
  }

  /**
   * Set the sample rate value with the following priority:
   * 1. Constructor value
   * 2. Custom config service value
   * 3. Environment variable value
   * 4. Default value (zero)
   *
   * @param sampleRateValue - The sample rate value
   */
  private setInitialSampleRate(sampleRateValue?: number): void {
    this.powertoolsLogData.sampleRateValue = 0;
    const constructorValue = sampleRateValue;
    const customConfigValue =
      this.getCustomConfigService()?.getSampleRateValue();
    const envVarsValue = this.getEnvVarsService().getSampleRateValue();
    for (const value of [constructorValue, customConfigValue, envVarsValue]) {
      if (this.isValidSampleRate(value)) {
        this.powertoolsLogData.sampleRateValue = value;

        if (
          this.logLevel > LogLevelThreshold.DEBUG &&
          value &&
          randomInt(0, 100) / 100 <= value
        ) {
          // only change logLevel if higher than debug, i.e. don't change from e.g. tracing to debug
          this.setLogLevel('DEBUG');
          this.debug('Setting log level to DEBUG due to sampling rate');
        } else {
          this.setLogLevel(
            this.getLogLevelNameFromNumber(this.#initialLogLevel)
          );
        }

        return;
      }
    }
  }

  /**
   * If the log event feature is enabled via env variable, it sets a property that tracks whether
   * the event passed to the Lambda function handler should be logged or not.
   */
  private setLogEvent(): void {
    if (this.getEnvVarsService().getLogEvent()) {
      this.logEvent = true;
    }
  }

  /**
   * Set the log formatter instance, in charge of giving a custom format
   * to the structured logs, and optionally the ordering for keys within logs.
   *
   * @param logFormatter - The log formatter
   * @param logRecordOrder - Optional list of keys to specify order in logs
   */
  private setLogFormatter(
    logFormatter?: ConstructorOptions['logFormatter'],
    logRecordOrder?: ConstructorOptions['logRecordOrder']
  ): void {
    this.logFormatter =
      logFormatter ??
      new PowertoolsLogFormatter({
        envVarsService: this.getEnvVarsService(),
        logRecordOrder,
      });
  }

  /**
   * If the `POWERTOOLS_DEV` env variable is set,
   * add JSON indentation for pretty printing logs.
   */
  private setLogIndentation(): void {
    if (this.getEnvVarsService().isDevMode()) {
      this.logIndentation = LogJsonIndent.PRETTY;
    }
  }

  /**
   * Configure the Logger instance settings that will affect the Logger's behaviour
   * and the content of all logs.
   *
   * @param options - Options to configure the Logger instance
   */
  private setOptions(
    options: Omit<ConstructorOptions, 'customConfigService'>
  ): this {
    const {
      logLevel,
      serviceName,
      sampleRateValue,
      logFormatter,
      persistentKeys,
      persistentLogAttributes, // deprecated in favor of persistentKeys
      environment,
      jsonReplacerFn,
      logRecordOrder,
    } = options;

    if (persistentLogAttributes && persistentKeys) {
      this.warn(
        'Both persistentLogAttributes and persistentKeys options were provided. Using persistentKeys as persistentLogAttributes is deprecated and will be removed in future releases'
      );
    }

    // configurations that affect log content
    this.setPowertoolsLogData(
      serviceName,
      environment,
      persistentKeys || persistentLogAttributes
    );

    // configurations that affect Logger behavior
    this.setLogEvent();
    this.setInitialLogLevel(logLevel);
    this.setInitialSampleRate(sampleRateValue);

    // configurations that affect how logs are printed
    this.setLogFormatter(logFormatter, logRecordOrder);
    this.setConsole();
    this.setLogIndentation();
    this.#jsonReplacerFn = jsonReplacerFn;

    return this;
  }

  /**
   * Add important data to the Logger instance that will affect the content of all logs.
   *
   * @param serviceName - The service name
   * @param environment - The environment
   * @param persistentKeys - The persistent log attributes
   */
  private setPowertoolsLogData(
    serviceName?: ConstructorOptions['serviceName'],
    environment?: ConstructorOptions['environment'],
    persistentKeys?: ConstructorOptions['persistentKeys']
  ): void {
    this.addToPowertoolsLogData({
      awsRegion: this.getEnvVarsService().getAwsRegion(),
      environment:
        environment ||
        this.getCustomConfigService()?.getCurrentEnvironment() ||
        this.getEnvVarsService().getCurrentEnvironment(),
      serviceName:
        serviceName ||
        this.getCustomConfigService()?.getServiceName() ||
        this.getEnvVarsService().getServiceName() ||
        this.getDefaultServiceName(),
    });
    persistentKeys && this.appendPersistentKeys(persistentKeys);
  }

  /**
   * Add a log to the buffer
   * @param xrayTraceId - _X_AMZN_TRACE_ID of the request
   * @param log - Log to be buffered
   * @param logLevel - level of log to be buffered
   */
  protected bufferLogItem(
    xrayTraceId: string,
    log: LogItem,
    logLevel: number
  ): void {
    log.prepareForPrint();

    const stringified = JSON.stringify(
      log.getAttributes(),
      this.getJsonReplacer(),
      this.logIndentation
    );

    this.#buffer.setItem(xrayTraceId, stringified, logLevel);
  }

  /**
   * Flushes all items of the respective _X_AMZN_TRACE_ID within
   * the buffer.
   */
  protected flushBuffer(): void {
    const traceId = this.envVarsService.getXrayTraceId();
    if (traceId === undefined) {
      return;
    }

    const buffer = this.#buffer.get(traceId);
    if (buffer === undefined) {
      return;
    }

    for (const item of buffer) {
      const consoleMethod =
        item.logLevel === LogLevelThreshold.CRITICAL
          ? 'error'
          : (this.getLogLevelNameFromNumber(
              item.logLevel
            ).toLowerCase() as keyof Omit<LogFunction, 'critical'>);
      this.console[consoleMethod](item.value);
    }
    if (buffer.hasEvictedLog) {
      this.printLog(
        LogLevelThreshold.WARN,
        this.createAndPopulateLogItem(
          LogLevelThreshold.WARN,
          'Some logs are not displayed because they were evicted from the buffer. Increase buffer size to store more logs in the buffer',
          []
        )
      );
    }

    this.#buffer.delete(traceId);
  }
  /**
   * Tests if the log meets the criteria to be buffered
   * @param traceId - _X_AMZN_TRACE_ID of the request
   * @param logLevel - The  level of the log being considered
   */
  protected shouldBufferLog(
    traceId: string | undefined,
    logLevel: number
  ): boolean {
    return (
      this.isBufferEnabled &&
      traceId !== undefined &&
      logLevel <= this.bufferLogThreshold
    );
  }
}

export { Logger };
