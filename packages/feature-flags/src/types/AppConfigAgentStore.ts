import type { GenericLogger } from '@aws-lambda-powertools/commons/types';
import type { EnvelopeOptions } from './Envelope.js';

/**
 * Configures Agent retrieval and local evaluation of a freeform Flag Document.
 * @expand
 */
type AppConfigAgentStoreOptions = EnvelopeOptions & {
  /** Identifies the configuration profile by name or ID. */
  name: string;
  /** Identifies the environment by name or ID. */
  environment: string;
  /** Identifies the application, defaulting to `POWERTOOLS_SERVICE_NAME`. */
  application?: string;
  /** Sets the Agent request timeout in milliseconds. */
  timeout?: number;
  /** Logs rule engine warnings and outcomes without values. */
  logger?: GenericLogger;
};

export type { AppConfigAgentStoreOptions };
