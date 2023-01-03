---
title: Parameters
description: Utility
---

The parameters utility provides high-level functions to retrieve one or multiple parameter values from [AWS Systems Manager Parameter Store](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html){target="_blank"}, [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/){target="_blank"}, [AWS AppConfig](https://docs.aws.amazon.com/appconfig/latest/userguide/what-is-appconfig.html){target="_blank"}, [Amazon DynamoDB](https://aws.amazon.com/dynamodb/){target="_blank"}, or your own parameter store.

## Key features

* Retrieve one or multiple parameters from the underlying provider
* Cache parameter values for a given amount of time (defaults to 5 seconds)
* Transform parameter values from JSON or base 64 encoded strings
* Bring Your Own Parameter Store Provider

## Getting started

By default, we fetch parameters from System Manager Parameter Store, secrets from Secrets Manager, and application configuration from AppConfig.

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
| Secrets   | **`getSecret`**, **`SecretsProvider.get`**                       | **`secretsmanager:GetSecretValue`**                                                  |
| DynamoDB  | **`DynamoDBProvider.get`**                                       | **`dynamodb:GetItem`**                                                               |
| DynamoDB  | **`DynamoDBProvider.getMultiple`**                               | **`dynamodb:Query`**                                                                 |
| AppConfig | **`getAppConfig`**, **`AppConfigProvider.getAppConfig`**         | **`appconfig:GetLatestConfiguration`** and **`appconfig:StartConfigurationSession`** |

### Fetching parameters

You can retrieve a single parameter  using `getParameter` high-level function.

```typescript hl_lines="1 5" title="Fetching a single parameter"
import { getParameter } from '@aws-lambda-powertools/parameters';

export const handler = async (_event, _context): Promise<void> => {
    // Retrieve a single parameter
    const value = getParameter('/my/parameter');
};
```

For multiple parameters, you can use either:

* `getParameters` to recursively fetch all parameters by path.
* `getParametersByName` to fetch distinct parameters by their full name. It also accepts custom caching, transform, decrypt per parameter.

=== "getParameters"

    ```typescript hl_lines="1 6" title="Fetching a single parameter"
    import { getParameters } from '@aws-lambda-powertools/parameters';

    export const handler = async (_event, _context): Promise<void> => {
        // Retrieve multiple parameters from a path prefix recursively
    	  // This returns an object with the parameter name as key
        const values = getParameters('/my/path/prefix');
        for (const [ key, value ] of Object.entries(values)) {
          console.log(`${key}: ${value}`);
        }
    };
    ```

=== "getParametersByName"

    ```typescript hl_lines="1 3 12"
    import { getParametersByName } from '@aws-lambda-powertools/parameters';

    const props = {
        '/develop/service/commons/telemetry/config': { maxAge: 300, transform: 'json' },
        '/no_cache_param': { maxAge: 0 },
        // Use default values
        '/develop/service/payment/api/capture/url': {},
    };

    export const handler = async (_event, _context): Promise<void> => {
        // This returns an object with the parameter name as key
    	  const values = getParametersByName(props, { maxAge: 60 });
        for (const [ key, value ] of Object.entries(values)) {
          console.log(`${key}: ${value}`);
        }
    };
    ```

???+ tip "`getParametersByName` supports graceful error handling"
	By default, we will throw a `GetParameterError` when any parameter fails to be fetched. You can override it by setting `throwOnError: false`.

	When disabled, we take the following actions:

	* Add failed parameter name in the `_errors` key, _e.g._, `{ _errors: [ '/param1', '/param2' ] }`
	* Keep only successful parameter names and their values in the response
	* Throw `GetParameterError` if any of your parameters is named `_errors`

```typescript hl_lines="1 3 10-11 13"
import { getParametersByName } from '@aws-lambda-powertools/parameters';

const props = {
    '/develop/service/commons/telemetry/config': { maxAge: 300, transform: 'json' },
    // Example of non-existent parameter
    '/this/param/does/not/exist': {},
};

export const handler = async (_event, _context): Promise<void> => {
    const values = getParametersByName(props, { throwOnError: false });
    const errors = values?.errors || [];

    // Handle gracefully, since `/this/param/does/not/exist` will only be available in `_errors`
    if (errors.length) {
      // ...
    }

    for (const [ key, value ] of Object.entries(values)) {
      console.log(`${key}: ${value}`);
    }
};
```

### Fetching secrets

You can fetch secrets stored in Secrets Manager using `getSecrets`.

```typescript hl_lines="1 5" title="Fetching secrets"
import { getSecret } from '@aws-lambda-powertools/parameters';

export const handler = async (_event, _context): Promise<void> => {
    // Retrieve a single secret
    const value = getSecret('my-secret');
};
```

## Advanced

### Adjusting cache TTL

???+ tip
	`maxAge` parameter is also available in high level functions like `getParameter`, `getSecret`, etc.

By default, we cache parameters retrieved in-memory for 5 seconds.

You can adjust how long we should keep values in cache by using the param `maxAge`, when using  `get()` or `getMultiple()` methods across all providers.

```typescript hl_lines="7 10" title="Caching parameter(s) value in memory for longer than 5 seconds"
import { SSMProvider } from '@aws-lambda-powertools/parameters';

const parameters = new SSMProvider();

export const handler = async (_event, _context): Promise<void> => {
	// Retrieve a single parameter
	const value = parameters.get('/my/parameter', { maxAge: 60 }); // 1 minute

	// Retrieve multiple parameters from a path prefix
	const values = parameters.getMultiple('/my/path/prefix', { maxAge: 60 });
  for (const [ key, value ] of Object.entries(values)) {
    console.log(`${key}: ${value}`);
  }
};
```

### Always fetching the latest

If you'd like to always ensure you fetch the latest parameter from the store regardless if already available in cache, use `forceFetch` param.

```typescript hl_lines="5" title="Forcefully fetching the latest parameter whether TTL has expired or not"
import { getParameter } from '@aws-lambda-powertools/parameters';

export const handler = async (_event, _context): Promise<void> => {
	// Retrieve a single parameter
	const value = getParameter('/my/parameter', { forceFetch: true });
};
```

### Built-in provider class

For greater flexibility such as configuring the underlying SDK client used by built-in providers, you can use their respective Provider Classes directly.

???+ tip
    This can be used to retrieve values from other regions, change the retry behavior, etc.

#### SSMProvider

```typescript hl_lines="4 8 11" title="Example with SSMProvider for further extensibility"
import { SSMProvider } from '@aws-lambda-powertools/parameters';
import type { SSMClientConfig } from '@aws-sdk/client-ssm';

const clientConfig: SSMClientConfig = { region: 'us-east-1' };
const parameters = new SSMProvider({ clientConfig });

export const handler = async (_event, _context): Promise<void> => {
	// Retrieve a single parameter
	const value = parameters.get('/my/parameter');

	// Retrieve multiple parameters from a path prefix
	const values = parameters.getMultiple('/my/path/prefix');
  for (const [ key, value ] of Object.entries(values)) {
    console.log(`${key}: ${value}`);
  }
};
```

The AWS Systems Manager Parameter Store provider supports two additional arguments for the `get()` and `getMultiple()` methods:

| Parameter     | Default | Description                                                                                   |
| ------------- | ------- | --------------------------------------------------------------------------------------------- |
| **decrypt**   | `false` | Will automatically decrypt the parameter.                                                     |
| **recursive** | `true`  | For `getMultiple()` only, will fetch all parameter values recursively based on a path prefix. |

```typescript hl_lines="6 8" title="Example with get() and getMultiple()"
import { SSMProvider } from '@aws-lambda-powertools/parameters';

const parameters = new SSMProvider();

export const handler = async (_event, _context): Promise<void> => {
	const decryptedValue = parameters.get('/my/encrypted/parameter', { decrypt: true });

	const noRecursiveValues = parameters.getMultiple('/my/path/prefix', { recursive: false });
};
```

#### SecretsProvider

```typescript hl_lines="5 9" title="Example with SecretsProvider for further extensibility"
import { SecretsProvider } from '@aws-lambda-powertools/parameters';
import type { SecretsManagerClientConfig } from '@aws-sdk/client-secretsmanager';

const clientConfig: SecretsManagerClientConfig = { region: 'us-east-1' };
const secrets = new SecretsProvider({ clientConfig });

export const handler = async (_event, _context): Promise<void> => {
	// Retrieve a single secret
  const value = secrets.getSecret('my-secret');
```

#### DynamoDBProvider

The DynamoDB Provider does not have any high-level functions, as it needs to know the name of the DynamoDB table containing the parameters.

**DynamoDB table structure for single parameters**

For single parameters, you must use `id` as the [partition key](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.CoreComponents.html#HowItWorks.CoreComponents.PrimaryKey) for that table.

???+ example

	DynamoDB table with `id` partition key and `value` as attribute

 | id           | value    |
 | ------------ | -------- |
 | my-parameter | my-value |

With this table, `dynamodbProvider.get('my-param')` will return `my-value`.

=== "index.ts"
	```typescript hl_lines="3 7"
  import { DynamoDBProvider } from '@aws-lambda-powertools/parameters';

  const dynamodbProvider = new DynamoDBProvider({ tableName: 'my-table' });

	export const handler = async (_event, _context): Promise<void> => {
		// Retrieve a value from DynamoDB
		const value = dynamodbProvider.get('my-parameter');
	```

=== "DynamoDB Local example"
	You can initialize the DynamoDB provider pointing to [DynamoDB Local](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html) using the `endpoint` field in the `clientConfig` parameter:

	```typescript hl_lines="3"
	import { DynamoDBProvider } from '@aws-lambda-powertools/parameters';

  const dynamodbProvider = new DynamoDBProvider({
    tableName: 'my-table',
    clientConfig: {
      endpoint: 'http://localhost:8000'
    }
  });
	```

**DynamoDB table structure for multiple values parameters**

You can retrieve multiple parameters sharing the same `id` by having a sort key named `sk`.

???+ example

	DynamoDB table with `id` primary key, `sk` as sort key` and `value` as attribute

 | id          | sk      | value      |
 | ----------- | ------- | ---------- |
 | my-hash-key | param-a | my-value-a |
 | my-hash-key | param-b | my-value-b |
 | my-hash-key | param-c | my-value-c |

With this table, `dynamodbProvider.getMultiple('my-hash-key')` will return a dictionary response in the shape of `sk:value`.

=== "index.ts"
	```typescript hl_lines="3 8"
	import { DynamoDBProvider } from '@aws-lambda-powertools/parameters';

	const dynamodbProvider = new DynamoDBProvider({ tableName: 'my-table' });

	export const handler = async (_event, _context): Promise<void> => {
		// Retrieve multiple values by performing a Query on the DynamoDB table
		// This returns a dict with the sort key attribute as dict key.
		const parameters = dynamodbProvider.getMultiple('my-hash-key');
    for (const [ key, value ] of Object.entries(values)) {
        // key: param-a
        // value: my-value-a
        console.log(`${key}: ${value}`);
    }
	```

=== "parameters dict response"

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
| **tableName** | **Yes**   | *(N/A)* | Name of the DynamoDB table containing the parameter values.                                               |
| **keyAttr**   | No        | `id`    | Hash key for the DynamoDB table.                                                                          |
| **sortAttr**  | No        | `sk`    | Range key for the DynamoDB table. You don't need to set this if you don't use the `getMultiple()` method. |
| **valueAttr** | No        | `value` | Name of the attribute containing the parameter value.                                                     |

```typescript hl_lines="3-8" title="Customizing DynamoDBProvider to suit your table design"
import { DynamoDBProvider } from '@aws-lambda-powertools/parameters';

const dynamodbProvider = new DynamoDBProvider(
	tableName='my-table',
	keyAttr='MyKeyAttr',
	sortAttr='MySortAttr',
	valueAttr='MyvalueAttr'
)

export const handler = async (_event, _context): Promise<void> => {
	const value = dynamodbProvider.get('my-parameter')
```

### Deserializing values with transform parameter

For parameters stored in JSON or Base64 format, you can use the `transform` argument for deserialization.

???+ info
    The `transform` argument is available across all providers, including the high level functions.

=== "High level functions"

    ```typescript hl_lines="4"
    import { getParameter } from '@aws-lambda-powertools/parameters';

    export const handler = async (_event, _context): Promise<void> => {
        const valueFromJson = getParameter('/my/json/parameter', { transform: 'json' });
		};
    ```

=== "Providers"

    ```typescript hl_lines="7 10"
		import { SSMProvider } from '@aws-lambda-powertools/parameters';

		const parameters = new SSMProvider();

		export const handler = async (_event, _context): Promise<void> => {
				// Transform a JSON string
		    const valueFromJson = parameters.get('/my/json/parameter', { transform: 'json' });

				// Transform a Base64 encoded string
				const valueFromBinary = parameters.getMultiple('/my/binary/parameter', { transform: 'binary' });
		};
    ```

#### Partial transform failures with `getMultiple()`

If you use `transform` with `getMultiple()`, you can have a single malformed parameter value. To prevent failing the entire request, the method will return an `undefined` value for the parameters that failed to transform.

You can override this by setting the `throwOnTransformError` argument to `true`. If you do so, a single transform error will throw a **`TransformParameterError`** error.

For example, if you have three parameters, */param/a*, */param/b* and */param/c*, but */param/c* is malformed:

```typescript hl_lines="10 19" title="Throwing TransformParameterError at first malformed parameter"
import { SSMProvider } from '@aws-lambda-powertools/parameters';

const parameters = new SSMProvider();

export const handler = async (_event, _context): Promise<void> => {
	  /**
		 * This will display:
	   * /param/a: [some value]
	   * /param/b: [some value]
	   * /param/c: undefined
		 */
	  const values = parameters.getMultiple('/param', { transform: 'json' });
	  for (const [ key, value ] of Object.entries(values)) {
        console.log(`${key}: ${value}`);
    }

	  try {
		  // This will throw a TransformParameterError
		  const values = parameters.getMultiple('/param', { transform: 'json', throwOnTransformError: true });
	  } catch (err) {
		  //...
	  }
};
```

#### Auto-transform values on suffix

If you use `transform` with `getMultiple()`, you might want to retrieve and transform parameters encoded in different formats.

You can do this with a single request by using `transform: 'auto'`. This will instruct any Parameter to to infer its type based on the suffix and transform it accordingly.

???+ info
    `transform: 'auto'` feature is available across all providers, including the high level functions.

```typescript hl_lines="6" title="Deserializing parameter values based on their suffix"
import { SSMProvider } from '@aws-lambda-powertools/parameters';

const parameters = new SSMProvider();

export const handler = async (_event, _context): Promise<void> => {
		const values = parameters.getMultiple('/param', { transform: 'auto' });
};
```

For example, if you have two parameters with the following suffixes `.json` and `.binary`:

| Parameter name  | Parameter value      |
| --------------- | -------------------- |
| /param/a.json   | [some encoded value] |
| /param/a.binary | [some encoded value] |

The return of `parameters.getMultiple('/param', transform: 'auto');` call will be an object like:

```json
{
    "a.json": [some value],
    "b.binary": [some value]
}
```

### Passing additional SDK arguments

You can use arbitrary keyword arguments to pass it directly to the underlying SDK method.

```typescript hl_lines="8 12" title="Specify a VersionId for a secret"
import { SecretsProvider } from '@aws-lambda-powertools/parameters';
import type { GetSecretValueCommandInput } from '@aws-sdk/client-secrets-manager';

const secrets = new SecretsProvider();

export const handler = async (_event, _context): Promise<void> => {
		const sdkOptions: GetSecretValueCommandInput = {
      VersionId: 'e62ec170-6b01-48c7-94f3-d7497851a8d2'
    };
	  // The 'VersionId' argument will be passed to the underlying
    // `GetSecretValueCommand` call.
	  const value = secrets.get('my-secret', { sdkOptions });
};
```

Here is the mapping between this utility's functions and methods and the underlying SDK:

| Provider            | Function/Method                | Client name                       | Function name                                                                                                                                     |
| ------------------- | ------------------------------ | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| SSM Parameter Store | `getParameter`                 | `@aws-sdk/client-ssm`             | [GetParameterCommand](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-ssm/classes/getparametercommand.html)                 |
| SSM Parameter Store | `getParameters`                | `@aws-sdk/client-ssm`             | [GetParametersByPathCommand](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-ssm/classes/getparametersbypathcommand.html)   |
| SSM Parameter Store | `SSMProvider.get`              | `@aws-sdk/client-ssm`             | [GetParameterCommand](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-ssm/classes/getparametercommand.html)                 |
| SSM Parameter Store | `SSMProvider.getMultiple`      | `@aws-sdk/client-ssm`             | [GetParametersByPathCommand](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-ssm/classes/getparametersbypathcommand.html)   |
| Secrets Manager     | `getSecret`                    | `@aws-sdk/client-secrets-manager` | [GetSecretValueCommand](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-secrets-manager/classes/getsecretvaluecommand.html) |
| Secrets Manager     | `SecretsProvider.get`          | `@aws-sdk/client-secrets-manager` | [GetSecretValueCommand](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-secrets-manager/classes/getsecretvaluecommand.html) |
| DynamoDB            | `DynamoDBProvider.get`         | `@aws-sdk/client-dynamodb`        | [GetItemCommand](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/classes/getitemcommand.html)                      |
| DynamoDB            | `DynamoDBProvider.getMultiple` | `@aws-sdk/client-dynamodb`        | [QueryCommand](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/classes/querycommand.html)                          |
| App Config          | `getAppConfig`                 | `@aws-sdk/client-appconfig`       | [GetConfigurationCommand](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-appconfig/classes/getconfigurationcommand.html)   |

### Bring your own AWS SDK v3 client

You can use `awsSdkV3Client` parameter via any of the available [Provider Classes](#built-in-provider-class).

| Provider                                | Client                        |
| --------------------------------------- | ----------------------------- |
| [SSMProvider](#ssmprovider)             | `new SSMClient();`            |
| [SecretsProvider](#secretsprovider)     | `new SecretsManagerClient();` |
| [AppConfigProvider](#appconfigprovider) | `new AppConfigDataClient();`  |
| [DynamoDBProvider](#dynamodbprovider)   | `new DynamoDBClient();`       |

Bringing them together in a single code snippet would look like this:

```typescript title="Example: passing a custom boto3 client for each provider"
import { SSMProvider, SecretsProvider, DynamoDBProvider, AppConfigProvider } from '@aws-lambda-powertools/parameters';
import { SSMClient } from '@aws-sdk/client-ssm';
import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { AppConfigClient } from '@aws-sdk/client-appconfig';

// construct the clients with any custom configuration
const ssm = new SSMClient({ region: 'us-east-1' });
const secretsManager = new SecretsManagerClient({ region: 'us-west-2' });
const dynamodb = new DynamoDBClient({ region: 'eu-west-1' });
const appConfig = new AppConfigClient({ region: 'eu-south-2' });

const parameters = new SSMProvider({ awsSdkV3Client: ssm });
const secrets = new SecretsProvider({ awsSdkV3Client: secretsManager });
const dynamodbProvider = new DynamoDBProvider({ awsSdkV3Client: dynamodb, tableName: 'my-table' });
const appConfigProvider = new AppConfigProvider({ awsSdkV3Client: appConfig, environment: 'my-env', application: 'my-app' });
```

???+ question "When is this useful?"
	Injecting a custom AWS SDK v3 client can make unit/snapshot testing easier, including SDK customizations.

### Customizing AWS SDK v3 configuration

The **`clientConfig`** parameter enables you to pass in a custom [config object](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/configuring-the-jssdk.html) when constructing any of the built-in provider classes.

???+ tip
	You can use a custom session for retrieving parameters cross-account/region and for snapshot testing.

	When using VPC private endpoints, you can pass a custom client altogether. It's also useful for testing when injecting fake instances.


```typescript hl_lines="2 4 5"
import { SSMProvider } from '@aws-lambda-powertools/parameters';
import type { SSMClientConfig } from '@aws-sdk/client-ssm';

const clientConfig: SSMClientConfig = { region: 'us-east-1' };
const parameters = new SSMProvider({ clientConfig });

export const handler = async (_event, _context): Promise<void> => {
	  // Retrieve a single parameter
	  const value = parameters.get('/my/parameter');
};
```
