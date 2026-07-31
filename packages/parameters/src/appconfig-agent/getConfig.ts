import {
  getServiceName,
  getStringFromEnv,
  isRunningInLambda,
} from '@aws-lambda-powertools/commons/utils/env';
import { transformValue } from '../base/transformValue.js';
import { GetParameterError, ParameterNotFoundError } from '../errors.js';
import type {
  AppConfigAgentGetConfigOutput,
  GetConfigOptions,
} from '../types/AppConfigAgent.js';

/**
 * Retrieve a configuration from the AWS AppConfig Agent Lambda extension.
 *
 * The [AWS AppConfig Agent](https://docs.aws.amazon.com/appconfig/latest/userguide/appconfig-integration-lambda-extensions.html)
 * runs as a Lambda extension inside your execution environment and exposes a local HTTP endpoint that this function calls to
 * retrieve configurations. To use this function you must add the AWS AppConfig Agent Lambda extension layer to your function.
 *
 * Unlike the SDK-based `getAppConfig` function, caching, polling, and prefetching are handled entirely by the agent, so this
 * function always fetches from the agent's local endpoint and doesn't support the `maxAge` and `forceFetch` options. You can
 * configure the agent's behavior, including caching and prefetching, using the [environment variables exposed by the agent](https://docs.aws.amazon.com/appconfig/latest/userguide/appconfig-integration-lambda-extensions-config.html).
 *
 * When the requested configuration does not exist, the function returns `undefined`. You can use the `throwOnMissing`
 * option to throw a `ParameterNotFoundError` instead, or use the nullish coalescing operator (`??`) to provide a fallback value.
 *
 * When the function detects that it's not running in AWS Lambda (the `AWS_LAMBDA_INITIALIZATION_TYPE` environment variable
 * is not set), or when running with `POWERTOOLS_DEV` enabled, it doesn't make any request. In this case, if the
 * `POWERTOOLS_APPCONFIG_AGENT_RETURN_VALUE` environment variable is set, its value is treated as the agent response and goes
 * through the same transform handling; otherwise the function returns `undefined`, or throws a `ParameterNotFoundError` when
 * the `throwOnMissing` option is set. This is helpful for unit testing and local development. Note that local emulators that
 * replicate the Lambda runtime environment (e.g., AWS SAM CLI) set the Lambda environment variables, so in those environments
 * the function will attempt to call the agent.
 *
 * **Basic usage**
 *
 * @example
 * ```typescript
 * import { getConfig } from '@aws-lambda-powertools/parameters/appconfig-agent';
 *
 * const config = await getConfig('my-configuration', {
 *   application: 'my-app',
 *   environment: 'my-env',
 * });
 *
 * export const handler = async (): Promise<void> => {
 *   // Use the config variable as needed
 *   console.log(config);
 * };
 * ```
 *
 * **Transformations**
 *
 * For configurations stored as freeform JSON or feature flags, you can use the `transform` argument set to `json` for deserialization.
 * This will return a JavaScript object instead of a string.
 *
 * @example
 * ```typescript
 * import { getConfig } from '@aws-lambda-powertools/parameters/appconfig-agent';
 *
 * const config = await getConfig('my-configuration', {
 *   application: 'my-app',
 *   environment: 'my-env',
 *   transform: 'json',
 * });
 *
 * export const handler = async (): Promise<void> => {
 *   // Use the config variable as needed
 *   console.log(config);
 * };
 * ```
 *
 * For configurations stored as base64-encoded binary data, you can use the `transform` argument set to `binary` for decoding.
 * This will return a decoded string.
 *
 * @example
 * ```typescript
 * import { getConfig } from '@aws-lambda-powertools/parameters/appconfig-agent';
 *
 * const config = await getConfig('my-configuration', {
 *   application: 'my-app',
 *   environment: 'my-env',
 *   transform: 'binary',
 * });
 *
 * export const handler = async (): Promise<void> => {
 *   // Use the config variable as needed
 *   console.log(config);
 * };
 * ```
 *
 * By default, the function calls the agent on port `2772`. If you configured the agent to run on a different port using the
 * `AWS_APPCONFIG_EXTENSION_HTTP_PORT` environment variable, the function will use that port instead.
 *
 * @see https://docs.aws.amazon.com/powertools/typescript/latest/features/parameters/
 *
 * @param name - The name of the configuration profile or the configuration profile ID
 * @param options - Options to configure the retrieval
 * @param options.environment - The environment ID or the environment name
 * @param options.application - The application ID or the application name, if not provided it will be inferred from the service name in the environment (`POWERTOOLS_SERVICE_NAME`)
 * @param options.transform - Optional transform to be applied, can be `json` or `binary`
 * @param options.timeout - Optional timeout in milliseconds for the request to the AWS AppConfig Agent (default: `3000`)
 * @param options.throwOnMissing - Optional flag to throw a `ParameterNotFoundError` when the configuration does not exist (default: `false`)
 */
/**
 * Fetch a configuration from the AWS AppConfig Agent local HTTP endpoint.
 *
 * Returns the raw response body, or `undefined` when the configuration does not
 * exist and `throwOnMissing` is not set.
 *
 * @param name - The name of the configuration profile or the configuration profile ID
 * @param options - Options to configure the retrieval, see {@link getConfig | `getConfig()`}
 */
const fetchConfigFromAgent = async (
  name: string,
  options: GetConfigOptions
): Promise<string | undefined> => {
  const application = options.application ?? getServiceName();
  if (application.trim().length === 0) {
    throw new GetParameterError(
      'Application name is not defined or POWERTOOLS_SERVICE_NAME is not set'
    );
  }

  const port = getStringFromEnv({
    key: 'AWS_APPCONFIG_EXTENSION_HTTP_PORT',
    defaultValue: '2772',
  });

  try {
    const res = await fetch(
      `http://localhost:${port}/applications/${encodeURIComponent(application)}/environments/${encodeURIComponent(options.environment)}/configurations/${encodeURIComponent(name)}`,
      {
        signal: AbortSignal.timeout(options.timeout ?? 3000),
      }
    );
    const value = await res.text();
    if (res.status === 404) {
      if (options.throwOnMissing) {
        throw new ParameterNotFoundError(`Configuration ${name} not found`);
      }
      return undefined;
    }
    if (!res.ok) {
      throw new GetParameterError(
        `Failed to retrieve configuration from AppConfig Agent: ${res.status} ${value}`
      );
    }
    return value;
  } catch (error) {
    if (error instanceof GetParameterError) throw error;
    throw new GetParameterError((error as Error).message, { cause: error });
  }
};

const getConfig = async <
  ExplicitUserProvidedType = undefined,
  InferredFromOptionsType extends GetConfigOptions = GetConfigOptions,
>(
  name: string,
  options: InferredFromOptionsType & GetConfigOptions
): Promise<
  AppConfigAgentGetConfigOutput<
    ExplicitUserProvidedType,
    InferredFromOptionsType
  >
> => {
  let value: string | undefined;
  if (isRunningInLambda()) {
    value = await fetchConfigFromAgent(name, options);
  } else {
    const localValue = getStringFromEnv({
      key: 'POWERTOOLS_APPCONFIG_AGENT_RETURN_VALUE',
      defaultValue: '',
    });
    if (localValue === '' && options.throwOnMissing) {
      throw new ParameterNotFoundError(`Configuration ${name} not found`);
    }
    value = localValue === '' ? undefined : localValue;
  }

  return (
    value !== undefined && options.transform
      ? transformValue(value, options.transform, true, name)
      : value
  ) as AppConfigAgentGetConfigOutput<
    ExplicitUserProvidedType,
    InferredFromOptionsType
  >;
};

export { getConfig };
