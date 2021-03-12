import { Context } from 'aws-lambda';
import { LoggerInterface } from '.';
import { LogItem } from './log';

import { cloneDeep, merge } from 'lodash/fp';
import { ConfigServiceInterface, EnvironmentVariablesService } from './config';
import {
  Environment,
  LoggerData,
  LogAttributes,
  LoggerOptions,
  LogLevel,
  LogLevelThresholds,
  UnformattedAttributes, LambdaFunctionContext,
} from '../types';
import { LogFormatterInterface, PowertoolLogFormatter } from './formatter';

class Logger implements LoggerInterface {

  private static coldStart: boolean = true;

  private customConfigService?: ConfigServiceInterface;

  private static readonly defaultLogLevel: LogLevel = 'INFO';

  private static readonly defaultSampleRate: number = 1;

  private envVarsService?: EnvironmentVariablesService;

  private logFormatter?: LogFormatterInterface;

  private logLevel?: LogLevel;

  private readonly logLevelThresholds: LogLevelThresholds = {
    'DEBUG' : 8,
    'INFO': 12,
    'WARN': 16,
    'ERROR': 20
  };

  private loggerData: LoggerData = <LoggerData>{};

  public constructor(options: LoggerOptions = {}) {
    this.applyOptions(options);
  }

  public addContext(context: Context): void {
    if (!this.isContextEnabled()) {
      return;
    }

    const lambdaContext: LambdaFunctionContext = {
      arn: context.invokedFunctionArn,
      awsRequestId: context.awsRequestId,
      coldStart: Logger.isColdStart(),
      memoryLimitInMB: Number(context.memoryLimitInMB),
      name: context.functionName,
      version: context.functionVersion,
    };

    this.addToLoggerData({
      lambdaContext
    });

  }

  public createChild(options: LoggerOptions = {}): Logger {
    return cloneDeep(this).applyOptions(options);
  }

  public debug(message: string, attributes: LogAttributes = {}): void {
    this.printLog('DEBUG', this.createLogItem('DEBUG', message, attributes).getAttributes());
  }

  public error(message: string, attributes: LogAttributes = {}): void {
    this.printLog('ERROR', this.createLogItem('ERROR', message, attributes).getAttributes());
  }

  public info(message: string, attributes: LogAttributes = {}): void {
    this.printLog('INFO', this.createLogItem('INFO', message, attributes).getAttributes());
  }

  public static isColdStart(): boolean {
    if (Logger.coldStart === true) {
      Logger.coldStart = false;

      return true;
    }

    return false;
  }

  public warn(message: string, attributes: LogAttributes = {}): void {
    this.printLog('WARN', this.createLogItem('WARN', message, attributes).getAttributes());
  }

  private addToLoggerData(...attributesArray: Array<Partial<LoggerData>>): void {
    attributesArray.forEach((attributes: Partial<LoggerData>) => {
      this.loggerData = merge(this.getLoggerData(), attributes);
    });
  }

  private applyOptions(options: LoggerOptions = {}): Logger {
    const {
      logLevel,
      serviceName,
      sampleRateValue,
      logFormatter,
      customConfigService,
      customAttributes,
      environment
    } = options;

    this.setEnvVarsService();
    this.setCustomConfigService(customConfigService);
    this.setLogLevel(logLevel);
    this.setSampleRateValue(sampleRateValue);
    this.setLogFormatter(logFormatter);
    this.populateLoggerData(serviceName, environment, customAttributes);

    return this;
  }

  private createLogItem(logLevel: LogLevel, message: string, customAttributes: LogAttributes = {}): LogItem {
    const unformattedAttributes: UnformattedAttributes = merge({ logLevel, message, timestamp: new Date() }, this.getLoggerData());
    
    return new LogItem()
      .addAttributes(this.getLogFormatter().format(unformattedAttributes))
      .addAttributes(customAttributes);
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
    if (this.loggerData?.logLevel) {
      this.setLogLevel();
    }

    return <LogLevel> this.logLevel;
  }

  private getLoggerData(): LoggerData {
    return this.loggerData;
  }

  private getSampleRateValue(): number {
    if (!this.loggerData?.sampleRateValue) {
      this.setSampleRateValue();
    }

    return <number> this.loggerData?.sampleRateValue;
  }

  private isContextEnabled(): boolean {
    return this.getCustomConfigService()?.getIsContextEnabled() === true || this.getEnvVarsService().getIsContextEnabled() === true;
  }

  private populateLoggerData(serviceName?: string, environment?: Environment, customAttributes: LogAttributes = {}): void {

    if (this.isContextEnabled()) {
      this.addToLoggerData( {
        lambdaContext: {
          coldStart: Logger.isColdStart(),
          memoryLimitInMB: this.getEnvVarsService().getFunctionMemory(),
          name: this.getEnvVarsService().getFunctionName(),
          version:this.getEnvVarsService().getFunctionVersion(),
        }
      });
    }

    this.addToLoggerData({
      awsRegion: this.getEnvVarsService().getAwsRegion(),
      environment: environment || this.getCustomConfigService()?.getCurrentEnvironment() || this.getEnvVarsService().getCurrentEnvironment(),
      sampleRateValue: this.getSampleRateValue(),
      serviceName: serviceName || this.getCustomConfigService()?.getServiceName() || this.getEnvVarsService().getServiceName(),
      xRayTraceId: this.getEnvVarsService().getXrayTraceId(),
    }, customAttributes );
  }

  private printLog(logLevel: LogLevel, log: LogAttributes): void {
    if (!this.shouldPrint(logLevel)) {
      return;
    }

    Object.keys(log).forEach(key => (log[key] === undefined || log[key] === '' || log[key] === null) && delete log[key]);

    console.log(log);
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

  private setSampleRateValue(sampleRateValue?: number): void {
    this.loggerData.sampleRateValue = sampleRateValue || this.getCustomConfigService()?.getSampleRateValue()
      || this.getEnvVarsService().getSampleRateValue() || Logger.defaultSampleRate;
  }

  private shouldPrint(logLevel: LogLevel): boolean {
    if (this.logLevelThresholds[logLevel] >= this.logLevelThresholds[this.getLogLevel()]) {
      return true;
    }

    // TODO: refactor this logic (Math.random() does not provide cryptographically secure random numbers)
    const sampleRateValue = this.getSampleRateValue();
    if (sampleRateValue && (sampleRateValue === 1 || Math.random() < sampleRateValue)) {
      return true;
    }

    return false;
  }

}

export {
  Logger
};