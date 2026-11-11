import { isRecord } from '@aws-lambda-powertools/commons/typeutils';
import {
  getServiceName,
  getStringFromEnv,
  isRunningInLambda,
} from '@aws-lambda-powertools/commons/utils/env';
import { transformValue } from '../base/transformValue.js';
import {
  AppConfigAgentError,
  FlagNotFoundError,
  GetParameterError,
  ParameterNotFoundError,
} from '../errors.js';
import type {
  AppConfigAgentGetConfigOutput,
  GetConfigOptions,
} from '../types/AppConfigAgent.js';
import { serializeContext, serializeFlags } from './serializeAgentOptions.js';

/**
 * Reads missing flag names from the Agent's structured error without interpreting its message.
 *
 * @param value - Response body from an HTTP 400 response
 * @internal
 */
const getMissingFlags = (value: string): string[] => {
  try {
    const body: unknown = JSON.parse(value);
    if (
      !isRecord(body) ||
      body.Reason !== 'InvalidParameters' ||
      !isRecord(body.Details) ||
      !isRecord(body.Details.Value)
    ) {
      return [];
    }
    const flags: string[] = [];
    for (const [flag, problem] of Object.entries(body.Details.Value)) {
      if (isRecord(problem) && problem.Problem === 'NoSuchFlag') {
        flags.push(flag);
      }
    }
    return flags;
  } catch {
    return [];
  }
};

/**
 * Finds requested flags that the Agent omitted from a successful multi-flag response.
 *
 * @param value - Non-empty response body from an HTTP 200 response
 * @param requestedFlags - Flag names in caller-provided order
 * @internal
 */
const getMissingFlagsFromResponse = (
  value: string,
  requestedFlags: readonly string[]
): string[] => {
  try {
    const body: unknown = JSON.parse(value);
    if (!isRecord(body)) return [];
    const missingFlags: string[] = [];
    for (const flag of new Set(requestedFlags)) {
      if (!Object.hasOwn(body, flag)) missingFlags.push(flag);
    }
    return missingFlags;
  } catch {
    return [];
  }
};

/**
 * Fetch a configuration from the AWS AppConfig Agent local HTTP endpoint.
 *
 * Returns the raw response body, or `undefined` when the configuration or requested
 * flags do not exist and `throwOnMissing` is not set.
 *
 * @param name - The name of the configuration profile or the configuration profile ID
 * @param options - Options to configure the retrieval, see {@link getConfig | `getConfig()`}
 * @param queryString - Validated, encoded flag query parameters
 * @param contextHeader - Validated, encoded caller context
 * @internal
 */
const fetchConfigFromAgent = async (
  name: string,
  options: GetConfigOptions,
  queryString: string,
  contextHeader: string | undefined
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
      `http://localhost:${port}/applications/${encodeURIComponent(application)}/environments/${encodeURIComponent(options.environment)}/configurations/${encodeURIComponent(name)}${queryString}`,
      {
        signal: AbortSignal.timeout(options.timeout ?? 3000),
        ...(contextHeader === undefined
          ? {}
          : { headers: { Context: contextHeader } }),
      }
    );
    const value = await res.text();
    if (res.status === 404) {
      if (options.throwOnMissing) {
        throw new ParameterNotFoundError(`Configuration ${name} not found`);
      }
      return undefined;
    }
    const requestedFlags = options.agentOptions?.flags ?? [];
    let missingFlags: readonly string[] = [];
    if (requestedFlags.length > 0) {
      if (res.status === 400) {
        missingFlags = getMissingFlags(value);
      } else if (res.status === 200) {
        if (value === '') {
          missingFlags = requestedFlags;
        } else if (requestedFlags.length > 1) {
          missingFlags = getMissingFlagsFromResponse(value, requestedFlags);
        }
      }
    }
    if (missingFlags.length > 0) {
      if (options.throwOnMissing) {
        throw new FlagNotFoundError(
          `One or more flags not found in configuration ${name}`,
          missingFlags
        );
      }
      return undefined;
    }
    if (!res.ok) {
      throw new AppConfigAgentError(
        `Failed to retrieve configuration from AppConfig Agent: ${res.status} ${value}`,
        res.status
      );
    }
    return value;
  } catch (error) {
    if (error instanceof GetParameterError) throw error;
    throw new GetParameterError((error as Error).message, { cause: error });
  }
};

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
 * For other non-success HTTP responses, the function throws an {@link AppConfigAgentError | `AppConfigAgentError`}
 * with the HTTP status in `statusCode`. This error extends {@link GetParameterError | `GetParameterError`}.
 *
 * When the function detects that it's not running in AWS Lambda (the `AWS_LAMBDA_INITIALIZATION_TYPE` environment variable
 * is not set), or when running with `POWERTOOLS_DEV` enabled, it doesn't make any request. In this case, if the
 * `POWERTOOLS_APPCONFIG_AGENT_RETURN_VALUE` environment variable is set, its value is treated as the agent response and goes
 * through the same transform handling; otherwise the function returns `undefined`, or throws a `ParameterNotFoundError` when
 * the `throwOnMissing` option is set. This is helpful for unit testing and local development. Note that local emulators that
 * replicate the Lambda runtime environment (e.g., AWS SAM CLI) set the Lambda environment variables, so in those environments
 * the function will attempt to call the agent.
 * The `agentOptions` are validated in local mode but do not filter or evaluate the environment value.
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
 * **Feature flags and multi-variant context**
 *
 * Use `agentOptions.flags` to retrieve specific feature flags and `agentOptions.context` to supply caller context
 * for multi-variant evaluation. Flag retrieval requires Agent version `2.0.45` or later; use the latest Agent for variants.
 * Context keys must match `^[A-Za-z_][A-Za-z0-9_.-]*$` and values must be strings, finite numbers, or booleans.
 * Strings are quoted and ASCII-escaped before sending them in a single `Context` header.
 *
 * With non-empty `flags`, an empty HTTP 200 body or a structured HTTP 400 `NoSuchFlag` response returns `undefined`,
 * or throws a {@link FlagNotFoundError | `FlagNotFoundError`} when `throwOnMissing` is set. Its `flags` property lists
 * the missing names from the structured response, or all requested names for an empty HTTP 200 body.
 * For several requested flags, any missing flag makes the whole request count as missing, regardless of profile type.
 * With `throwOnMissing`, a missing application, environment, or profile (HTTP 404) still throws {@link ParameterNotFoundError | `ParameterNotFoundError`}.
 * Check `FlagNotFoundError` first because it extends `ParameterNotFoundError`.
 * Without flags, an empty successful response remains an empty string before transformation.
 *
 * @example
 * ```typescript
 * import { getConfig } from '@aws-lambda-powertools/parameters/appconfig-agent';
 *
 * const flags = await getConfig('features', {
 *   application: 'my-app',
 *   environment: 'prod',
 *   transform: 'json',
 *   agentOptions: {
 *     flags: ['ui_refresh'],
 *     context: { tier: 'pro', opted_in: true, limit: 10 },
 *   },
 * });
 * ```
 *
 * @example
 * ```typescript
 * import { getConfig } from '@aws-lambda-powertools/parameters/appconfig-agent';
 * import { FlagNotFoundError, ParameterNotFoundError } from '@aws-lambda-powertools/parameters/errors';
 *
 * try {
 *   await getConfig('features', {
 *     application: 'my-app',
 *     environment: 'prod',
 *     agentOptions: { flags: ['ui_refresh'] },
 *     throwOnMissing: true,
 *   });
 * } catch (error) {
 *   if (error instanceof FlagNotFoundError) {
 *     console.warn('Use fallback for missing flags', error.flags);
 *   } else {
 *     if (error instanceof ParameterNotFoundError) {
 *       console.error('Application, environment, or configuration profile not found');
 *     }
 *     throw error;
 *   }
 * }
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
 * @param options.throwOnMissing - Optional flag to throw a `ParameterNotFoundError` for a missing configuration, or a `FlagNotFoundError` for missing requested flags (default: `false`)
 * @param options.agentOptions - Additional options to pass to the AWS AppConfig Agent request, including flag query parameters and caller context
 */
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
  const queryString = serializeFlags(options.agentOptions?.flags);
  const contextHeader = serializeContext(options.agentOptions?.context);
  let value: string | undefined;
  if (isRunningInLambda()) {
    value = await fetchConfigFromAgent(
      name,
      options,
      queryString,
      contextHeader
    );
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
