import {
  BatchGetTracesCommand,
  GetTraceSummariesCommand,
  type Trace,
  XRayClient,
} from '@aws-sdk/client-xray';
import promiseRetry from 'promise-retry';
import type {
  EnrichedXRayTraceDocumentParsed,
  GetXRayTraceDetailsOptions,
  GetXRayTraceIdsOptions,
  XRaySegmentParsed,
  XRayTraceDocumentParsed,
  XRayTraceParsed,
} from './types.js';

const retryOptions = {
  retries: 20,
  minTimeout: 5_000,
  maxTimeout: 10_000,
  factor: 1.25,
};
const xrayClient = new XRayClient({});

/**
 * Get the trace IDs for a given resource name from the AWS X-Ray API
 *
 * @param options - The options to get trace IDs, including the start time, resource name, and expected traces count
 */
const getTraceIds = async (
  options: GetXRayTraceIdsOptions
): Promise<string[]> => {
  const { startTime, resourceName, expectedTracesCount } = options;
  const endTime = new Date();

  const response = await xrayClient.send(
    new GetTraceSummariesCommand({
      StartTime: startTime,
      EndTime: endTime,
      FilterExpression: `resource.arn ENDSWITH ":function:${resourceName}"`,
    })
  );

  const summaries = response.TraceSummaries;

  if (summaries === undefined || summaries.length !== expectedTracesCount) {
    throw new Error(
      `Expected ${expectedTracesCount} trace summaries, got ${summaries ? summaries.length : 0} for ${resourceName}`
    );
  }

  const ids = [];

  for (const summary of summaries) {
    if (summary.Id === undefined) {
      throw new Error(
        `Expected all trace summaries to have an ID for ${resourceName}`
      );
    }

    ids.push(summary.Id);
  }

  return ids;
};

/**
 * Retriable version of {@link getTraceIds}
 *
 * @param options - The options to get trace IDs, including the start time, resource name, and expected traces count
 */
const retriableGetTraceIds = (options: GetXRayTraceIdsOptions) =>
  promiseRetry(async (retry, attempt) => {
    try {
      return await getTraceIds(options);
    } catch (error) {
      if (attempt === retryOptions.retries) {
        const endTime = new Date();
        console.log(
          `Manual query: aws xray get-trace-summaries --start-time ${Math.floor(
            options.startTime.getTime() / 1000
          )} --end-time ${Math.floor(
            endTime.getTime() / 1000
          )} --filter-expression 'resource.arn ENDSWITH ":function:${options.resourceName}"'`
        );

        throw new Error(
          `Failed to get trace IDs after ${retryOptions.retries} retries`,
          { cause: error }
        );
      }
      retry(error);
    }
  }, retryOptions);

/**
 * Parse and sort the trace segments by start time
 *
 * @param trace - The trace to parse and sort
 * @param expectedSegmentsCount - The expected segments count for the trace
 */
const parseAndSortTrace = (trace: Trace, expectedSegmentsCount: number) => {
  const { Id: id, Segments: segments } = trace;
  if (segments === undefined || segments.length !== expectedSegmentsCount) {
    throw new Error(
      `Expected ${expectedSegmentsCount} segments, got ${segments ? segments.length : 0} for traceId ${trace.Id}`
    );
  }

  const parsedSegments: XRaySegmentParsed[] = [];
  for (const segment of segments) {
    const { Id, Document } = segment;
    if (Document === undefined || Id === undefined) {
      throw new Error(
        `Segment document or id are missing for traceId ${trace.Id}`
      );
    }

    parsedSegments.push({
      Id,
      Document: JSON.parse(Document) as XRayTraceDocumentParsed,
    });
  }

  return {
    Id: id as string,
    Segments: [...parsedSegments].sort(
      (a, b) => a.Document.start_time - b.Document.start_time
    ),
  };
};

/**
 * Get the trace details for a given trace ID from the AWS X-Ray API.
 *
 * When the trace is returned, the segments are parsed, since the document is returned
 * stringified, and then sorted by start time.
 *
 * @param options - The options to get trace details, including the trace IDs and expected segments count
 */
const getTraceDetails = async (
  options: GetXRayTraceDetailsOptions
): Promise<XRayTraceParsed[]> => {
  const { traceIds, expectedSegmentsCount } = options;
  const response = await xrayClient.send(
    new BatchGetTracesCommand({
      TraceIds: traceIds,
    })
  );

  const traces = response.Traces;

  if (traces === undefined || traces.length !== traceIds.length) {
    throw new Error(
      `Expected ${traceIds.length} traces, got ${traces ? traces.length : 0}`
    );
  }

  const parsedAndSortedTraces: XRayTraceParsed[] = [];
  for (const trace of traces) {
    parsedAndSortedTraces.push(parseAndSortTrace(trace, expectedSegmentsCount));
  }

  return parsedAndSortedTraces.sort(
    (a, b) =>
      a.Segments[0].Document.start_time - b.Segments[0].Document.start_time
  );
};

/**
 * Retriable version of {@link getTraceDetails}
 *
 * @param options - The options to get trace details, including the trace IDs and expected segments count
 */
const retriableGetTraceDetails = (options: GetXRayTraceDetailsOptions) =>
  promiseRetry(async (retry, attempt) => {
    try {
      return await getTraceDetails(options);
    } catch (error) {
      if (attempt === retryOptions.retries) {
        console.log(
          `Manual query: aws xray batch-get-traces --trace-ids ${
            options.traceIds
          }`
        );

        throw new Error(
          `Failed to get trace details after ${retryOptions.retries} retries`,
          { cause: error }
        );
      }
      retry(error);
    }
  }, retryOptions);

/**
 * Find the main function segment in the trace identified by the `## index.` suffix
 */
const findPowertoolsFunctionSegment = (
  trace: XRayTraceParsed,
  functionName: string
): XRayTraceDocumentParsed => {
  const functionSegment = trace.Segments.find(
    (segment) => segment.Document.origin === 'AWS::Lambda::Function'
  );

  if (!functionSegment) {
    throw new Error(
      `AWS::Lambda::Function segment not found for ${functionName}`
    );
  }

  const document = functionSegment.Document;

  const maybePowertoolsSubsegment = document.subsegments?.find(
    (subsegment) =>
      subsegment.name.startsWith('## index.') ||
      subsegment.name === 'Invocation'
  );

  if (!maybePowertoolsSubsegment) {
    throw new Error(`Main subsegment not found for ${functionName} segment`);
  }

  if (maybePowertoolsSubsegment.name === 'Invocation') {
    const powertoolsSubsegment = maybePowertoolsSubsegment.subsegments?.find(
      (subsegment) => subsegment.name.startsWith('## index.')
    );

    if (!powertoolsSubsegment) {
      throw new Error(`Main subsegment not found for ${functionName} segment`);
    }

    return powertoolsSubsegment;
  }

  return maybePowertoolsSubsegment;
};

/**
 * Parse the subsegments of a segment by name.
 *
 * The subsegments are split into a map where the key is the name of the subsegment
 * and the value is an array of subsegments with that name.
 *
 * This is useful to more easily assert the presence of specific subsegments in a segment.
 *
 * @param subsegments - The subsegments to parse
 * @param expectedNames - The expected names to map the subsegments with
 */
const parseSubsegmentsByName = (
  subsegments: XRayTraceDocumentParsed[]
): Map<string, XRayTraceDocumentParsed> => {
  const subsegmentMap = new Map<string, XRayTraceDocumentParsed>();

  for (const subsegment of subsegments) {
    subsegmentMap.set(subsegment.name, subsegment);
  }

  return subsegmentMap;
};

/**
 * Get the X-Ray trace data for a given resource name.
 *
 * @param options - The options to get the X-Ray trace data, including the start time, resource name, expected traces count, and expected segments count
 */
const getXRayTraceData = async (
  options: GetXRayTraceIdsOptions & Omit<GetXRayTraceDetailsOptions, 'traceIds'>
) => {
  const {
    startTime,
    resourceName,
    expectedTracesCount,
    expectedSegmentsCount,
  } = options;

  const traceIds = await retriableGetTraceIds({
    startTime,
    resourceName,
    expectedTracesCount,
  });

  if (!traceIds) {
    throw new Error(`No trace IDs found for ${resourceName}`);
  }

  const traces = await retriableGetTraceDetails({
    traceIds,
    expectedSegmentsCount,
  });

  if (!traces) {
    throw new Error(`No traces found for ${resourceName}`);
  }

  return traces;
};

/**
 * Get the X-Ray trace data for a given resource name and parse the main subsegments.
 *
 * @param options - The options to get the X-Ray trace data, including the start time, resource name, expected traces count, and expected segments count
 */
const getTraces = async (
  options: GetXRayTraceIdsOptions & Omit<GetXRayTraceDetailsOptions, 'traceIds'>
): Promise<EnrichedXRayTraceDocumentParsed[]> => {
  const traces = await getXRayTraceData(options);

  const { resourceName } = options;

  const mainSubsegments = [];
  for (const trace of traces) {
    const mainSubsegment = findPowertoolsFunctionSegment(trace, resourceName);
    const enrichedMainSubsegment = {
      ...mainSubsegment,
      subsegments: parseSubsegmentsByName(mainSubsegment.subsegments ?? []),
    };
    mainSubsegments.push(enrichedMainSubsegment);
  }

  return mainSubsegments;
};

export {
  getTraceIds,
  retriableGetTraceIds,
  getTraceDetails,
  retriableGetTraceDetails,
  findPowertoolsFunctionSegment,
  getTraces,
  parseSubsegmentsByName,
};
