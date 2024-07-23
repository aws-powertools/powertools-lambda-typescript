import { invokeFunction } from '@aws-lambda-powertools/testing-utils';
import {
  BatchGetTracesCommand,
  GetTraceSummariesCommand,
  XRayClient,
} from '@aws-sdk/client-xray';
import promiseRetry from 'promise-retry';
import { FunctionSegmentNotDefinedError } from './FunctionSegmentNotDefinedError.js';

interface ParsedDocument {
  name: string;
  id: string;
  start_time: number;
  end_time?: number;
  // This flag may be set if the segment hasn't been fully processed
  // The trace may have already appeared in the `getTraceSummaries` response
  // but a segment may still be in_progress
  in_progress?: boolean;
  aws?: {
    request_id: string;
  };
  http?: {
    response: {
      status: number;
    };
  };
  origin?: string;
  resource_arn?: string;
  trace_id?: string;
  subsegments?: ParsedDocument[];
  annotations?: {
    [key: string]: string | boolean | number;
  };
  metadata?: {
    [key: string]: {
      [key: string]: unknown;
    };
  };
  fault?: boolean;
  cause?: {
    working_directory: string;
    exceptions: {
      message: string;
      type: string;
      remote: boolean;
      stack: {
        path: string;
        line: number;
        label: string;
      }[];
    }[];
  };
  exception: {
    message: string;
  };
  error?: boolean;
}

interface ParsedSegment {
  Document: ParsedDocument;
  Id: string;
}

interface ParsedTrace {
  Duration: number;
  Id: string;
  LimitExceeded: boolean;
  Segments: ParsedSegment[];
}

interface AssertAnnotationParams {
  annotations: ParsedDocument['annotations'];
  isColdStart: boolean;
  expectedServiceName: string;
  expectedCustomAnnotationKey: string;
  expectedCustomAnnotationValue: string | number | boolean;
}

type GetTracesOptions = {
  startTime: Date;
  resourceName: string;
  expectedTracesCount: number;
  expectedSegmentsCount: number;
};

const retryOptions = {
  retries: 20,
  minTimeout: 5_000,
  maxTimeout: 10_000,
  factor: 1.25,
};
const xrayClient = new XRayClient({});

const getTraces = async ({
  startTime,
  resourceName,
  expectedTracesCount,
  expectedSegmentsCount,
}: GetTracesOptions): Promise<ParsedTrace[]> => {
  const endTime = new Date();
  console.log(
    `Manual query: aws xray get-trace-summaries --start-time ${Math.floor(
      startTime.getTime() / 1000
    )} --end-time ${Math.floor(
      endTime.getTime() / 1000
    )} --filter-expression 'resource.arn ENDSWITH ":function:${resourceName}"'`
  );

  return promiseRetry(async (retry: (err?: Error) => never, _: number) => {
    const traces = await xrayClient.send(
      new GetTraceSummariesCommand({
        StartTime: startTime,
        EndTime: endTime,
        FilterExpression: `resource.arn ENDSWITH ":function:${resourceName}"`,
      })
    );

    if (traces.TraceSummaries?.length !== expectedTracesCount) {
      retry(
        new Error(
          `Expected ${expectedTracesCount} traces, got ${traces.TraceSummaries?.length} for ${resourceName}`
        )
      );
    }

    const traceIds = traces.TraceSummaries?.map(
      (traceSummary) => traceSummary.Id
    );
    if (!traceIds.every((traceId) => traceId !== undefined)) {
      retry(
        new Error(
          `Expected all trace summaries to have an ID, got ${traceIds} for ${resourceName}`
        )
      );
    }

    const traceDetails = await xrayClient.send(
      new BatchGetTracesCommand({
        TraceIds: traceIds as string[],
      })
    );

    if (traceDetails.Traces?.length !== expectedTracesCount) {
      retry(
        new Error(
          `Expected ${expectedTracesCount} trace summaries, got ${traceDetails.Traces?.length} for ${resourceName}`
        )
      );
    }

    const sortedTraces = traceDetails.Traces?.map(
      (trace): ParsedTrace => ({
        Duration: trace?.Duration as number,
        Id: trace?.Id as string,
        LimitExceeded: trace?.LimitExceeded as boolean,
        Segments: trace.Segments?.map((segment) => ({
          Document: JSON.parse(segment?.Document as string) as ParsedDocument,
          Id: segment.Id as string,
        })).sort(
          (a, b) => a.Document.start_time - b.Document.start_time
        ) as ParsedSegment[],
      })
    ).sort(
      (a, b) =>
        a.Segments[0].Document.start_time - b.Segments[0].Document.start_time
    );

    // Verify that all trace has fully loaded invocation subsegments.
    // The subsegments may be not available yet or still in progress.
    for (const trace of sortedTraces) {
      let retryFlag = false;

      let invocationSubsegment: ParsedDocument;
      try {
        invocationSubsegment = getInvocationSubsegment(trace);
      } catch (error) {
        if (error instanceof FunctionSegmentNotDefinedError) {
          retry(
            new Error(
              'There is no Function subsegment (AWS::Lambda::Function) yet. Retry.'
            )
          );
        } else {
          throw error;
        }
      }

      retryFlag = retryFlag || !!invocationSubsegment.in_progress;
      if (retryFlag) {
        retry(
          new Error(
            `There is at least an invocation subsegment that hasn't been fully processed yet. The "in_progress" flag is still "true" in the document.`
          )
        );
      }
    }

    if (sortedTraces === undefined) {
      throw new Error(`Traces are undefined for ${resourceName}`);
    }

    if (sortedTraces.length !== expectedTracesCount) {
      throw new Error(
        `Expected ${expectedTracesCount} sorted traces, but got ${sortedTraces.length} for ${resourceName}`
      );
    }

    for (const trace of sortedTraces) {
      if (trace.Segments?.length !== expectedSegmentsCount) {
        retry(
          new Error(
            `Expected ${expectedSegmentsCount} segments, got ${trace.Segments?.length} for trace id ${trace.Id}`
          )
        );
      }
    }

    return sortedTraces;
  }, retryOptions);
};

const getFunctionSegment = (trace: ParsedTrace): ParsedSegment => {
  const functionSegment = trace.Segments.find(
    (segment) => segment.Document.origin === 'AWS::Lambda::Function'
  );

  if (functionSegment === undefined) {
    throw new FunctionSegmentNotDefinedError(
      'Function segment is undefined. This can be either due to eventual consistency or a bug in Tracer'
    );
  }

  return functionSegment;
};

const getFirstSubsegment = (segment: ParsedDocument): ParsedDocument => {
  const subsegments = segment.subsegments;
  if (!subsegments || subsegments.length === 0) {
    throw new Error('segment should have subsegments');
  }

  return subsegments[0];
};

const getInvocationSubsegment = (trace: ParsedTrace): ParsedDocument => {
  const functionSegment = getFunctionSegment(trace);
  const invocationSubsegment = functionSegment.Document?.subsegments?.find(
    (subsegment) => subsegment.name === 'Invocation'
  );

  if (invocationSubsegment === undefined) {
    throw new Error('Invocation subsegment is undefined');
  }

  return invocationSubsegment;
};

const splitSegmentsByName = (
  subsegments: ParsedDocument[],
  expectedNames: string[]
): Map<string, ParsedDocument[]> => {
  const splitSegments: Map<string, ParsedDocument[]> = new Map(
    [...expectedNames, 'other'].map((name) => [name, []])
  );
  for (const subsegment of subsegments) {
    const name =
      expectedNames.indexOf(subsegment.name) !== -1 ? subsegment.name : 'other';
    const newSegments = splitSegments.get(name) as ParsedDocument[];
    newSegments.push(subsegment);
    splitSegments.set(name, newSegments);
  }

  return splitSegments;
};

/**
 * Invoke function sequentially 3 times with different parameters
 *
 * invocation: is just a tracking number (it has to start from 1)
 * sdkV2: define if we will use `captureAWSClient()` or `captureAWS()` for SDK V2
 * throw: forces the Lambda to throw an error
 *
 * @param functionName
 */
const invokeAllTestCases = async (
  functionName: string,
  times: number
): Promise<void> => {
  await invokeFunction({
    functionName,
    times,
    invocationMode: 'SEQUENTIAL',
    payload: [
      {
        invocation: 1,
        throw: false,
      },
      {
        invocation: 2,
        throw: false,
      },
      {
        invocation: 3,
        throw: true, // only last invocation should throw
      },
    ],
  });
};

export {
  getTraces,
  getFunctionSegment,
  getFirstSubsegment,
  getInvocationSubsegment,
  splitSegmentsByName,
  invokeAllTestCases,
  type ParsedDocument,
  type ParsedSegment,
  type ParsedTrace,
  type AssertAnnotationParams,
};
