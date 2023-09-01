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

export { ParsedDocument, ParsedSegment, ParsedTrace, AssertAnnotationParams };
