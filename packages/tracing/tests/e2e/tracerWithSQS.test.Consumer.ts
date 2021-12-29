import { Tracer } from '../../src';
import { Context, SQSRecord } from 'aws-lambda';
import * as AWSOrig from 'aws-sdk';
import { Segment, Subsegment } from 'aws-xray-sdk-core';

const serviceName = process.env.EXPECTED_SERVICE_NAME ?? 'MyFunctionWithStandardHandler';

const tracer = new Tracer({ serviceName: serviceName });
const AWS = tracer.captureAWS(AWSOrig);
const stsv2 = new AWS.STS();

const sleep = async (milliseconds: number): Promise<unknown> => new Promise((resolve) => setTimeout(resolve, milliseconds));

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const handler = async (event: { Records: SQSRecord[] }, context: Context) => {
  const handlerExecStartTime = new Date().getTime() / 1000;

  // Simulate other records processing
  await sleep(1000);

  const toCloseSegments: (Segment | Subsegment) [] = [];

  for (const recordIndex in event.Records) {
    // Extract X-Ray data from message
    const record = event.Records[recordIndex];
    console.log(`Env ${JSON.stringify(process.env)}`);
    console.log(`Context ${JSON.stringify(context)}`);
    console.log(`Processing record ${JSON.stringify(record)}`);

    // Re build lambda segments for this record
    const { lambdaSegment, lambdaFunctionSegment, invocationSubsegment } = tracer.continueSQSRecordTrace(
      record,
      context,
      handlerExecStartTime
    );
    toCloseSegments.push(lambdaSegment, lambdaFunctionSegment, invocationSubsegment);

    const messageProcessingSegment = tracer.getSegment(); // This is the message processing segment (the one that is created by continueSQSRecordTrace)
    console.log(`messageProcessingSegment: ${JSON.stringify(messageProcessingSegment)}`);
    // Simulate other records processing
    await sleep(2000);
    // Create subsegment for the function
    tracer.annotateColdStart();
    tracer.addServiceNameAnnotation();
    messageProcessingSegment.addAnnotation('message_id', record.messageId);

    await stsv2.getCallerIdentity().promise();

    let res;
    try {
      res = { foo: 'bar' };
      // Add the response as metadata
      tracer.addResponseAsMetadata(res, context.functionName);
    } catch (err) {
      // Add the error as metadata
      tracer.addErrorAsMetadata(err as Error);
    }
    messageProcessingSegment.close();
  }

  toCloseSegments.forEach((segment) => segment.close());
};
