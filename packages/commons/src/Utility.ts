/**
 * `Utility` is a base class that other Powertools for AWS Lambda (TypeScript) utilites can extend to inherit shared logic.
 *
 * Its main purpose is to encapsulate the cold start heuristic logic. Cold start is a term commonly used to describe the `Init` phase of a Lambda function.
 * In this phase, Lambda creates or unfreezes an execution environment with the configured resources, downloads the code for the function and all layers,
 * initializes any extensions, initializes the runtime, and then runs the function’s initialization code (the code outside the main handler).
 *
 * The Init phase happens either during the first invocation, or in advance of function invocations if you have enabled provisioned concurrency.
 *
 * To learn more about the Lambda execution environment lifecycle, see the [Execution environment section](https://docs.aws.amazon.com/lambda/latest/dg/runtimes-context.html) of the AWS Lambda documentation.
 *
 * As a Powertools for AWS Lambda (TypeScript) user you probably won't be using this class directly, in fact if you use other Powertools for AWS utilities the cold start heuristic found here is already used to:
 * * Add a `coldStart` key to the structured logs when injecting context information in `Logger`
 * * Emit a metric during a cold start function invocation in `Metrics`
 * * Annotate the invocation segment with a `coldStart` key in `Tracer`
 *
 * If you want to use this logic in your own utilities, `Utility` provides two methods:
 *
 * `Utility.getColdStart()`
 *
 * Since the `Utility` class is instantiated outside of the Lambda handler it will persist across invocations of the same execution environment. This means that if you call `getColdStart()` multiple times, it will return `true` during the first invocation, and `false` afterwards.
 *
 * @example
 * ```typescript
 * import { Utility } from '@aws-lambda-powertools/commons';
 *
 * const utility = new Utility();
 *
 * export const handler = async (_event: any, _context: any) => {
 *   utility.getColdStart();
 * };
 * ```
 *
 * `Utility.isColdStart()`
 *
 * This method is an alias of `getColdStart()` and is exposed for convenience and better readability in certain usages.
 *
 * @example
 * ```typescript
 * import { Utility } from '@aws-lambda-powertools/commons';
 *
 * const utility = new Utility();
 *
 * export const handler = async (_event: any, _context: any) => {
 *   if (utility.isColdStart()) {
 *     // do something, this block is only executed on the first invocation of the function
 *   } else {
 *     // do something else, this block gets executed on all subsequent invocations
 *   }
 * };
 * ```
 */
export class Utility {
  #initializationType: 'unknown' | 'on-demand' | 'provisioned-concurrency';
  protected coldStart = true;
  protected readonly defaultServiceName: string = 'service_undefined';

  public constructor() {
    this.#initializationType = this.getInitializationType();
    if (this.#initializationType !== 'on-demand') {
      this.coldStart = false;
    }
  }

  /**
   * Get the value of the `POWERTOOLS_SERVICE_NAME` environment variable.
   */
  protected getInitializationType():
    | 'unknown'
    | 'on-demand'
    | 'provisioned-concurrency' {
    const envVarValue = process.env.AWS_LAMBDA_INITIALIZATION_TYPE?.trim();
    if (envVarValue === 'on-demand') {
      return 'on-demand';
    }
    if (envVarValue === 'provisioned-concurrency') {
      return 'provisioned-concurrency';
    }
    return 'unknown';
  }

  /**
   * Get the cold start status of the current execution environment.
   *
   * The method also flips the cold start status to `false` after the first invocation.
   */
  protected getColdStart(): boolean {
    if (this.#initializationType !== 'on-demand') {
      return false;
    }
    if (this.coldStart) {
      this.coldStart = false;

      return true;
    }

    return false;
  }

  /**
   * Validate that the service name provided is valid.
   * Used internally during initialization.
   *
   * @param serviceName Service name to validate
   */
  protected isValidServiceName(serviceName?: string): boolean {
    return typeof serviceName === 'string' && serviceName.trim().length > 0;
  }
}
