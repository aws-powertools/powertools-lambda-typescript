import type { GenericLogger } from '@aws-lambda-powertools/commons/types';

/** Configures Agent retrieval and local evaluation of a freeform Flag Document. */
type AppConfigAgentStoreOptions = {
  /** Identifies the configuration profile by name or ID. */
  name: string;
  /** Identifies the environment by name or ID. */
  environment: string;
  /** Identifies the application, defaulting to `POWERTOOLS_SERVICE_NAME`. */
  application?: string;
  /** Selects an embedded Flag Document with JMESPath. */
  envelope?: string;
  /** Sets the Agent request timeout in milliseconds. */
  timeout?: number;
  /** Logs rule engine warnings and outcomes without values. */
  logger?: GenericLogger;
};

export type { AppConfigAgentStoreOptions };
