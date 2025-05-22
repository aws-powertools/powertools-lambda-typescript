import type { MetricResolution, MetricUnit } from '../constants.js';

/**
 * Interface for the configuration service
 */
export interface ConfigServiceInterface {
  /**
   * Get the namespace from the configuration service
   */
  getNamespace(): string | undefined;
  /**
   * Get the service name from the configuration service
   */
  getServiceName(): string | undefined;
}

/**
 * Dimensions are key-value pairs that are used to group metrics
 */
export type Dimensions = Record<string, string>;

/**
 * A dimension set is an array of dimension names
 */
export type DimensionSet = string[];

/**
 * Options for the Metrics constructor
 */
export interface MetricsOptions {
  /**
   * Custom configuration service
   */
  customConfigService?: ConfigServiceInterface;
  /**
   * Default dimensions to be added to all metrics
   */
  defaultDimensions?: Dimensions;
  /**
   * Function name to be used for the cold start metric
   */
  functionName?: string;
  /**
   * Custom logger object used for emitting debug, warning, and error messages
   */
  logger?: GenericLogger;
  /**
   * Namespace for the metrics
   */
  namespace?: string;
  /**
   * Service name for the metrics
   */
  serviceName?: string;
  /**
   * Whether this is a single metric instance
   */
  singleMetric?: boolean;
}

/**
 * Extra options for the logMetrics decorator
 */
export interface ExtraOptions {
  /**
   * Whether to capture a cold start metric
   */
  captureColdStartMetric?: boolean;
  /**
   * Default dimensions to be added to all metrics
   */
  defaultDimensions?: Dimensions;
  /**
   * Whether to throw an error if no metrics are emitted
   */
  throwOnEmptyMetrics?: boolean;
}

/**
 * Interface for the Metrics class
 */
export interface MetricsInterface {
  /**
   * Add a dimension to metrics
   */
  addDimension(name: string, value: string): void;
  /**
   * Add multiple dimensions to metrics
   */
  addDimensions(dimensions: Dimensions): void;
  /**
   * Add a metadata key-value pair to be included with metrics
   */
  addMetadata(key: string, value: string): void;
  /**
   * Add a metric to the metrics buffer
   */
  addMetric(
    name: string,
    unit: MetricUnit,
    value: number,
    resolution?: MetricResolution
  ): void;
  /**
   * Immediately emit a cold start metric if this is a cold start invocation
   */
  captureColdStartMetric(functionName?: string): void;
  /**
   * Clear all previously set default dimensions
   */
  clearDefaultDimensions(): void;
  /**
   * Clear all the dimensions added to the Metrics instance
   */
  clearDimensions(): void;
  /**
   * Clear all the metadata added to the Metrics instance
   */
  clearMetadata(): void;
  /**
   * Clear all the metrics stored in the buffer
   */
  clearMetrics(): void;
  /**
   * Check if there are stored metrics in the buffer
   */
  hasStoredMetrics(): boolean;
  /**
   * Flush the stored metrics to standard output
   */
  publishStoredMetrics(): void;
  /**
   * Serialize the stored metrics into a JSON object compliant with the Amazon CloudWatch EMF (Embedded Metric Format) schema
   */
  serializeMetrics(): EmfOutput;
  /**
   * Set default dimensions that will be added to all metrics
   */
  setDefaultDimensions(dimensions: Dimensions | undefined): void;
  /**
   * Set the flag to throw an error if no metrics are emitted
   */
  setThrowOnEmptyMetrics(enabled: boolean): void;
  /**
   * Create a new Metrics instance configured to immediately flush a single metric
   */
  singleMetric(): MetricsInterface;
}

/**
 * Definition of a metric
 */
export interface MetricDefinition {
  /**
   * Name of the metric
   */
  Name: string;
  /**
   * Unit of the metric
   */
  Unit: MetricUnit;
  /**
   * Storage resolution of the metric
   */
  StorageResolution?: MetricResolution;
}

/**
 * Definition of a stored metric
 */
export interface StoredMetric {
  /**
   * Name of the metric
   */
  name: string;
  /**
   * Resolution of the metric
   */
  resolution: MetricResolution;
  /**
   * Unit of the metric
   */
  unit: MetricUnit;
  /**
   * Value of the metric
   */
  value: number | number[];
}

/**
 * Storage for metrics before they are published
 */
export type StoredMetrics = Record<string, StoredMetric>;

/**
 * CloudWatch metrics object
 */
export interface CloudWatchMetrics {
  /**
   * Dimensions for the metrics
   */
  Dimensions: DimensionSet[];
  /**
   * Metrics definitions
   */
  Metrics: MetricDefinition[];
  /**
   * Namespace for the metrics
   */
  Namespace: string;
}

/**
 * AWS object in the EMF output
 */
export interface AwsObject {
  /**
   * CloudWatch metrics
   */
  CloudWatchMetrics: CloudWatchMetrics[];
  /**
   * Timestamp for the metrics
   */
  Timestamp: number;
}

/**
 * EMF output object
 */
export interface EmfOutput {
  /**
   * AWS object
   */
  _aws: AwsObject;
  /**
   * Additional properties
   */
  [key: string]: unknown;
}

/**
 * Generic logger interface
 */
export interface GenericLogger {
  /**
   * Log a debug message
   */
  debug: (message: string) => void;
  /**
   * Log an error message
   */
  error: (message: string) => void;
  /**
   * Log an info message
   */
  info: (message: string) => void;
  /**
   * Log a warning message
   */
  warn: (message: string) => void;
}
