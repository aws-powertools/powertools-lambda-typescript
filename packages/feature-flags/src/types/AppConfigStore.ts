import type { GenericLogger } from '@aws-lambda-powertools/commons/types';
import type {
  AppConfigDataClient,
  AppConfigDataClientConfig,
} from '@aws-sdk/client-appconfigdata';

/** Configures retrieval and local evaluation of an AppConfig freeform Flag Document. */
type AppConfigStoreOptions = {
  /** Identifies the configuration profile by name or ID. */
  name: string;
  /** Identifies the environment by name or ID. */
  environment: string;
  /** Identifies the application, defaulting to `POWERTOOLS_SERVICE_NAME`. */
  application?: string;
  /** Selects an embedded Flag Document with JMESPath. */
  envelope?: string;
  /** Sets the Parameters cache duration in seconds. */
  maxAge?: number;
  /** Supplies the AppConfigData client instead of creating one. */
  awsSdkV3Client?: AppConfigDataClient;
  /** Configures the AppConfigData client when no client is supplied. */
  clientConfig?: AppConfigDataClientConfig;
  /** Logs rule engine warnings and outcomes without values. */
  logger?: GenericLogger;
};

export type { AppConfigStoreOptions };
