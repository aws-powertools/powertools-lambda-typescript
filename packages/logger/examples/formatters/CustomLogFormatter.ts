/* eslint-disable sort-keys */
import { Context } from 'aws-lambda';
import { LogFormatter } from '../../src/formatter';
import { ExtraAttributes, LogAttributes, LoggerAttributes } from '../../types';

class CustomLogFormatter extends LogFormatter {

  public formatContext(context: Context, isColdStart: boolean): LogAttributes {
    return {
      lambdaFunction: {
        name: context.functionName,
        arn: context.invokedFunctionArn,
        memoryLimitInMB: Number(context.memoryLimitInMB),
        version: context.functionVersion,
        coldStart: isColdStart,
      },
      correlationIds: {
        awsRequestId: context.awsRequestId,
      },
    };
  }

  public formatDefault(baseAttributes: LoggerAttributes): LogAttributes {
    return {
      service: baseAttributes.serviceName,
      env: baseAttributes.env,
      awsRegion: baseAttributes.awsRegion,
      logger: {
        level: baseAttributes.logLevel,
        sampleRateValue: baseAttributes.sampleRateValue,
      },
      correlationIds: {
        xRayTraceId: baseAttributes.xRayTraceId
      }
    };
  }

  public formatExtraAttributes(attributes: ExtraAttributes): LogAttributes {
    return {
      message: attributes.message,
      timestamp: this.formatTimestamp(attributes.timestamp),
      logLevel: attributes.logLevel
    };
  }

}

export {
  CustomLogFormatter
};