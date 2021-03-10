import { Context } from 'aws-lambda';
import { LoggerInterface } from '.';
import { LogItem } from './log';

import { cloneDeep, merge } from 'lodash/fp';
import { ConfigServiceInterface, EnvironmentVariablesService } from './config';
import {
  DefaultLoggerAttributes,
  Environment,
  LogAttributes,
  LoggerOptions,
  LogLevel,
  LogLevelThresholds, UnformattedAttributes,
} from '../types';
import { LogFormatterInterface, PowertoolLogFormatter } from './formatter';

class Logger implements LoggerInterface {

  private static coldStart: boolean = true;

  private customConfigService?: ConfigServiceInterface;

  private defaultLoggerAttributes: DefaultLoggerAttributes = {};

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

  private sampleRateValue?: number;

  public constructor(options: LoggerOptions = {}) {
    this.applyOptions(options);
  }

  public addContext(context: Context): void {
    this.addToDefaultLoggerAttributes(context, { isColdStart: Logger.isColdStart() });
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

  private addToDefaultLoggerAttributes(...attributesArray: Array<DefaultLoggerAttributes>): void {
    attributesArray.forEach((attributes: DefaultLoggerAttributes) => {
      this.defaultLoggerAttributes = merge(this.getDefaultLoggerAttributes(), attributes);
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
    this.populateDefaultLoggerAttributes(serviceName, environment, customAttributes);

    return this;
  }

  private createLogItem(logLevel: LogLevel, message: string, customAttributes: LogAttributes = {}): LogItem {
    this.addToDefaultLoggerAttributes({ logLevel, message, timestamp: new Date() });
    
    return new LogItem().addAttributes(this.getLogFormatter().format(this.getDefaultLoggerAttributes() as UnformattedAttributes))
      .addAttributes(customAttributes);
  }

  private getCustomConfigService(): ConfigServiceInterface | undefined {
    return this.customConfigService;
  }

  private getDefaultLoggerAttributes(): DefaultLoggerAttributes {
    return this.defaultLoggerAttributes;
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
    if (!this.logLevel) {
      this.setLogLevel();
    }

    return <LogLevel> this.logLevel;
  }

  private getSampleRateValue(): number | undefined {
    return this.sampleRateValue;
  }

  private populateDefaultLoggerAttributes(serviceName?: string, environment?: Environment, customAttributes: LogAttributes = {}): void {
    this.addToDefaultLoggerAttributes({
      awsRegion: this.getEnvVarsService().getAwsRegion(),
      environment: environment || this.getCustomConfigService()?.getCurrentEnvironment() || this.getEnvVarsService().getCurrentEnvironment(),
      functionName: this.getEnvVarsService().getFunctionName(),
      functionVersion: this.getEnvVarsService().getFunctionVersion(),
      logLevel: this.getLogLevel(),
      memoryLimitInMB: this.getEnvVarsService().getFunctionMemory(),
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
    this.logLevel = (logLevel || this.getCustomConfigService()?.getLogLevel() || this.getEnvVarsService().getLogLevel() || Logger.defaultLogLevel) as LogLevel;
  }

  private setSampleRateValue(sampleRateValue?: number): void {
    this.sampleRateValue = sampleRateValue || this.getCustomConfigService()?.getSampleRateValue() || this.getEnvVarsService().getSampleRateValue();
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