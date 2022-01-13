import type { Context } from 'aws-lambda';
import { LogFormatterInterface, PowertoolLogFormatter } from './formatter';
import { LogItem } from './log';
import cloneDeep from 'lodash.clonedeep';
import merge from 'lodash.merge';
import { ConfigServiceInterface, EnvironmentVariablesService } from './config';
import type {
  ClassThatLogs,
  Environment,
  HandlerMethodDecorator,
  LambdaFunctionContext,
  LogAttributes,
  LoggerOptions,
  LogItemExtraInput,
  LogItemMessage,
  LogLevel,
  LogLevelThresholds,
  PowertoolLogData,
} from './types';

class Logger implements ClassThatLogs {

  private static coldStart?: boolean = undefined;

  private static coldStartEvaluated: boolean = false;

  private customConfigService?: ConfigServiceInterface;

  private static readonly defaultLogLevel: LogLevel = 'INFO';

  private static readonly defaultServiceName: string = 'service_undefined';

  private envVarsService?: EnvironmentVariablesService;

  private logFormatter?: LogFormatterInterface;

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

  public constructor(options: LoggerOptions = {}) {
    this.setOptions(options);
  }

  public addContext(context: Context): void {
    Logger.evaluateColdStartOnce();
    const lambdaContext: Partial<LambdaFunctionContext> = {
      invokedFunctionArn: context.invokedFunctionArn,
      coldStart: Logger.getColdStartValue(),
      awsRequestId: context.awsRequestId,
      memoryLimitInMB: Number(context.memoryLimitInMB),
      functionName: context.functionName,
      functionVersion: context.functionVersion,
    };

    this.addToPowertoolLogData({
      lambdaContext,
    });
  }

  public addPersistentLogAttributes(attributes?: LogAttributes): void {
    this.persistentLogAttributes = merge(attributes, this.getPersistentLogAttributes());
  }

  public appendKeys(attributes?: LogAttributes): void {
    this.addPersistentLogAttributes(attributes);
  }

  public createChild(options: LoggerOptions = {}): Logger {
    return cloneDeep(this).setOptions(options);
  }

  public debug(input: LogItemMessage, ...extraInput: LogItemExtraInput): void {
    this.processLogItem('DEBUG', input, extraInput);
  }

  public error(input: LogItemMessage, ...extraInput: LogItemExtraInput): void {
    this.processLogItem('ERROR', input, extraInput);
  }

  public static evaluateColdStartOnce(): void {
    if (!Logger.getColdStartEvaluatedValue()) {
      Logger.evaluateColdStart();
    }
  }

  public static getColdStartEvaluatedValue(): boolean {
    return Logger.coldStartEvaluated;
  }

  public static getColdStartValue(): boolean | undefined {
    return Logger.coldStart;
  }

  public getLogsSampled(): boolean {
    return this.logsSampled;
  }

  public info(input: LogItemMessage, ...extraInput: LogItemExtraInput): void {
    this.processLogItem('INFO', input, extraInput);
  }

  public injectLambdaContext(): HandlerMethodDecorator {
    return (target, propertyKey, descriptor) => {
      const originalMethod = descriptor.value;

      descriptor.value = (event, context, callback) => {
        this.addContext(context);

        return originalMethod?.apply(this, [ event, context, callback ]);
      };
    };
  }

  public refreshSampleRateCalculation(): void {
    this.setLogsSampled();
  }

  public static setColdStartEvaluatedValue(value: boolean): void {
    Logger.coldStartEvaluated = value;
  }

  public static setColdStartValue(value: boolean | undefined): void {
    Logger.coldStart = value;
  }

  public setSampleRateValue(sampleRateValue?: number): void {
    this.powertoolLogData.sampleRateValue =
      sampleRateValue ||
      this.getCustomConfigService()?.getSampleRateValue() ||
      this.getEnvVarsService().getSampleRateValue();
  }

  public warn(input: LogItemMessage, ...extraInput: LogItemExtraInput): void {
    this.processLogItem('WARN', input, extraInput);
  }

  private addToPowertoolLogData(...attributesArray: Array<Partial<PowertoolLogData>>): void {
    attributesArray.forEach((attributes: Partial<PowertoolLogData>) => {
      this.powertoolLogData = merge(attributes, this.getPowertoolLogData());
    });
  }

  private createAndPopulateLogItem(logLevel: LogLevel, input: LogItemMessage, extraInput: LogItemExtraInput): LogItem {
    const unformattedBaseAttributes = merge({
      logLevel,
      timestamp: new Date(),
      message: typeof input === 'string' ? input : input.message,
    }, this.getPowertoolLogData());

    const logItem = new LogItem({
      baseAttributes: this.getLogFormatter().formatAttributes(unformattedBaseAttributes),
      persistentAttributes: this.getPersistentLogAttributes(),
    });

    // Add ephemeral attributes
    if (typeof input !== 'string') {
      logItem.addAttributes(input);
    }
    extraInput.forEach((item: Error | LogAttributes | unknown) => {
      const attributes = item instanceof Error ? { error: item } : item;
      logItem.addAttributes(<LogAttributes>attributes);
    });

    return logItem;
  }

  private static evaluateColdStart(): void {
    const coldStartValue = Logger.getColdStartValue();
    if (typeof coldStartValue === 'undefined') {
      Logger.setColdStartValue(true);
    } else if (coldStartValue) {
      Logger.setColdStartValue(false);
    } else {
      Logger.setColdStartValue(false);
    }

    Logger.setColdStartEvaluatedValue(true);
  }

  private getCustomConfigService(): ConfigServiceInterface | undefined {
    return this.customConfigService;
  }

  private getEnvVarsService(): EnvironmentVariablesService {
    return <EnvironmentVariablesService> this.envVarsService;
  }

  private getLogFormatter(): LogFormatterInterface {
    return <LogFormatterInterface> this.logFormatter;
  }

  private getLogLevel(): LogLevel {
    return <LogLevel> this.logLevel;
  }

  private getPersistentLogAttributes(): LogAttributes {
    return <LogAttributes> this.persistentLogAttributes;
  }

  private getPowertoolLogData(): PowertoolLogData {
    return this.powertoolLogData;
  }

  private getSampleRateValue(): number {
    if (!this.powertoolLogData?.sampleRateValue) {
      this.setSampleRateValue();
    }

    return <number> this.powertoolLogData?.sampleRateValue;
  }

  private isValidLogLevel(logLevel?: LogLevel): boolean {
    return typeof logLevel === 'string' && logLevel.toUpperCase() in this.logLevelThresholds;
  }

  private printLog(logLevel: LogLevel, log: LogItem): void {
    log.prepareForPrint();

    const consoleMethod = logLevel.toLowerCase() as keyof ClassThatLogs;

    console[consoleMethod](JSON.stringify(log.getAttributes(), this.removeCircularDependencies()));
  }

  private processLogItem(logLevel: LogLevel, input: LogItemMessage, extraInput: LogItemExtraInput): void {
    if (!this.shouldPrint(logLevel)) {
      return;
    }
    this.printLog(logLevel, this.createAndPopulateLogItem(logLevel, input, extraInput));
  }

  /**
   * When the data added in the log item when contains object references,
   * JSON.stringify() doesn't try to solve them and throws an error: TypeError: cyclic object value.
   * To mitigate this issue, this function will find and remove the cyclic references.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Cyclic_object_value
   * @private
   */
  private removeCircularDependencies(): (key: string, value: LogAttributes) => void {
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

  private setCustomConfigService(customConfigService?: ConfigServiceInterface): void {
    this.customConfigService = customConfigService ? customConfigService : undefined;
  }

  private setEnvVarsService(): void {
    this.envVarsService = new EnvironmentVariablesService();
  }

  private setLogFormatter(logFormatter?: LogFormatterInterface): void {
    this.logFormatter = logFormatter || new PowertoolLogFormatter();
  }

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

  private setLogsSampled(): void {
    const sampleRateValue = this.getSampleRateValue();
    // TODO: revisit Math.random() as it's not a real randomization
    this.logsSampled = sampleRateValue !== undefined && (sampleRateValue === 1 || Math.random() < sampleRateValue);
  }

  private setOptions(options: LoggerOptions): Logger {
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
    this.setCustomConfigService(customConfigService);
    this.setLogLevel(logLevel);
    this.setSampleRateValue(sampleRateValue);
    this.setLogsSampled();
    this.setLogFormatter(logFormatter);
    this.setPowertoolLogData(serviceName, environment);

    this.addPersistentLogAttributes(persistentLogAttributes);

    return this;
  }

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
          serviceName || this.getCustomConfigService()?.getServiceName() || this.getEnvVarsService().getServiceName() || Logger.defaultServiceName,
        xRayTraceId: this.getEnvVarsService().getXrayTraceId(),
      },
      persistentLogAttributes,
    );
  }

  private shouldPrint(logLevel: LogLevel): boolean {
    if (this.logLevelThresholds[logLevel] >= this.logLevelThresholds[this.getLogLevel()]) {
      return true;
    }

    return this.getLogsSampled();
  }
}

export { Logger };
