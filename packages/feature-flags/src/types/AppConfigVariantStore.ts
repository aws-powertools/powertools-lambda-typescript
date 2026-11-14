import type { GenericLogger } from '@aws-lambda-powertools/commons/types';

/** Configures Agent retrieval of evaluated AppConfig Variants. */
type AppConfigVariantStoreOptions = {
  /** Identifies the configuration profile by name or ID. */
  name: string;
  /** Identifies the environment by name or ID. */
  environment: string;
  /** Identifies the application, defaulting to `POWERTOOLS_SERVICE_NAME`. */
  application?: string;
  /** Sets the Agent request timeout in milliseconds. */
  timeout?: number;
  /** Logs selected Variant names without values. */
  logger?: GenericLogger;
};

export type { AppConfigVariantStoreOptions };
