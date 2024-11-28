---
title: Parameters
description: Utility
---

<!-- markdownlint-disable MD013 -->
The Parameters utility provides high-level functions to retrieve one or multiple parameter values from [AWS Systems Manager Parameter Store](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html){target="_blank"}, [AWS Secrets Manager](https://docs.aws.amazon.com/secretsmanager/latest/userguide/intro.html){target="_blank"}, [AWS AppConfig](https://docs.aws.amazon.com/appconfig/latest/userguide/what-is-appconfig.html){target="_blank"}, [Amazon DynamoDB](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Introduction.html){target="_blank"}, or your own parameter store.
<!-- markdownlint-enable MD013 -->

## Key features

* Retrieve one or multiple parameters from the underlying provider
* Cache parameter values for a given amount of time (defaults to 5 seconds)
* Transform parameter values from JSON or base64 encoded strings
* Bring Your Own Parameter Store Provider

## Getting started

The Parameters Utility helps to retrieve parameters from the System Manager Parameter Store (SSM), secrets from the Secrets Manager, and application configuration from AppConfig. Additionally, the utility also offers support for a DynamoDB provider, enabling the retrieval of arbitrary parameters from specified tables.

### Installation

???+ note
	This utility supports **[AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/){target="_blank"} only**. This allows the utility to be modular, and you to install only the SDK packages you need and keep your bundle size small.

Depending on the provider you want to use, install the library and the corresponding AWS SDK package:

=== "SSMProvider"
	```bash
	npm install @aws-lambda-powertools/parameters @aws-sdk/client-ssm
	```

=== "SecretsProvider"
	```bash
	npm install @aws-lambda-powertools/parameters @aws-sdk/client-secrets-manager
	```

=== "AppConfigProvider"
	```bash
	npm install @aws-lambda-powertools/parameters @aws-sdk/client-appconfigdata
	```

=== "DynamoDBProvider"
	```bash
	npm install @aws-lambda-powertools/parameters @aws-sdk/client-dynamodb @aws-sdk/util-dynamodb
	```

???+ tip
	If you are using the `nodejs18.x` runtime or newer, the AWS SDK for JavaScript v3 is already installed and you can install the utility only.

### IAM Permissions

This utility requires additional permissions to work as expected.

???+ note
    Different parameter providers require different permissions.

| Provider  | Function/Method                                                  | IAM Permission                                                                       |
| --------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| SSM       | **`getParameter`**, **`SSMProvider.get`**                        | **`ssm:GetParameter`**                                                               |
| SSM       | **`getParameters`**, **`SSMProvider.getMultiple`**               | **`ssm:GetParametersByPath`**                                                        |
| SSM       | **`getParametersByName`**, **`SSMProvider.getParametersByName`** | **`ssm:GetParameter`** and **`ssm:GetParameters`**                                   |
| SSM       | If using **`decrypt: true`**                                     | You must add an additional permission **`kms:Decrypt`**                              |
| SSM       | **`setParameter`**, **`SSMProvider.set`**                        | **`ssm:PutParameter`**                                                               |
| Secrets   | **`getSecret`**, **`SecretsProvider.get`**                       | **`secretsmanager:GetSecretValue`**                                                  |
| DynamoDB  | **`DynamoDBProvider.get`**                                       | **`dynamodb:GetItem`**                                                               |
| DynamoDB  | **`DynamoDBProvider.getMultiple`**                               | **`dynamodb:Query`**                                                                 |
| AppConfig | **`getAppConfig`**, **`AppConfigProvider.getAppConfig`**         | **`appconfig:GetLatestConfiguration`** and **`appconfig:StartConfigurationSession`** |

### Fetching parameters

You can retrieve a single parameter using the `getParameter` high-level function.

```typescript hl_lines="1 5" title="Fetching a single parameter from SSM"
--8<-- "examples/snippets/parameters/getParameter.ts"
```

For multiple parameters, you can use either:

* `getParameters` to recursively fetch all parameters by path.
* `getParametersByName` to fetch distinct parameters by their full name. It also accepts custom caching, transform, decrypt per parameter.

=== "getParameters"

    ```typescript hl_lines="1 8" title="Fetching multiple parameters by path from SSM"
    --8<-- "examples/snippets/parameters/getParameters.ts"
    ```

=== "getParametersByName"

    ```typescript hl_lines="1-2 4-11 15" title="Fetching multiple parameters by names from SSM"
    --8<-- "examples/snippets/parameters/getParametersByName.ts"
    ```

???+ tip "`getParametersByName` supports graceful error handling"
	By default, the provider will throw a `GetParameterError` when any parameter fails to be fetched. You can override it by setting `throwOnError: false`.

	When disabled, instead the provider will take the following actions:

	* Add failed parameter name in the `_errors` key, _e.g._, `{ _errors: [ '/param1', '/param2' ] }`
	* Keep only successful parameter names and their values in the response
	* Throw `GetParameterError` if any of your parameters is named `_errors`

```typescript hl_lines="9 13-15 18"
--8<-- "examples/snippets/parameters/getParametersByNameGracefulErrorHandling.ts"
```

### Storing parameters

You can store parameters in the System Manager Parameter Store using `setParameter`.

```typescript hl_lines="1 5" title="Storing a parameter in SSM"
--8<-- "examples/snippets/parameters/setParameter.ts"
```

If the parameter is already existent, it needs to have the `overwrite` parameter set to `true` to update the value.

```typescript hl_lines="1 7" title="Overwriting an existing parameter in SSM"
--8<-- "examples/snippets/parameters/setParameterOverwrite.ts"
```

### Fetching secrets

You can fetch secrets stored in Secrets Manager using `getSecret`.

```typescript hl_lines="1 5" title="Fetching secrets"
--8<-- "examples/snippets/parameters/getSecret.ts"
```

### Fetching app configurations

You can fetch application configurations in AWS AppConfig using `getAppConfig`.

The following will retrieve the latest version and store it in the cache.

```typescript hl_lines="1 5-8" title="Fetching latest config from AppConfig"
--8<-- "examples/snippets/parameters/getAppConfig.ts"
```

## Advanced

### Adjusting cache TTL

By default, the provider will cache parameters retrieved in-memory for 5 seconds.

You can adjust how long values should be kept in cache by using the param `maxAge`, when using  `get()` or `getMultiple()` methods across all providers.

???+ tip
	If you want to set the same TTL for all parameters, you can set the `POWERTOOLS_PARAMETERS_MAX_AGE` environment variable. **This will override the default TTL of 5 seconds but can be overridden by the `maxAge` parameter**.

```typescript hl_lines="8 14" title="Caching parameters values in memory for longer than 5 seconds"
--8<-- "examples/snippets/parameters/adjustingCacheTTL.ts"
```

1. Options passed to `get()`, `getMultiple()`, and `getParametersByName()` will override the values set in `POWERTOOLS_PARAMETERS_MAX_AGE` environment variable.

???+ info
	The `maxAge` parameter is also available in high level functions like `getParameter`, `getSecret`, etc.

### Always fetching the latest

If you'd like to always ensure you fetch the latest parameter from the store regardless if already available in cache, use the `forceFetch` parameter.

```typescript hl_lines="5" title="Forcefully fetching the latest parameter whether TTL has expired or not"
--8<-- "examples/snippets/parameters/forceFetch.ts"
```

### Built-in provider class

For greater flexibility such as configuring the underlying SDK client used by built-in providers, you can use their respective Provider Classes directly.

???+ tip
    This can be used to retrieve values from other regions, change the retry behavior, etc.

#### SSMProvider

```typescript hl_lines="4-5" title="Example with SSMProvider for further extensibility"
--8<-- "examples/snippets/parameters/ssmProvider.ts"
```

The AWS Systems Manager Parameter Store provider supports two additional arguments for the `get()` and `getMultiple()` methods:

| Parameter     | Default | Description                                                                                   |
| ------------- | ------- | --------------------------------------------------------------------------------------------- |
| **decrypt**   | `false` | Will automatically decrypt the parameter (see required [IAM Permissions](#iam-permissions)).  |
| **recursive** | `true`  | For `getMultiple()` only, will fetch all parameter values recursively based on a path prefix. |

???+ tip
	If you want to always decrypt parameters, you can set the `POWERTOOLS_PARAMETERS_SSM_DECRYPT=true` environment variable. **This will override the default value of `false` but can be overridden by the `decrypt` parameter**.

```typescript hl_lines="6 12" title="Example with get() and getMultiple()"
--8<-- "examples/snippets/parameters/ssmProviderDecryptAndRecursive.ts"
```

1. Options passed to `get()`, `getMultiple()`, and `getParametersByName()` will override the values set in `POWERTOOLS_PARAMETERS_SSM_DECRYPT` environment variable.

#### SecretsProvider

```typescript hl_lines="4-5" title="Example with SecretsProvider for further extensibility"
--8<-- "examples/snippets/parameters/secretsProvider.ts"
```

#### AppConfigProvider

The AWS AppConfig provider requires two arguments when initialized:

| Parameter       | Mandatory in constructor | Alternative                            | Description                                              |
| --------------- | ------------------------ | -------------------------------------- | -------------------------------------------------------- |
| **application** | No                       | `POWERTOOLS_SERVICE_NAME` env variable | The application in which your config resides.            |
| **environment** | Yes                      | _(N/A)_                                | The environment that corresponds to your current config. |

```typescript hl_lines="4 8" title="Example with AppConfigProvider for further extensibility"
--8<-- "examples/snippets/parameters/appConfigProvider.ts"
```

#### DynamoDBProvider

The DynamoDB Provider does not have any high-level functions and needs to know the name of the DynamoDB table containing the parameters.

**DynamoDB table structure for single parameters**

For single parameters, you must use `id` as the [partition key](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.CoreComponents.html#HowItWorks.CoreComponents.PrimaryKey) for that table.

???+ example

	DynamoDB table with `id` partition key and `value` as attribute

 | id           | value    |
 | ------------ | -------- |
 | my-parameter | my-value |

With this table, `await dynamoDBProvider.get('my-param')` will return `my-value`.

=== "handler.ts"
	```typescript hl_lines="3 7"
	--8<-- "examples/snippets/parameters/dynamoDBProvider.ts"
	```

=== "DynamoDB Local example"
	You can initialize the DynamoDB provider pointing to [DynamoDB Local](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html) using the `endpoint` field in the `clientConfig` parameter:

	```typescript hl_lines="5-7"
	--8<-- "examples/snippets/parameters/dynamoDBProviderLocal.ts"
	```

**DynamoDB table structure for multiple values parameters**

You can retrieve multiple parameters sharing the same `id` by having a sort key named `sk`.

???+ example

	DynamoDB table with `id` primary key, `sk` as sort key and `value` as attribute

 | id          | sk      | value      |
 | ----------- | ------- | ---------- |
 | my-hash-key | param-a | my-value-a |
 | my-hash-key | param-b | my-value-b |
 | my-hash-key | param-c | my-value-c |

With this table, `await dynamoDBProvider.getMultiple('my-hash-key')` will return a dictionary response in the shape of `sk:value`.

=== "handler.ts"
	```typescript hl_lines="3 10"
	--8<-- "examples/snippets/parameters/dynamoDBProviderMultiple.ts"
	```

=== "values response object"

	```json
	{
	  "param-a": "my-value-a",
	  "param-b": "my-value-b",
	  "param-c": "my-value-c"
	}
	```

**Customizing DynamoDBProvider**

DynamoDB provider can be customized at initialization to match your table structure:

| Parameter     | Mandatory | Default | Description                                                                                               |
| ------------- | --------- | ------- | --------------------------------------------------------------------------------------------------------- |
| **tableName** | **Yes**   | _(N/A)_ | Name of the DynamoDB table containing the parameter values.                                               |
| **keyAttr**   | No        | `id`    | Hash key for the DynamoDB table.                                                                          |
| **sortAttr**  | No        | `sk`    | Range key for the DynamoDB table. You don't need to set this if you don't use the `getMultiple()` method. |
| **valueAttr** | No        | `value` | Name of the attribute containing the parameter value.                                                     |

```typescript hl_lines="3-8" title="Customizing DynamoDBProvider to suit your table design"
--8<-- "examples/snippets/parameters/dynamoDBProviderCustomizeTable.ts"
```

### Create your own provider

You can create your own custom parameter store provider by extending the `BaseProvider` class, and implementing the `get()` and `getMultiple()` methods, as well as its respective `_get()` and `_getMultiple()` private methods to retrieve a single, or multiple parameters from your custom store.

All caching logic is handled by the `BaseProvider`, and provided that the return types of your store are compatible with the ones used in the `BaseProvider`, all transformations will also work as expected.

Here's an example of implementing a custom parameter store using an external service like HashiCorp Vault, a widely popular key-value secret storage.

=== "Provider implementation"
	```typescript
	--8<-- "examples/snippets/parameters/customProviderVault.ts"
	```

=== "Provider types"
	```typescript
	--8<-- "examples/snippets/parameters/customProviderVaultTypes.ts"
	```

=== "Provider usage"
	```typescript
	--8<-- "examples/snippets/parameters/customProviderVaultUsage.ts"
	```

### Deserializing values with transform parameter

For parameters stored in JSON or Base64 format, you can use the `transform` argument for deserialization.

???+ info
    The `transform` argument is available across all providers, including the high level functions.

=== "High level functions"
	```typescript hl_lines="4"
	--8<-- "examples/snippets/parameters/transform.ts"
	```

=== "Providers"
	```typescript hl_lines="7 10"
	--8<-- "examples/snippets/parameters/transformProvider.ts"
	```

#### Partial transform failures with `getMultiple()`

If you use `transform` with `getMultiple()`, you can have a single malformed parameter value. To prevent failing the entire request, the method will return an `undefined` value for the parameters that failed to transform.

You can override this by setting the `throwOnTransformError` argument to `true`. If you do so, a single transform error will throw a **`TransformParameterError`** error.

For example, if you have three parameters, _/param/a_, _/param/b_ and _/param/c_, but _/param/c_ is malformed:

```typescript hl_lines="23" title="Throwing TransformParameterError at first malformed parameter"
--8<-- "examples/snippets/parameters/transformPartialFailures.ts"
```

#### Auto-transform values on suffix

If you use `transform` with `getMultiple()`, you might want to retrieve and transform parameters encoded in different formats.

You can do this with a single request by using `transform: 'auto'`. This will instruct any provider to infer its type based on the suffix and transform it accordingly.

???+ info
    `transform: 'auto'` feature is available across all providers, including the high level functions.

```typescript hl_lines="7" title="Deserializing parameter values based on their suffix"
--8<-- "examples/snippets/parameters/transformAuto.ts"
```

For example, if you have three parameters: two with the following suffixes `.json` and `.binary` and one without any suffix:

| Parameter name  | Parameter value      |
| --------------- | -------------------- |
| /param/a        | [some encoded value] |
| /param/a.json   | [some encoded value] |
| /param/a.binary | [some encoded value] |

The return of `await parametersProvider.getMultiple('/param', transform: 'auto');` call will be an object like:

```json
{
  "a": [some encoded value],
  "a.json": [some decoded value],
  "b.binary": [some decoded value]
}
```

The two parameters with a suffix will be decoded, while the one without a suffix will be returned as is.

### Passing additional SDK arguments

You can use a special `sdkOptions` object argument to pass any supported option directly to the underlying SDK method.

```typescript hl_lines="8 14" title="Specify a VersionId for a secret"
--8<-- "examples/snippets/parameters/sdkOptions.ts"
```

Here is the mapping between this utility's functions and methods and the underlying SDK:

| Provider            | Function/Method                | Client name                       | Function name                                                                                                                                                                                                                                                                                                                                     |
| ------------------- |--------------------------------| --------------------------------- |---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| SSM Parameter Store | `getParameter`                 | `@aws-sdk/client-ssm`             | [GetParameterCommand](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/ssm/command/GetParameterCommand/){target="_blank"}                                                                                                                                                                                                            |
| SSM Parameter Store | `getParameters`                | `@aws-sdk/client-ssm`             | [GetParametersByPathCommand](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/ssm/command/GetParametersByPathCommand/){target="_blank"}                                                                                                                                                                                              |
| SSM Parameter Store | `SSMProvider.get`              | `@aws-sdk/client-ssm`             | [GetParameterCommand](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/ssm/command/GetParameterCommand/){target="_blank"}                                                                                                                                                                                                            |
| SSM Parameter Store | `SSMProvider.getMultiple`      | `@aws-sdk/client-ssm`             | [GetParametersByPathCommand](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/ssm/command/GetParametersByPathCommand){target="_blank"}                                                                                                                                                                                               |
| SSM Parameter Store | `setParameter`                 | `@aws-sdk/client-ssm`             | [PutParameterCommand](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/ssm/command/PutParameterCommand/){target="_blank"}                                                                                                                                                                                                            |
| SSM Parameter Store | `SSMProvider.set`              | `@aws-sdk/client-ssm`             | [PutParameterCommand](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/ssm/command/PutParameterCommand/){target="_blank"}                                                                                                                                                                                                            |
| Secrets Manager     | `getSecret`                    | `@aws-sdk/client-secrets-manager` | [GetSecretValueCommand](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/secrets-manager/command/GetSecretValueCommand/){target="_blank"}                                                                                                                                                                                            |
| Secrets Manager     | `SecretsProvider.get`          | `@aws-sdk/client-secrets-manager` | [GetSecretValueCommand](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/secrets-manager/command/GetSecretValueCommand/){target="_blank"}                                                                                                                                                                                            |
| AppConfig           | `AppConfigProvider.get`        | `@aws-sdk/client-appconfigdata`   | [StartConfigurationSessionCommand](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/appconfigdata/command/StartConfigurationSessionCommand/){target="_blank"} & [GetLatestConfigurationCommand](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/appconfigdata/command/GetLatestConfigurationCommand/){target="_blank"} |
| AppConfig           | `getAppConfig`                 | `@aws-sdk/client-appconfigdata`   | [StartConfigurationSessionCommand](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/appconfigdata/command/StartConfigurationSessionCommand/){target="_blank"} & [GetLatestConfigurationCommand](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/appconfigdata/command/GetLatestConfigurationCommand/){target="_blank"} |
| DynamoDB            | `DynamoDBProvider.get`         | `@aws-sdk/client-dynamodb`        | [GetItemCommand](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/dynamodb/command/GetItemCommand/){target="_blank"}                                                                                                                                                                                                                 |
| DynamoDB            | `DynamoDBProvider.getMultiple` | `@aws-sdk/client-dynamodb`        | [QueryCommand](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/dynamodb/command/QueryCommand/){target="_blank"}                                                                                                                                                                                                                     |

### Bring your own AWS SDK v3 client

You can use the `awsSdkV3Client` parameter via any of the available [Provider Classes](#built-in-provider-class).

| Provider                                | Client                        |
| --------------------------------------- | ----------------------------- |
| [SSMProvider](#ssmprovider)             | `new SSMClient();`            |
| [SecretsProvider](#secretsprovider)     | `new SecretsManagerClient();` |
| [AppConfigProvider](#appconfigprovider) | `new AppConfigDataClient();`  |
| [DynamoDBProvider](#dynamodbprovider)   | `new DynamoDBClient();`       |

???+ question "When is this useful?"
	Injecting a custom AWS SDK v3 client allows you to [apply tracing](../core/tracer.md#patching-aws-sdk-clients) or make unit/snapshot testing easier, including SDK customizations.

=== "SSMProvider"
	```typescript hl_lines="5 7"
	--8<-- "examples/snippets/parameters/ssmProviderCustomClient.ts"
	```

=== "SecretsProvider"
	```typescript hl_lines="5 8"
	--8<-- "examples/snippets/parameters/secretsProviderCustomClient.ts"
	```

=== "AppConfigProvider"
	```typescript hl_lines="5 8"
	--8<-- "examples/snippets/parameters/appConfigProviderCustomClient.ts"
	```

=== "DynamoDBProvider"
	```typescript hl_lines="5 7"
	--8<-- "examples/snippets/parameters/dynamoDBProviderCustomClient.ts"
	```

### Customizing AWS SDK v3 configuration

The **`clientConfig`** parameter enables you to pass in a custom [config object](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/configuring-the-jssdk.html) when constructing any of the built-in provider classes.

???+ tip
	You can use a custom session for retrieving parameters cross-account/region and for snapshot testing.

	When using VPC private endpoints, you can pass a custom client altogether. It's also useful for testing when injecting fake instances.

```typescript hl_lines="2 4-5"
--8<-- "examples/snippets/parameters/clientConfig.ts"
```

## Testing your code

### Mocking parameter values

For unit testing your applications, you can mock the calls to the parameters utility to avoid calling AWS APIs. This can be achieved in a number of ways - in this example, we mock the module import to patch the `getParameters` function.

=== "handler.test.ts"
	```typescript hl_lines="4-6 12 22"
	--8<-- "examples/snippets/parameters/testingYourCodeFunctionsMock.ts"
	```

=== "handler.ts"
	```typescript
	--8<-- "examples/snippets/parameters/testingYourCodeFunctionsHandler.ts"
	```

With this pattern in place, you can customize the return values of the mocked function to test different scenarios without calling AWS APIs.

A similar pattern can be applied also to any of the built-in provider classes - in this other example, we use spies to patch the `get` function of the `AppConfigProvider` class. This is useful also when you want to test that the correct arguments are being passed to the Parameters utility.

=== "handler.test.ts"
	```typescript hl_lines="2 7 21-23"
	--8<-- "examples/snippets/parameters/testingYourCodeProvidersMock.ts"
	```

=== "handler.ts"
	```typescript
	--8<-- "examples/snippets/parameters/testingYourCodeProvidersHandler.ts"
	```

For when you want to mock the AWS SDK v3 client directly, we recommend using the [`aws-sdk-client-mock`](https://www.npmjs.com/package/aws-sdk-client-mock) and [`aws-sdk-client-mock-vitest`](https://www.npmjs.com/package/aws-sdk-client-mock-vitest) libraries. This is useful when you want to test how your code behaves when the AWS SDK v3 client throws an error or a specific response.

=== "handler.test.ts"
	```typescript hl_lines="2-7 12 16 21-28"
	--8<-- "examples/snippets/parameters/testingYourCodeClientMock.ts"
	```

=== "handler.ts"
	```typescript
	--8<-- "examples/snippets/parameters/testingYourCodeClientHandler.ts"
	```

### Clearing cache

Parameters utility caches all parameter values for performance and cost reasons. However, this can have unintended interference in tests using the same parameter name.

Within your tests, you can use `clearCache` method available in [every provider](#built-in-provider-class). When using multiple providers or higher level functions like `getParameter`, use the `clearCaches` standalone function to clear cache globally.

=== "handler.test.ts"
	```typescript hl_lines="1 6"
	--8<-- "examples/snippets/parameters/testingYourCodeClearCache.ts"
	```
