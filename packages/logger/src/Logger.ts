import { Context } from 'aws-lambda';
import { LoggerInterface } from '.';
import { LogItem } from './log';

import { cloneDeep, merge } from 'lodash/fp';
import { ConfigServiceInterface, EnvironmentVariablesService } from './config';
import {
  Environment,
  PowertoolAttributes,
  LogAttributes,
  LoggerOptions,
  LogLevel,
  LogLevelThresholds,
  LambdaFunctionContext,
  LoggerInput,
  LoggerExtraInput
} from '../types';
import { LogFormatterInterface, PowertoolLogFormatter } from './formatter';

class Logger implements LoggerInterface {

  private static coldStart: boolean = true;

  private customAttributes?: LogAttributes = {};

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

  private powertoolAttributes: PowertoolAttributes = <PowertoolAttributes>{};

  public constructor(options: LoggerOptions = {}) {
    this.setOptions(options);
  }

  public addContext(context: Context): void {
    if (!this.isContextEnabled()) {
      return;
    }

    const lambdaContext: Partial<LambdaFunctionContext> = {
      arn: context.invokedFunctionArn,
      awsRequestId: context.awsRequestId,
      memoryLimitInMB: Number(context.memoryLimitInMB),
      name: context.functionName,
      version: context.functionVersion,
    };

    this.addToPowertoolAttributes({
      lambdaContext
    });

  }

  public createChild(options: LoggerOptions = {}): Logger {
    return cloneDeep(this).setOptions(options);
  }

  public debug(input: LoggerInput, ...extraInput: LoggerExtraInput): void {
    if (!this.shouldPrint('DEBUG')) {
      return;
    }
    this.printLog('DEBUG', this.createLogItem('DEBUG', input, extraInput).getAttributes());
  }

  public error(input: LoggerInput, ...extraInput: LoggerExtraInput): void {
    if (!this.shouldPrint('ERROR')) {
      return;
    }
    this.printLog('ERROR', this.createLogItem('ERROR', input, extraInput).getAttributes());
  }

  public info(input: LoggerInput, ...extraInput: LoggerExtraInput): void {
    if (!this.shouldPrint('INFO')) {
      return;
    }
    this.printLog('INFO', this.createLogItem('INFO', input, extraInput).getAttributes());
  }

  public static isColdStart(): boolean {
    if (Logger.coldStart === true) {
      Logger.coldStart = false;

      return true;
    }

    return false;
  }

  public warn(input: LoggerInput, ...extraInput: LoggerExtraInput): void {
    if (!this.shouldPrint('WARN')) {
      return;
    }
    this.printLog('WARN', this.createLogItem('WARN', input, extraInput).getAttributes());
  }

  private addToPowertoolAttributes(...attributesArray: Array<Partial<PowertoolAttributes>>): void {
    attributesArray.forEach((attributes: Partial<PowertoolAttributes>) => {
      this.powertoolAttributes = merge(this.getPowertoolAttributes(), attributes);
    });
  }

  private createLogItem(logLevel: LogLevel, input: LoggerInput, extraInput: LoggerExtraInput): LogItem {

    const logItem = new LogItem().addAttributes(
      this.getLogFormatter().format(
        merge({
          logLevel,
          timestamp: new Date(),
          message: (typeof input === 'string') ? input : input.message
        },
        this.getPowertoolAttributes())
      )
    ).addAttributes(this.getCustomAttributes());

    if (typeof input !== 'string') {
      logItem.addAttributes(input);
    }
    
    extraInput.forEach((item: Error | LogAttributes) => {
      const attributes = (item instanceof Error) ? {
        error: {
          name: item.name,
          message: item.message,
          stack: item.stack,
        }
      } : item;
      logItem.addAttributes(attributes);
    });
    
    return logItem;
  }

  private getCustomAttributes(): LogAttributes {
    return this.customAttributes || {};
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
    if (this.powertoolAttributes?.logLevel) {
      this.setLogLevel();
    }

    return <LogLevel> this.logLevel;
  }

  private getPowertoolAttributes(): PowertoolAttributes {
    return this.powertoolAttributes || {};
  }

  private getSampleRateValue(): number {
    if (!this.powertoolAttributes?.sampleRateValue) {
      this.setSampleRateValue();
    }

    return <number> this.powertoolAttributes?.sampleRateValue;
  }

  private isContextEnabled(): boolean {
    return this.getCustomConfigService()?.getIsContextEnabled() === true || this.getEnvVarsService().getIsContextEnabled() === true;
  }

  private printLog(logLevel: LogLevel, log: LogAttributes): void {
    Object.keys(log).forEach(key => (log[key] === undefined || log[key] === '' || log[key] === null) && delete log[key]);

    console.log(log);
  }

  private setCustomAttributes(attributes?: LogAttributes): void {
    this.customAttributes = attributes;
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

  private setOptions(options: LoggerOptions = {}): Logger {
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
    this.setPowertoolAttributes(serviceName, environment);
    this.setCustomAttributes(customAttributes);

    return this;
  }

  private setPowertoolAttributes(serviceName?: string, environment?: Environment, customAttributes: LogAttributes = {}): void {

    if (this.isContextEnabled()) {
      this.addToPowertoolAttributes( {
        lambdaContext: {
          coldStart: Logger.isColdStart(),
          memoryLimitInMB: this.getEnvVarsService().getFunctionMemory(),
          name: this.getEnvVarsService().getFunctionName(),
          version:this.getEnvVarsService().getFunctionVersion(),
        }
      });
    }

    this.addToPowertoolAttributes({
      awsRegion: this.getEnvVarsService().getAwsRegion(),
      environment: environment || this.getCustomConfigService()?.getCurrentEnvironment() || this.getEnvVarsService().getCurrentEnvironment(),
      sampleRateValue: this.getSampleRateValue(),
      serviceName: serviceName || this.getCustomConfigService()?.getServiceName() || this.getEnvVarsService().getServiceName(),
      xRayTraceId: this.getEnvVarsService().getXrayTraceId(),
    }, customAttributes );
  }

  private setSampleRateValue(sampleRateValue?: number): void {
    this.powertoolAttributes.sampleRateValue = sampleRateValue || this.getCustomConfigService()?.getSampleRateValue()
      || this.getEnvVarsService().getSampleRateValue();
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