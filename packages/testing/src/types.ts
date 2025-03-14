import type { App, Stack } from 'aws-cdk-lib';
import type { AttributeType, TableProps } from 'aws-cdk-lib/aws-dynamodb';
import type { NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import type { LogLevel } from './constants.js';

interface ExtraTestProps {
  /**
   * The suffix to be added to the resource name.
   *
   * For example, if the resource name is `fn-12345` and the suffix is `BasicFeatures`,
   * the output will be `fn-12345-BasicFeatures`.
   *
   * Note that the maximum length of the name is 64 characters, so the suffix might be truncated.
   */
  nameSuffix: string;
  /**
   * The output format of the bundled code.
   *
   * @default 'CJS'
   */
  outputFormat?: 'CJS' | 'ESM';
  /**
   * Whether to create an alias for the function.
   *
   * @default false
   */
  createAlias?: boolean;
}

type TestDynamodbTableProps = Omit<
  TableProps,
  'removalPolicy' | 'tableName' | 'billingMode' | 'partitionKey'
> & {
  partitionKey?: {
    name: string;
    type: AttributeType;
  };
};

type TestNodejsFunctionProps = Omit<
  NodejsFunctionProps,
  'logRetention' | 'runtime' | 'functionName' | 'bundling'
> & {
  bundling?: Omit<
    NodejsFunctionProps['bundling'],
    'minify' | 'mainFields' | 'sourceMap' | 'format' | 'banner'
  >;
};

type InvokeTestFunctionOptions = {
  functionName: string;
  times?: number;
  invocationMode?: 'PARALLEL' | 'SEQUENTIAL';
  payload?: Record<string, unknown> | Array<Record<string, unknown>>;
};

type ErrorField = {
  name: string;
  message: string;
  stack: string;
};

type FunctionLog = {
  level: keyof typeof LogLevel;
  error: ErrorField;
} & { [key: string]: unknown };

type StackNameProps = {
  /**
   * Prefix for the stack name.
   */
  stackNamePrefix: string;
  /**
   * Name of the test.
   */
  testName: string;
};

interface TestStackProps {
  /**
   * Name of the test stack.
   */
  stackNameProps: StackNameProps;
  /**
   * Reference to the AWS CDK App object.
   * @default new App()
   */
  app?: App;
  /**
   * Reference to the AWS CDK Stack object.
   * @default new Stack(this.app, stackName)
   */
  stack?: Stack;
}

// #region X-Ray Trace Utils

type GetXRayTraceIdsOptions = {
  startTime: Date;
  resourceName: string;
  expectedTracesCount: number;
};

type XRayTraceDocumentParsed = {
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
    request: {
      url: string;
      method: string;
    };
    response?: {
      status: number;
      content_length?: number;
    };
  };
  origin?: string;
  resource_arn?: string;
  trace_id?: string;
  subsegments?: XRayTraceDocumentParsed[];
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
  namespace?: string;
};

type XRaySegmentParsed = {
  Id: string;
  Document: XRayTraceDocumentParsed;
};

type XRayTraceParsed = {
  Id: string;
  Segments: XRaySegmentParsed[];
};

type GetXRayTraceDetailsOptions = {
  /**
   * The trace IDs to get details for
   */
  traceIds: string[];
  /**
   * The expected number of segments in each trace
   */
  expectedSegmentsCount: number;
  /**
   * The name of the function that the trace is expected to be associated with
   */
  functionName: string;
};

/**
 * Enriched X-Ray trace document parsed with subsegments as a map
 */
type EnrichedXRayTraceDocumentParsed = Omit<
  XRayTraceDocumentParsed,
  'subsegments'
> & {
  subsegments: Map<string, XRayTraceDocumentParsed>;
};

export type {
  ExtraTestProps,
  TestDynamodbTableProps,
  TestNodejsFunctionProps,
  InvokeTestFunctionOptions,
  ErrorField,
  FunctionLog,
  StackNameProps,
  TestStackProps,
  GetXRayTraceIdsOptions,
  GetXRayTraceDetailsOptions,
  XRayTraceDocumentParsed,
  XRaySegmentParsed,
  XRayTraceParsed,
  EnrichedXRayTraceDocumentParsed,
};
