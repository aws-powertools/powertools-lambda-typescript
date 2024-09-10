import { DEFAULT_PROVIDERS } from '../base/DefaultProviders.js';
import type { SSMSetOptions } from '../types/SSMProvider.js';
import { SSMProvider } from './SSMProvider.js';

/**
 * ## Intro
 * The Parameters utility provides an SSMProvider that allows setting parameters in AWS Systems Manager.
 *
 * ## Getting started
 *
 * This utility supports AWS SDK v3 for JavaScript only. This allows the utility to be modular, and you to install only
 * the SDK packages you need and keep your bundle size small.
 *
 * To use the provider, you must install the Parameters utility and the AWS SDK v3 for JavaScript for SSM:
 *
 * ```sh
 * npm install @aws-lambda-powertools/parameters @aws-sdk/client-ssm
 *```
 *
 * ## Basic Usage
 *
 * @example
 * ```typescript
 * import { setParameter } from '@aws-lambda-powertools/parameters/ssm';
 *
 * export const handler = async (): Promise<void> => {
 *  // Set a parameter
 *  const version = await setParameter('/my-parameter', { value: 'my-value' });
 *  console.log(Parameter version: ${version});
 * };
 * ```
 *
 * ## Advanced Usage
 *
 * ### Overwriting a parameter
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
 * ### Extra SDK options
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
 *  ```
 *
 *  This object accepts the same options as the AWS SDK v3 for JavaScript `PutParameterCommandInput` interface.
 *
 *  ### Built-in provider class
 *
 *  For greater flexibility such as configuring the underlying SDK client used by built-in providers, you can use the {@link SSMProvider} class.
 *
 *  ### Options
 *
 *   You can customize the storage of the value by passing options to the function:
 * * `value` - The value of the parameter, which is a mandatory option.
 * * `overwrite` - Whether to overwrite the value if it already exists (default: `false`)
 * * `description` - The description of the parameter
 * * `parameterType` - The type of the parameter, can be one of `String`, `StringList`, or `SecureString` (default: `String`)
 * * `tier` - The parameter tier to use, can be one of `Standard`, `Advanced`, and `Intelligent-Tiering` (default: `Standard`)
 * * `kmsKeyId` - The KMS key id to use to encrypt the parameter
 * * `sdkOptions` - Extra options to pass to the AWS SDK v3 for JavaScript client
 *
 *  For more usage examples, see [our documentation](https://docs.powertools.aws.dev/lambda/typescript/latest/utilities/parameters/).
 *
 *  @param {string} name - Name of the parameter
 *  @param {SSMSetOptions} options - Options to configure the parameter
 *  @see https://docs.powertools.aws.dev/lambda/typescript/latest/utilities/parameters/
 */
const setParameter = async <
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
