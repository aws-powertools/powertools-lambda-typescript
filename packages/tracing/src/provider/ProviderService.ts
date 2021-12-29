import { ContextMissingStrategy } from 'aws-xray-sdk-core/dist/lib/context_utils';
import { processTraceData } from 'aws-xray-sdk-core/dist/lib/utils';
import { Namespace } from 'cls-hooked';
import { ProviderServiceInterface } from '.';
import { captureAWS, captureAWSClient, captureAWSv3Client, captureAsyncFunc, captureFunc, getNamespace, getSegment, setSegment, Segment, Subsegment, setContextMissingStrategy, setDaemonAddress, setLogger, Logger } from 'aws-xray-sdk-core';
import { Context, SQSRecord } from 'aws-lambda';

class ProviderService implements ProviderServiceInterface {
  
  public captureAWS<T>(awssdk: T): T {
    return captureAWS(awssdk);
  }

  public captureAWSClient<T>(service: T): T {
    return captureAWSClient(service);
  }

  public captureAWSv3Client<T>(service: T): T {
    // Type must be aliased as any because of this https://github.com/aws/aws-xray-sdk-node/issues/439#issuecomment-859715660
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return captureAWSv3Client(service as any);
  }

  public captureAsyncFunc(name: string, fcn: (subsegment?: Subsegment) => unknown, _parent?: Segment | Subsegment): unknown {
    return captureAsyncFunc(name, fcn);
  }
  
  public captureFunc(name: string, fcn: (subsegment?: Subsegment) => unknown, _parent?: Segment | Subsegment): unknown {
    return captureFunc(name, fcn);
  }

  public continueSQSRecordTrace(record: SQSRecord, context: Context, handlerExecStartTime?: number): {lambdaSegment: Segment; lambdaFunctionSegment: Segment; invocationSubsegment: Subsegment} {
    if (! record.attributes.AWSTraceHeader) {
      throw new Error(`No trace header found in record ${record.messageId}. can't follow trace ... skipping`);
    }

    const traceHeaderStr = record.attributes.AWSTraceHeader;
    const traceData = processTraceData(traceHeaderStr);

    const functionName = process.env.AWS_LAMBDA_FUNCTION_NAME;
    const lambdaSegment = new Segment(functionName!, traceData.root, traceData.parent);
    lambdaSegment.origin = 'AWS::Lambda';
    lambdaSegment.start_time = parseInt(record.attributes.ApproximateFirstReceiveTimestamp) / 1000;
    lambdaSegment.addPluginData({
      request_id: context.awsRequestId,
    });

    const lambdaFunctionSegment = new Segment(functionName!, lambdaSegment.trace_id, lambdaSegment.id);
    lambdaFunctionSegment.origin = 'AWS::Lambda::Function';
    lambdaFunctionSegment.start_time = parseInt(record.attributes.ApproximateFirstReceiveTimestamp) / 1000;
    lambdaFunctionSegment.addPluginData({
      function_arn: context.invokedFunctionArn,
      resource_names: ['Consumer']
    });

    const invocationSubsegment = lambdaFunctionSegment.addNewSubsegment('Invocation');
    invocationSubsegment.start_time = handlerExecStartTime ? handlerExecStartTime : lambdaFunctionSegment.start_time;
    const previousProcessingSegment = invocationSubsegment.addNewSubsegment(`## previous processing`);
    previousProcessingSegment.start_time = invocationSubsegment.start_time;
    previousProcessingSegment.close();
    const messageProcessingSegment = invocationSubsegment.addNewSubsegment(`## processing - ${record.messageId}`);

    this.setSegment(messageProcessingSegment);
    
    return {
      invocationSubsegment,
      lambdaSegment,
      lambdaFunctionSegment,
    };
  }

  public getNamespace(): Namespace {
    return getNamespace();
  }

  public getSegment(): Segment | Subsegment | undefined {
    return getSegment();
  }

  public setContextMissingStrategy(strategy: unknown): void {
    setContextMissingStrategy(strategy as ContextMissingStrategy);
  }

  public setDaemonAddress(address: string): void {
    setDaemonAddress(address);
  }

  public setLogger(logObj: unknown): void {
    setLogger(logObj as Logger);
  }
  
  public setSegment(segment: Segment | Subsegment): void {
    setSegment(segment);
  }

}

export {
  ProviderService
};