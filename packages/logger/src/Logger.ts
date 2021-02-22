import { CustomAttributes, LogLevel, PowertoolLog } from '../types/Log';
import { LoggerInterface } from '.';

class Logger implements LoggerInterface {

  public debug(message: string, attributes?: CustomAttributes): void {
    console.log(this.getLogData(message, 'DEBUG', attributes));
  }

  public info(message: string, attributes?: CustomAttributes): void {
    console.log(this.getLogData(message, 'INFO', attributes));
  }

  public warn(message: string, attributes?: CustomAttributes): void {
    console.log(this.getLogData(message, 'WARN', attributes));
  }

  public error(message: string, attributes?: CustomAttributes): void {
    console.log(this.getLogData(message, 'ERROR', attributes));
  }

  private getLogData(message: string, logLevel: LogLevel, attributes?: CustomAttributes): PowertoolLog {
    const defaultLogAttributes = {
      timestamp: '2020-05-24 18:17:33,774',
      level: logLevel,
      location: 'foo',
      service: 'bar',
      sampling_rate: 1,
      xray_trace_id: '1234'
    };

    return { ...defaultLogAttributes, ...attributes, message };
  }

}

export {
  Logger
};