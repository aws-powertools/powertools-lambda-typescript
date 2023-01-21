import { LogFormatter } from '@aws-lambda-powertools/logger';
import {
  LogAttributes,
  UnformattedAttributes,
} from '@aws-lambda-powertools/logger/lib/types';

// Replace this line with your own type
type MyCompanyLog = LogAttributes;

class MyCompanyLogFormatter extends LogFormatter {
  public formatAttributes(attributes: UnformattedAttributes): MyCompanyLog {
    return {
      message: attributes.message,
      service: attributes.serviceName,
      environment: attributes.environment,
      awsRegion: attributes.awsRegion,
      correlationIds: {
        awsRequestId: attributes.lambdaContext?.awsRequestId,
        xRayTraceId: attributes.xRayTraceId,
      },
      lambdaFunction: {
        name: attributes.lambdaContext?.functionName,
        arn: attributes.lambdaContext?.invokedFunctionArn,
        memoryLimitInMB: attributes.lambdaContext?.memoryLimitInMB,
        version: attributes.lambdaContext?.functionVersion,
        coldStart: attributes.lambdaContext?.coldStart,
      },
      logLevel: attributes.logLevel,
      timestamp: this.formatTimestamp(attributes.timestamp), // You can extend this function
      logger: {
        sampleRateValue: attributes.sampleRateValue,
      },
    };
  }
}

export { MyCompanyLogFormatter };
