/* eslint-disable sort-keys */
import { LogFormatter } from '../../src/formatter';
import { LogAttributes, UnformattedAttributes } from '../../types';

type MyCompanyLog = LogAttributes;

class CustomLogFormatter extends LogFormatter {

  public format(attributes: UnformattedAttributes): MyCompanyLog {
    return {
      message: attributes.message,
      timestamp: this.formatTimestamp(attributes.timestamp),
      logLevel: attributes.logLevel,
      service: attributes.serviceName,
      env: attributes.environment,
      awsRegion: attributes.awsRegion,
      logger: {
        level: attributes.logLevel,
        sampleRateValue: attributes.sampleRateValue,
      },
      correlationIds: {
        awsRequestId: attributes.awsRequestId,
        xRayTraceId: attributes.xRayTraceId
      },
      lambdaFunction: {
        name: attributes.functionName,
        arn: attributes.invokedFunctionArn,
        memoryLimitInMB: Number(attributes.memoryLimitInMB),
        version: attributes.functionVersion,
        coldStart: attributes.coldStart,
      },
    };
  }

}

export {
  CustomLogFormatter
};