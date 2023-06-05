import { EnvironmentVariablesService } from './config';
import type { Context } from 'aws-lambda';
import type { IdempotencyConfigOptions } from './types';

class IdempotencyConfig {
  public eventKeyJmesPath: string;
  public expiresAfterSeconds: number;
  public hashFunction: string;
  public lambdaContext?: Context;
  public maxLocalCacheSize: number;
  public payloadValidationJmesPath?: string;
  public throwOnNoIdempotencyKey: boolean;
  public useLocalCache: boolean;
  readonly #envVarsService: EnvironmentVariablesService;
  readonly #enabled: boolean = true;

  public constructor(config: IdempotencyConfigOptions) {
    this.eventKeyJmesPath = config.eventKeyJmesPath ?? '';
    this.payloadValidationJmesPath = config.payloadValidationJmesPath;
    this.throwOnNoIdempotencyKey = config.throwOnNoIdempotencyKey ?? false;
    this.expiresAfterSeconds = config.expiresAfterSeconds ?? 3600; // 1 hour default
    this.useLocalCache = config.useLocalCache ?? false;
    this.maxLocalCacheSize = config.maxLocalCacheSize ?? 1000;
    this.hashFunction = config.hashFunction ?? 'md5';
    this.lambdaContext = config.lambdaContext;
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
