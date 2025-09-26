import { DEFAULT_PROVIDERS } from '../base/DefaultProviders.js';
import type { SSMSetOptions } from '../types/SSMProvider.js';
import { SSMProvider } from './SSMProvider.js';

/**
 * Set a parameter in AWS Systems Manager Parameter Store.
 *
 * **Basic Usage**
 *
 * @example
 * ```typescript
 * import { setParameter } from '@aws-lambda-powertools/parameters/ssm';
 *
 * export const handler = async () => {
 *   // Set a parameter
 *   const version = await setParameter('/my-parameter', { value: 'my-value' });
 * };
 * ```
 *
 * **Overwriting a parameter**
 *
 * By default, the provider will not overwrite a parameter if it already exists. You can force the provider to overwrite the parameter by using the `overwrite` option.
 *
 * @example
 * ```typescript
 * import { setParameter } from '@aws-lambda-powertools/parameters/ssm';
 *
 * export const handler = async (): Promise<void> => {
 *  // Set a parameter and overwrite it
 *  const version = await setParameter('/my-parameter', {
 *    value: 'my-value',
 *    overwrite: true,
 *  });
 *  console.log(Parameter version: ${version});
 * };
 * ```
 *
 * **Extra SDK options**
 *
 * When setting a parameter, you can pass extra options to the AWS SDK v3 for JavaScript client by using the sdkOptions parameter.
 *
 * @example
 * ```typescript
 * import { setParameter } from '@aws-lambda-powertools/parameters/ssm';
 *
 * export const handler = async (): Promise<void> => {
 *  // Set a parameter with extra options
 *  const version = await setParameter('/my-parameter', {
 *    value: 'my-value',
 *    sdkOptions: {
 *      Overwrite: true,
 *    },
 *  });
 * };
 * ```
 *
 * This object accepts the same options as the AWS SDK v3 for JavaScript `PutParameterCommandInput` interface.
 *
 * For greater flexibility such as configuring the underlying SDK client used by built-in providers, you can use the {@link SSMProvider} utility.
 *
 * @see https://docs.powertools.aws.dev/lambda/typescript/latest/features/parameters/
 *
 * @param name - Name of the parameter
 * @param options - Options to configure the parameter
 * @param options.value - The value of the parameter
 * @param options.overwrite - Whether to overwrite the value if it already exists (default: `false`)
 * @param options.description - The description of the parameter
 * @param options.parameterType - The type of the parameter, can be one of `String`, `StringList`, or `SecureString` (default: `String`)
 * @param options.tier - The parameter tier to use, can be one of `Standard`, `Advanced`, and `Intelligent-Tiering` (default: `Standard`)
 */
const setParameter = <
  InferredFromOptionsType extends SSMSetOptions | undefined = SSMSetOptions,
>(
  name: string,
  options: InferredFromOptionsType & SSMSetOptions
): Promise<number> => {
  if (!Object.hasOwn(DEFAULT_PROVIDERS, 'ssm')) {
    DEFAULT_PROVIDERS.ssm = new SSMProvider();
  }
  return (DEFAULT_PROVIDERS.ssm as SSMProvider).set(name, options);
};

export { setParameter };
