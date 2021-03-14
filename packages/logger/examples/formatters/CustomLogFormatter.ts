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
        awsRequestId: attributes.lambdaContext?.awsRequestId,
        xRayTraceId: attributes.xRayTraceId
      },
      lambdaFunction: {
        name: attributes.lambdaContext?.name,
        arn: attributes.lambdaContext?.arn,
        memoryLimitInMB: attributes.lambdaContext?.memoryLimitInMB,
        version: attributes.lambdaContext?.version,
        coldStart: attributes.lambdaContext?.coldStart,
      },
      logLevel: attributes.logLevel,
      timestamp: this.formatTimestamp(attributes.timestamp),
      logger: {
        sampleRateValue: attributes.sampleRateValue,
      },
    };
  }

}

export {
  CustomLogFormatter
};