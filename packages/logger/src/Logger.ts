import { Context } from 'aws-lambda';
import { LoggerInterface } from '.';
import { LogItem } from './log';

import { cloneDeep, merge } from 'lodash/fp';
import { ConfigServiceInterface, EnvironmentVariablesService } from './config';
import { LogFormatterInterface, PowertoolLogFormatter } from './formatter';
import {
  PowertoolLogAttributes,
  LogAttributes,
  LoggerOptions,
  LogLevel,
  LogLevelThresholds,
  LambdaFunctionContext,
  LoggerInput,
  LoggerExtraInput,
  HandlerMethodDecorator
} from '../types';

class Logger implements LoggerInterface {

  private customAttributes: LogAttributes;

  private customConfigService?: ConfigServiceInterface;

  private static readonly defaultIsContextEnabled: boolean = false;

  private static readonly defaultLogLevelThreshold: LogLevel = 'INFO';

  private readonly envVarsService: EnvironmentVariablesService;

  private static isColdStart: boolean = true;

  private isContextEnabled: boolean;

  private logFormatter: LogFormatterInterface;

  private logLevelThreshold: LogLevel;

  private readonly logLevelThresholds: LogLevelThresholds = {
    'DEBUG' : 8,
    'INFO': 12,
    'WARN': 16,
    'ERROR': 20
  };

  private powertoolLogAttributes: PowertoolLogAttributes = <PowertoolLogAttributes>{};

  private sampleRateValue?: number;

  public constructor(options: LoggerOptions = {}) {
    const {
      logLevel,
      serviceName,
      sampleRateValue,
      logFormatter,
      customConfigService,
      customAttributes,
      environment,
      isContextEnabled
    } = options;

    this.customAttributes = this.pickValueWithDefault<LogAttributes>({}, customAttributes);
    this.customConfigService = customConfigService;
    this.envVarsService = new EnvironmentVariablesService();
    this.isContextEnabled = this.pickValueWithDefault<boolean>(
      Logger.defaultIsContextEnabled,
      isContextEnabled,
      this.getCustomConfigService()?.getIsContextEnabled(),
      this.getEnvVarsService().getIsContextEnabled()
    );
    this.logFormatter = this.pickValueWithDefault<LogFormatterInterface>(new PowertoolLogFormatter(),logFormatter);
    this.logLevelThreshold = this.pickValueWithDefault<LogLevel>(
      Logger.defaultLogLevelThreshold,logLevel,
      this.getCustomConfigService()?.getLogLevel(),
      this.getEnvVarsService().getLogLevel()
    );
    this.sampleRateValue = this.pickValue<number>(
      sampleRateValue,
      this.getCustomConfigService()?.getSampleRateValue(),
      this.getEnvVarsService()?.getSampleRateValue()
    );
    this.populatePowertoolLogAttributes(serviceName, environment);
  }

  public addContext(context: Context): void {
    if (!this.getIsContextEnabled()) {
      return;
    }

    const lambdaContext: Partial<LambdaFunctionContext> = {
      arn: context.invokedFunctionArn,
      awsRequestId: context.awsRequestId,
      memoryLimitInMB: Number(context.memoryLimitInMB),
      name: context.functionName,
      version: context.functionVersion,
    };

    this.addToPowertoolLogAttributes({
      lambdaContext
    });

  }

  public createChild(options: LoggerOptions = {}): Logger {
    return cloneDeep(this).applyOptions(options);
  }

  public debug(input: LoggerInput, ...extraInput: LoggerExtraInput): void {
    this.processLogInputData('DEBUG', input, extraInput);
  }

  public error(input: LoggerInput, ...extraInput: LoggerExtraInput): void {
    this.processLogInputData('ERROR', input, extraInput);
  }

  public static getIsColdStart(): boolean {
    if (Logger.isColdStart === true) {
      Logger.isColdStart = false;

      return true;
    }

    return false;
  }

  public info(input: LoggerInput, ...extraInput: LoggerExtraInput): void {
    this.processLogInputData('INFO', input, extraInput);
  }

  public injectLambdaContext(enableContext: boolean = true): HandlerMethodDecorator {
    return (target, propertyKey, descriptor ) => {
      const originalMethod = descriptor.value;

      descriptor.value = (event, context, callback) => {
        this.setIsContextEnabled(enableContext);
        this.addContext(context);
        const result = originalMethod?.apply(this, [ event, context, callback ]);

        return result;
      };
    };
  }

  public warn(input: LoggerInput, ...extraInput: LoggerExtraInput): void {
    this.processLogInputData('WARN', input, extraInput);
  }

  private addToPowertoolLogAttributes(...attributesArray: Array<Partial<PowertoolLogAttributes>>): void {
    attributesArray.forEach((attributes: Partial<PowertoolLogAttributes>) => {
      this.powertoolLogAttributes = merge(this.getPowertoolLogAttributes(), attributes);
    });
  }

  private applyOptions(options: LoggerOptions): Logger {
    const {
      logLevel,
      serviceName,
      sampleRateValue,
      logFormatter,
      customConfigService,
      customAttributes,
      environment,
      isContextEnabled
    } = options;

    if (customAttributes) {
      this.setCustomAttributes(customAttributes);
    }
    if (customConfigService) {
      this.setCustomConfigService(customConfigService);
    }
    if (isContextEnabled){
      this.setIsContextEnabled(isContextEnabled);
    }
    if (logFormatter) {
      this.setLogFormatter(logFormatter);
    }
    if (logLevel) {
      this.setLogLevelThreshold(logLevel);
    }
    if (sampleRateValue) {
      this.setSampleRateValue(sampleRateValue);
    }
    if (serviceName || environment || isContextEnabled || customConfigService || logFormatter) {
      this.populatePowertoolLogAttributes(serviceName, environment);
    }

    return this;
  }

  private createLogItem(logLevel: LogLevel, input: LoggerInput, extraInput: LoggerExtraInput): LogItem {

    const logItem = new LogItem().addAttributes(
      this.getLogFormatter().format(
        merge({
          logLevel,
          timestamp: new Date(),
          message: (typeof input === 'string') ? input : input.message
        },
        this.getPowertoolLogAttributes())
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
    return this.customAttributes;
  }

  private getCustomConfigService(): ConfigServiceInterface | undefined {
    return this.customConfigService;
  }

  private getEnvVarsService(): EnvironmentVariablesService {
    return this.envVarsService;
  }

  private getIsContextEnabled(): boolean {
    return this.isContextEnabled;
  }

  private getLogFormatter(): LogFormatterInterface {
    return this.logFormatter;
  }

  private getLogLevelThreshold(): LogLevel {
    return this.logLevelThreshold;
  }

  private getPowertoolLogAttributes(): PowertoolLogAttributes {
    return this.powertoolLogAttributes;
  }

  private getSampleRateValue(): number | undefined {
    return this.sampleRateValue;
  }

  private pickValue<ValueType>(...values: Array<ValueType | undefined>): ValueType | undefined {
    for (const entry of values) {
      if (entry) {
        return entry;
      }
    }

    return undefined;
  }

  private pickValueWithDefault<ValueType>(defaultValue: ValueType, ...values: Array<ValueType | undefined>): ValueType {
    return this.pickValue(...values) || defaultValue;
  }

  private populatePowertoolLogAttributes(serviceName?: string, environment?: string): void {

    this.addToPowertoolLogAttributes({
      awsRegion: this.getEnvVarsService().getAwsRegion(),
      environment: this.pickValue<string>(environment, this.getCustomConfigService()?.getCurrentEnvironment(), this.getEnvVarsService().getCurrentEnvironment()),
      sampleRateValue: this.getSampleRateValue(),
      serviceName: this.pickValue<string>(serviceName,this.getCustomConfigService()?.getServiceName(), this.getEnvVarsService().getServiceName()),
      xRayTraceId: this.getEnvVarsService().getXrayTraceId(),
    });

    if (this.getIsContextEnabled()) {
      this.addToPowertoolLogAttributes({
        lambdaContext: {
          coldStart: Logger.getIsColdStart(),
          memoryLimitInMB: this.getEnvVarsService().getFunctionMemory(),
          name: this.getEnvVarsService().getFunctionName(),
          version: this.getEnvVarsService().getFunctionVersion(),
        }
      });
    }
  }

  private printLog(log: LogAttributes): void {
    // TODO: revisit this
    Object.keys(log).forEach(key => (log[key] === undefined || log[key] === '' || log[key] === null) && delete log[key]);

    console.log(log);
  }

  private processLogInputData(logLevel: LogLevel, input: LoggerInput, extraInput: LoggerExtraInput): void {
    if (!this.shouldPrint(logLevel)) {
      return;
    }
    this.printLog(this.createLogItem(logLevel, input, extraInput).getAttributes());
  }

  private setCustomAttributes(attributes: LogAttributes): void {
    this.customAttributes = attributes;
  }

  private setCustomConfigService(customConfigService?: ConfigServiceInterface): void {
    this.customConfigService = customConfigService;
  }

  private setIsContextEnabled(value: boolean = true): void {
    this.isContextEnabled = value;
  }

  private setLogFormatter(value: LogFormatterInterface): void {
    this.logFormatter = value;
  }

  private setLogLevelThreshold(value: LogLevel): void {
    this.logLevelThreshold = value;
  }

  private setSampleRateValue(value?: number): void {
    this.sampleRateValue = value;
  }

  private shouldPrint(logLevel: LogLevel): boolean {
    if (this.logLevelThresholds[logLevel] >= this.logLevelThresholds[this.getLogLevelThreshold()]) {
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