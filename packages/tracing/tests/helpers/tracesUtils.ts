import { XRay } from 'aws-sdk';

interface ParsedDocument {
  name: string
  id: string
  start_time: number
  end_time: number
  aws?: {
    request_id: string
  }
  http?: {
    response: {
      status: number
    }
  }
  origin?: string
  resource_arn?: string
  trace_id?: string
  subsegments?: ParsedDocument[]
  annotations?: {
    [key: string]: string | boolean | number
  }
  metadata?: {
    [key: string]: {
      [key: string]: unknown
    }
  }
  fault?: boolean
  cause?: {
    working_directory: string
    exceptions: {
      message: string
      type: string
      remote: boolean
      stack: {
        path: string
        line: number
        label: string
      }[]
    }[]
  }
  exception: {
    message: string
  }
  error?: boolean
}

interface ParsedSegment {
  Document: ParsedDocument
  Id: string
}

interface ParsedTrace {
  Duration: number
  Id: string
  LimitExceeded: boolean
  Segments: ParsedSegment[]
}

const getTraces = async (xrayClient: XRay, startTime: Date, resourceArn: string, expectedTraces: number): Promise<ParsedTrace[]> => {
  const endTime = new Date();
  console.log(`Manual query: aws xray get-trace-summaries --start-time ${Math.floor(startTime.getTime()/1000)} --end-time ${Math.floor(endTime.getTime()/1000)} --filter-expression 'resource.arn = "${resourceArn}"'`);
  const traces = await xrayClient
    .getTraceSummaries({
      StartTime: startTime,
      EndTime: endTime,
      FilterExpression: `resource.arn = "${resourceArn}"`,
    })
    .promise();

  if (traces.TraceSummaries?.length !== expectedTraces) {
    throw new Error(`Expected ${expectedTraces} traces, got ${traces.TraceSummaries?.length}`);
  }

  const traceDetails = await xrayClient.batchGetTraces({
    TraceIds: traces.TraceSummaries?.map((traceSummary) => traceSummary?.Id) as XRay.TraceIdList,
  }).promise();

  if (traceDetails.Traces?.length !== expectedTraces) {
    throw new Error(`Expected ${expectedTraces} trace summaries, got ${traceDetails.Traces?.length}`);
  }

  const sortedTraces = traceDetails.Traces?.map((trace): ParsedTrace => ({
    Duration: trace?.Duration as number,
    Id: trace?.Id as string,
    LimitExceeded: trace?.LimitExceeded as boolean,
    Segments: trace.Segments?.map((segment) => ({
      Document: JSON.parse(segment?.Document as string) as ParsedDocument,
      Id: segment.Id as string,
    })).sort((a, b) => a.Document.start_time - b.Document.start_time) as ParsedSegment[],
  })).sort((a, b) => a.Segments[0].Document.start_time - b.Segments[0].Document.start_time);

  if (sortedTraces === undefined) {
    throw new Error('Traces are undefined');
  }

  if (sortedTraces.length !== expectedTraces) {
    throw new Error(`Expected ${expectedTraces} sorted traces, but got ${sortedTraces.length}`);
  }

  return sortedTraces;
};

const getFunctionSegment = (trace: ParsedTrace): ParsedSegment => {
  const functionSegment = trace.Segments.find((segment) => segment.Document.origin === 'AWS::Lambda::Function');

  if (functionSegment === undefined) {
    throw new Error('Function segment is undefined');
  }

  return functionSegment;
};

const getInvocationSubsegment = (trace: ParsedTrace): ParsedDocument => {
  const functionSegment = getFunctionSegment(trace);
  const invocationSubsegment = functionSegment.Document?.subsegments
    ?.find((subsegment) => subsegment.name === 'Invocation');

  if (invocationSubsegment === undefined) {
    throw new Error('Invocation subsegment is undefined');
  }

  return invocationSubsegment;
};

export {
  getTraces,
  getFunctionSegment,
  getInvocationSubsegment,
};

export type {
  ParsedDocument,
};