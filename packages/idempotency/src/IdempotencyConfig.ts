import { PowertoolsFunctions } from '@aws-lambda-powertools/jmespath/functions';
import type { JMESPathParsingOptions } from '@aws-lambda-powertools/jmespath/types';
import type { Context } from 'aws-lambda';
import { EnvironmentVariablesService } from './config/EnvironmentVariablesService.js';
import type {
  IdempotencyConfigOptions,
  ResponseHook,
} from './types/IdempotencyOptions.js';

/**
 * Configuration for the idempotency feature.
 */
class IdempotencyConfig {
  /**
   * The JMESPath expression used to extract the idempotency key from the event.
   * @default ''
   */
  public eventKeyJmesPath: string;
  /**
   * The number of seconds the idempotency key is valid.
   * @default 3600 (1 hour)
   */
  public expiresAfterSeconds: number;
  /**
   * The hash function used to generate the idempotency key.
   * @see https://nodejs.org/api/crypto.html#crypto_crypto_createhash_algorithm_options
   * @default 'md5'
   */
  public hashFunction: string;
  /**
   * Options for parsing JMESPath expressions.
   *
   * By default, you can use any of the {@link https://jmespath.org/specification.html | JMESPath built-in functions} as well as the
   * {@link https://docs.powertools.aws.dev/lambda/typescript/latest/api/classes/_aws_lambda_powertools_jmespath.PowertoolsFunctions.PowertoolsFunctions.html | custom functions provided}
   * by the `@aws-lambda-powertools/jmespath` package.
   */
  public jmesPathOptions: JMESPathParsingOptions;
  /**
   * The lambda context object.
   */
  public lambdaContext?: Context;
  /**
   * The maximum number of items to store in the local cache.
   * @default 1000
   */
  public maxLocalCacheSize: number;
  /**
   * The JMESPath expression used to extract the payload to validate.
   */
  public payloadValidationJmesPath?: string;
  /**
   * Throw an error if the idempotency key is not found in the event.
   * In some cases, you may want to allow the request to continue without idempotency.
   * If set to false and idempotency key is not found, the request will continue without idempotency.
   * @default false
   */
  public throwOnNoIdempotencyKey: boolean;
  /**
   * A hook that runs when an idempotent request is made.
   */
  public responseHook?: ResponseHook;

  /**
   * Use the local cache to store idempotency keys.
   */
  public useLocalCache: boolean;
  readonly #envVarsService: EnvironmentVariablesService;
  readonly #enabled: boolean = true;

  public constructor(config: IdempotencyConfigOptions) {
    this.eventKeyJmesPath = config.eventKeyJmesPath ?? '';
    this.payloadValidationJmesPath = config.payloadValidationJmesPath;
    this.jmesPathOptions = {
      customFunctions: config.jmesPathOptions ?? new PowertoolsFunctions(),
    };
    this.throwOnNoIdempotencyKey = config.throwOnNoIdempotencyKey ?? false;
    this.expiresAfterSeconds = config.expiresAfterSeconds ?? 3600; // 1 hour default
    this.useLocalCache = config.useLocalCache ?? false;
    this.maxLocalCacheSize = config.maxLocalCacheSize ?? 1000;
    this.hashFunction = config.hashFunction ?? 'md5';
    this.lambdaContext = config.lambdaContext;
    this.responseHook = config.responseHook;
    this.#envVarsService = new EnvironmentVariablesService();
    this.#enabled = this.#envVarsService.getIdempotencyEnabled();
  }

  /**
   * Determines if the idempotency feature is enabled.
   *
   * @returns {boolean} Returns true if the idempotency feature is enabled.
   */
  public isEnabled(): boolean {
    return this.#enabled;
  }

  public registerLambdaContext(context: Context): void {
    this.lambdaContext = context;
  }
}

export { IdempotencyConfig };
