import { LogFormatter } from '../../src/formatter';
import { LogAttributes, UnformattedAttributes } from '../../types';

type MyCompanyLog = LogAttributes;

class CustomLogFormatter extends LogFormatter {

  public format(attributes: UnformattedAttributes): MyCompanyLog {
    return {
      message: attributes.message,
      service: attributes.serviceName,
      environment: attributes.environment,
      awsRegion: attributes.awsRegion,
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
      logLevel: attributes.logLevel,
      timestamp: this.formatTimestamp(attributes.timestamp),
      logger: {
        level: attributes.logLevel,
        sampleRateValue: attributes.sampleRateValue,
      },
    };
  }

}

export {
  CustomLogFormatter
};