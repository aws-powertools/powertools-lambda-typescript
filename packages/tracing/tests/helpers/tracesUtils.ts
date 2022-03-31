import { XRay } from 'aws-sdk';
import promiseRetry from 'promise-retry';

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

const getTraces = async (xrayClient: XRay, startTime: Date, resourceArn: string, expectedTraces: number, expectedSegments: number): Promise<ParsedTrace[]> => {
  const retryOptions = { retries: 20, minTimeout: 5_000, maxTimeout: 10_000, factor: 1.25 };

  return promiseRetry(async(retry: (err?: Error) => never , _: number) => {

    const endTime = new Date();
    console.log(`Manual query: aws xray get-trace-summaries --start-time ${Math.floor(startTime.getTime() / 1000)} --end-time ${Math.floor(endTime.getTime() / 1000)} --filter-expression 'resource.arn = "${resourceArn}"'`);
    const traces = await xrayClient
      .getTraceSummaries({
        StartTime: startTime,
        EndTime: endTime,
        FilterExpression: `resource.arn = "${resourceArn}"`,
      })
      .promise();

    if (traces.TraceSummaries?.length !== expectedTraces) {
      retry(new Error(`Expected ${expectedTraces} traces, got ${traces.TraceSummaries?.length} for ${resourceArn}`));
    }

    const traceDetails = await xrayClient.batchGetTraces({
      TraceIds: traces.TraceSummaries?.map((traceSummary) => traceSummary?.Id) as XRay.TraceIdList,
    }).promise();

    if (traceDetails.Traces?.length !== expectedTraces) {
      retry(new Error(`Expected ${expectedTraces} trace summaries, got ${traceDetails.Traces?.length} for ${resourceArn}`));
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
      throw new Error(`Traces are undefined for ${resourceArn}`);
    }

    if (sortedTraces.length !== expectedTraces) {
      throw new Error(`Expected ${expectedTraces} sorted traces, but got ${sortedTraces.length} for ${resourceArn}`);
    }

    sortedTraces.forEach((trace) => {
      if (trace.Segments?.length != expectedSegments) {
        retry(new Error(`Expected ${expectedSegments} segments, got ${trace.Segments?.length} for trace id ${trace.Id}`));
      }
    });

    return sortedTraces;
  }, retryOptions);
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

const splitSegmentsByName = (subsegments: ParsedDocument[], expectedNames: string[]): Map<string, ParsedDocument[]> => {
  const splitSegments: Map<string, ParsedDocument[]> = new Map([ ...expectedNames, 'other' ].map(name => [ name, [] ]));
  subsegments.forEach(subsegment => {
    const name = expectedNames.indexOf(subsegment.name) !== -1 ? subsegment.name : 'other';
    const newSegments = splitSegments.get(name) as ParsedDocument[];
    newSegments.push(subsegment);
    splitSegments.set(name, newSegments);
  });
  
  return splitSegments;
};

export {
  getTraces,
  getFunctionSegment,
  getInvocationSubsegment,
  splitSegmentsByName
};

export type {
  ParsedDocument,
};