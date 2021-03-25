import { Context } from 'aws-lambda';
import { LoggerInterface } from '.';
import { LogItem } from './log';

import { cloneDeep, merge } from 'lodash/fp';
import { ConfigServiceInterface, EnvironmentVariablesService } from './config';
import {
  Environment,
  HandlerMethodDecorator,
  PowertoolLogData,
  LogAttributes,
  LoggerOptions,
  LogLevel,
  LogLevelThresholds,
  LambdaFunctionContext,
  LogItemMessage,
  LogItemExtraInput,
} from '../types';
import { LogFormatterInterface, PowertoolLogFormatter } from './formatter';

class Logger implements LoggerInterface {

  private static coldStart: boolean = true;

  private customConfigService?: ConfigServiceInterface;

  private static readonly defaultLogLevel: LogLevel = 'INFO';

  private envVarsService?: EnvironmentVariablesService;

  private logFormatter?: LogFormatterInterface;

  private logLevel?: LogLevel;

  private readonly logLevelThresholds: LogLevelThresholds = {
    'DEBUG' : 8,
    'INFO': 12,
    'WARN': 16,
    'ERROR': 20
  };

  private logsSampled: boolean = false;

  private persistentLogAttributes?: LogAttributes = {};

  private powertoolLogData: PowertoolLogData = <PowertoolLogData>{};

  public constructor(options: LoggerOptions = {}) {
    this.setOptions(options);
  }

  public addContext(context: Context): void {
    const lambdaContext: Partial<LambdaFunctionContext> = {
      invokedFunctionArn: context.invokedFunctionArn,
      coldStart: Logger.isColdStart(),
      awsRequestId: context.awsRequestId,
      memoryLimitInMB: Number(context.memoryLimitInMB),
      functionName: context.functionName,
      functionVersion: context.functionVersion,
    };

    this.addToPowertoolLogData({
      lambdaContext
    });
  }

  public addPersistentLogAttributes(attributes?: LogAttributes): void {
    this.persistentLogAttributes = merge(this.getPersistentLogAttributes(), attributes);
  }

  public appendKeys(attributes?: LogAttributes): void {
    this.addPersistentLogAttributes(attributes);
  }

  public createChild(options: LoggerOptions = {}): Logger {
    return cloneDeep(this).setOptions(options);
  }

  public debug(input: LogItemMessage, ...extraInput: LogItemExtraInput): void {
    if (!this.shouldPrint('DEBUG')) {
      return;
    }
    this.printLog(this.createAndPopulateLogItem('DEBUG', input, extraInput));
  }

  public error(input: LogItemMessage, ...extraInput: LogItemExtraInput): void {
    if (!this.shouldPrint('ERROR')) {
      return;
    }
    this.printLog(this.createAndPopulateLogItem('ERROR', input, extraInput));
  }

  public info(input: LogItemMessage, ...extraInput: LogItemExtraInput): void {
    if (!this.shouldPrint('INFO')) {
      return;
    }
    this.printLog(this.createAndPopulateLogItem('INFO', input, extraInput));
  }

  public injectLambdaContext(): HandlerMethodDecorator {
    return (target, propertyKey, descriptor ) => {
      const originalMethod = descriptor.value;

      descriptor.value = (event, context, callback) => {
        this.addContext(context);
        const result = originalMethod?.apply(this, [ event, context, callback ]);

        return result;
      };
    };
  }

  public static isColdStart(): boolean {
    if (Logger.coldStart === true) {
      Logger.coldStart = false;

      return true;
    }

    return false;
  }

  public refreshSampleRateCalculation(): void {
    this.setLogsSampled();
  }

  public setSampleRateValue(sampleRateValue?: number): void {
    this.powertoolLogData.sampleRateValue = sampleRateValue || this.getCustomConfigService()?.getSampleRateValue()
      || this.getEnvVarsService().getSampleRateValue();
  }

  public warn(input: LogItemMessage, ...extraInput: LogItemExtraInput): void {
    if (!this.shouldPrint('WARN')) {
      return;
    }
    this.printLog(this.createAndPopulateLogItem('WARN', input, extraInput));
  }

  private addToPowertoolLogData(...attributesArray: Array<Partial<PowertoolLogData>>): void {
    attributesArray.forEach((attributes: Partial<PowertoolLogData>) => {
      this.powertoolLogData = merge(this.getPowertoolLogData(), attributes);
    });
  }

  private createAndPopulateLogItem(logLevel: LogLevel, input: LogItemMessage, extraInput: LogItemExtraInput): LogItem {

    const unformattedBaseAttributes = merge(
      this.getPowertoolLogData(),
      {
        logLevel,
        timestamp: new Date(),
        message: (typeof input === 'string') ? input : input.message
      });

    const logItem = new LogItem({
      baseAttributes: this.getLogFormatter().formatAttributes(unformattedBaseAttributes),
      persistentAttributes: this.getPersistentLogAttributes()
    });

    // Add ephemeral attributes
    if (typeof input !== 'string') {
      logItem.addAttributes(input);
    }
    extraInput.forEach((item: Error | LogAttributes) => {
      const attributes = (item instanceof Error) ? { error: item } : item;
      logItem.addAttributes(attributes);
    });
    
    return logItem;
  }

  private getCustomConfigService(): ConfigServiceInterface | undefined {
    return this.customConfigService;
  }

  private getEnvVarsService(): EnvironmentVariablesService {
    if (!this.envVarsService) {
      this.setEnvVarsService();
    }

    return <EnvironmentVariablesService> this.envVarsService;
  }

  private getLogFormatter(): LogFormatterInterface {
    if (!this.logFormatter) {
      this.setLogFormatter();
    }

    return <LogFormatterInterface> this.logFormatter;
  }

  private getLogLevel(): LogLevel {
    if (this.powertoolLogData?.logLevel) {
      this.setLogLevel();
    }

    return <LogLevel> this.logLevel;
  }

  private getLogsSampled(): boolean {
    return this.logsSampled;
  }

  private getPersistentLogAttributes(): LogAttributes {
    return this.persistentLogAttributes || {};
  }

  private getPowertoolLogData(): PowertoolLogData {
    return this.powertoolLogData || {};
  }

  private getSampleRateValue(): number {
    if (!this.powertoolLogData?.sampleRateValue) {
      this.setSampleRateValue();
    }

    return <number> this.powertoolLogData?.sampleRateValue;
  }

  private printLog(log: LogItem): void {
    log.prepareForPrint();

    const references = new WeakSet();

    try {
      console.log(JSON.parse(JSON.stringify(log.getAttributes(), (key: string, value: LogAttributes) => {
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
      })));
    } catch (err) {
      console.log('Unexpected error occurred trying to print the log', err);
    }
  }

  private setCustomConfigService(customConfigService?: ConfigServiceInterface): void {
    this.customConfigService = customConfigService? customConfigService : undefined;
  }

  private setEnvVarsService(): void {
    this.envVarsService = new EnvironmentVariablesService();
  }

  private setLogFormatter(logFormatter?: LogFormatterInterface): void {
    this.logFormatter = logFormatter || new PowertoolLogFormatter();
  }

  private setLogLevel(logLevel?: LogLevel): void {
    this.logLevel = (logLevel || this.getCustomConfigService()?.getLogLevel() || this.getEnvVarsService().getLogLevel()
      || Logger.defaultLogLevel) as LogLevel;
  }

  private setLogsSampled(): void {
    const sampleRateValue = this.getSampleRateValue();
    // TODO: revisit Math.random() as it's not a real randomization
    this.logsSampled = sampleRateValue !== undefined && (sampleRateValue === 1 || Math.random() < sampleRateValue);
  }

  private setOptions(options: LoggerOptions = {}): Logger {
    const {
      logLevel,
      serviceName,
      sampleRateValue,
      logFormatter,
      customConfigService,
      persistentLogAttributes,
      environment
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

  private setPowertoolLogData(serviceName?: string, environment?: Environment, persistentLogAttributes: LogAttributes = {}): void {
    this.addToPowertoolLogData({
      awsRegion: this.getEnvVarsService().getAwsRegion(),
      environment: environment || this.getCustomConfigService()?.getCurrentEnvironment() || this.getEnvVarsService().getCurrentEnvironment(),
      sampleRateValue: this.getSampleRateValue(),
      serviceName: serviceName || this.getCustomConfigService()?.getServiceName() || this.getEnvVarsService().getServiceName(),
      xRayTraceId: this.getEnvVarsService().getXrayTraceId(),
    }, persistentLogAttributes );
  }

  private shouldPrint(logLevel: LogLevel): boolean {
    if (this.logLevelThresholds[logLevel] >= this.logLevelThresholds[this.getLogLevel()]) {
      return true;
    }

    return this.getLogsSampled();
  }

}

export {
  Logger
};