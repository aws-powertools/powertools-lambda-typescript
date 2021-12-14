# `tracer`

## Usage

```bash

npm run test

npm run example:hello-world
npm run example:capture-lambda-handler-response-decorator
npm run example:capture-lambda-handler-error-decorator

```

### Getting started

```typescript
// Import the library
import { Tracer } from "../src";
// When going public, it will be something like: import { Tracer } from '@aws-lambda-powertools/tracer';

// Environment variables set for the Lambda
process.env.POWERTOOLS_TRACE_ENABLED = "true";
process.env.POWERTOOLS_SERVICE_NAME = "hello-world";
process.env.POWERTOOLS_TRACER_CAPTURE_RESPONSE = "true";
process.env.POWERTOOLS_TRACER_CAPTURE_ERROR = "true";

// Instantiate the Tracer with default configuration
const tracer = new Tracer();
```

### Capturing Lambda handler

```typescript
// Environment variables set for the Lambda
process.env.POWERTOOLS_SERVICE_NAME = 'hello-world';

const tracer = new Tracer();

class Lambda implements LambdaInterface {

  @tracer.captureLambdaHanlder()
  public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | Promise<TResult> {
    return new Promise((resolve, _reject) => resolve({
      foo: 'bar'
    } as unknown as TResult));
  }

}

new Lambda().handler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));

```

<details>
 <summary>Click to expand and see the trace</summary>

```json
{
    "Id": "abcdef123456abcdef123456abcdef123456",
    "Duration": 0.656,
    "LimitExceeded": false,
    "Segments": [
        {
            "Id": "1234567890abcdef0",
            "Document": {
                "id": "1234567890abcdef0",
                "name": "foo-bar-function",
                "start_time": 1638792392.764036,
                "trace_id": "abcdef123456abcdef123456abcdef123456",
                "end_time": 1638792392.957155,
                "parent_id": "abcdef01234567890",
                "aws": {
                    "account_id": "111122223333",
                    "function_arn": "arn:aws:lambda:us-east-1:111122223333:function:foo-bar-function",
                    "resource_names": [
                        "foo-bar-function"
                    ]
                },
                "origin": "AWS::Lambda::Function",
                "subsegments": [
                    // Initialization subsegment (if any)
                    {
                        "id": "4be0933d48d5b52f",
                        "name": "Invocation",
                        "start_time": 1638792392.7642102,
                        "end_time": 1638792392.9384046,
                        "aws": {
                            "function_arn": "arn:aws:lambda:eu-west-1:111122223333:function:foo-bar-function"
                        },
                        "subsegments": [
                            {
                                "id": "aae0c94a16d66abd",
                                "name": "## foo-bar-function",
                                "start_time": 1638792392.766,
                                "end_time": 1638792392.836,
                                "annotations": {
                                    "ColdStart": true
                                },
                                "metadata": {
                                    "hello-world": {
                                        "foo-bar-function response": {
                                            "foo": "bar"
                                        }
                                    }
                                }
                            }
                        ]
                    },
                    // Overhead subsegment (if any)
                ]
            }
        }
    ]
}

```
</details>

**With Error**
```typescript
// Environment variables set for the Lambda
process.env.POWERTOOLS_SERVICE_NAME = 'hello-world';

const tracer = new Tracer();

class Lambda implements LambdaInterface {

  @tracer.captureLambdaHanlder()
  public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | Promise<TResult> {
    // Some logic that throws an error
    throw Error('Some error occurred')
  }

}

new Lambda().handler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));

```

<details>
 <summary>Click to expand and see the trace</summary>

```json
{
    "Id": "abcdef123456abcdef123456abcdef123456",
    "Duration": 0.656,
    "LimitExceeded": false,
    "Segments": [
        {
            "Id": "1234567890abcdef0",
            "Document": {
                "id": "1234567890abcdef0",
                "name": "foo-bar-function",
                "start_time": 1638792392.764036,
                "trace_id": "abcdef123456abcdef123456abcdef123456",
                "end_time": 1638792392.957155,
                "parent_id": "abcdef01234567890",
                "aws": {
                    "account_id": "111122223333",
                    "function_arn": "arn:aws:lambda:us-east-1:111122223333:function:foo-bar-function",
                    "resource_names": [
                        "foo-bar-function"
                    ]
                },
                "origin": "AWS::Lambda::Function",
                "subsegments": [
                    // Initialization subsegment (if any)
                    {
                        "id": "4be0933d48d5b52f",
                        "name": "Invocation",
                        "start_time": 1638792392.7642102,
                        "end_time": 1638792392.9384046,
                        "aws": {
                            "function_arn": "arn:aws:lambda:eu-west-1:111122223333:function:foo-bar-function"
                        },
                        "subsegments": [
                            {
                                "id": "aae0c94a16d66abd",
                                "name": "## foo-bar-function",
                                "start_time": 1638792392.766,
                                "end_time": 1638792392.836,
                                "fault": true,
                                "cause": {
                                    "working_directory": "/var/task",
                                    "exceptions": [
                                        {
                                            "message": "Some error occurred",
                                            "type": "Error",
                                            "remote": false,
                                            "stack": [
                                                {
                                                    "path": "/var/task/index.js",
                                                    "line": 51489,
                                                    "label": "Tracer2.handler"
                                                },
                                                {
                                                    "path": "/var/task/index.js",
                                                    "line": 16372,
                                                    "label": "anonymous"
                                                },
                                                // Full stack trace
                                            ]
                                        }
                                    ]
                                }
                            }
                        ]
                    },
                    // Overhead subsegment (if any)
                ]
            }
        }
    ]
}

```
</details>

### Adding annotation on subsegment

```typescript
// Environment variables set for the Lambda
process.env.POWERTOOLS_SERVICE_NAME = 'hello-world';

const tracer = new Tracer();

class Lambda implements LambdaInterface {

  @tracer.captureLambdaHanlder()
  public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | Promise<TResult> {

    tracer.putAnnotation("my-annotation", "my-value");

    return new Promise((resolve, _reject) => resolve({
      foo: 'bar'
    } as unknown as TResult));
  }

}

new Lambda().handler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));

```

<details>
 <summary>Click to expand and see the trace</summary>

```json
{
    "Id": "abcdef123456abcdef123456abcdef123456",
    "Duration": 0.656,
    "LimitExceeded": false,
    "Segments": [
        {
            "Id": "1234567890abcdef0",
            "Document": {
                "id": "1234567890abcdef0",
                "name": "foo-bar-function",
                "start_time": 1638792392.764036,
                "trace_id": "abcdef123456abcdef123456abcdef123456",
                "end_time": 1638792392.957155,
                "parent_id": "abcdef01234567890",
                "aws": {
                    "account_id": "111122223333",
                    "function_arn": "arn:aws:lambda:us-east-1:111122223333:function:foo-bar-function",
                    "resource_names": [
                        "foo-bar-function"
                    ]
                },
                "origin": "AWS::Lambda::Function",
                "subsegments": [
                    // Initialization subsegment (if any)
                    {
                        "id": "4be0933d48d5b52f",
                        "name": "Invocation",
                        "start_time": 1638792392.7642102,
                        "end_time": 1638792392.9384046,
                        "aws": {
                            "function_arn": "arn:aws:lambda:eu-west-1:111122223333:function:foo-bar-function"
                        },
                        "subsegments": [
                            {
                                "id": "aae0c94a16d66abd",
                                "name": "## foo-bar-function",
                                "start_time": 1638792392.766,
                                "end_time": 1638792392.836,
                                "annotations": {
                                    "ColdStart": true,
                                    "my-annotation": "my-value"
                                },
                                "metadata": {
                                    "hello-world": {
                                        "foo-bar-function response": {
                                            "foo": "bar"
                                        }
                                    }
                                }
                            }
                        ]
                    },
                    // Overhead subsegment (if any)
                ]
            }
        }
    ]
}

```
</details>

### Adding metadata to subsegment

```typescript
// Environment variables set for the Lambda
process.env.POWERTOOLS_SERVICE_NAME = 'hello-world';

const tracer = new Tracer();

class Lambda implements LambdaInterface {

  @tracer.captureLambdaHanlder()
  public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | Promise<TResult> {

    tracer.putMetadata("my-metadata", 1234);
    tracer.putMetadata("my-scoped-metadata", 1234, "my-namespace");

    return new Promise((resolve, _reject) => resolve({
      foo: 'bar'
    } as unknown as TResult));
  }

}

new Lambda().handler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));

```

<details>
 <summary>Click to expand and see the trace</summary>

```json
{
    "Id": "abcdef123456abcdef123456abcdef123456",
    "Duration": 0.656,
    "LimitExceeded": false,
    "Segments": [
        {
            "Id": "1234567890abcdef0",
            "Document": {
                "id": "1234567890abcdef0",
                "name": "foo-bar-function",
                "start_time": 1638792392.764036,
                "trace_id": "abcdef123456abcdef123456abcdef123456",
                "end_time": 1638792392.957155,
                "parent_id": "abcdef01234567890",
                "aws": {
                    "account_id": "111122223333",
                    "function_arn": "arn:aws:lambda:us-east-1:111122223333:function:foo-bar-function",
                    "resource_names": [
                        "foo-bar-function"
                    ]
                },
                "origin": "AWS::Lambda::Function",
                "subsegments": [
                    // Initialization subsegment (if any)
                    {
                        "id": "4be0933d48d5b52f",
                        "name": "Invocation",
                        "start_time": 1638792392.7642102,
                        "end_time": 1638792392.9384046,
                        "aws": {
                            "function_arn": "arn:aws:lambda:eu-west-1:111122223333:function:foo-bar-function"
                        },
                        "subsegments": [
                            {
                                "id": "aae0c94a16d66abd",
                                "name": "## foo-bar-function",
                                "start_time": 1638792392.766,
                                "end_time": 1638792392.836,
                                "annotations": {
                                    "ColdStart": true
                                },
                                "metadata": {
                                    "hello-world": {
                                        "foo-bar-function response": {
                                            "foo": "bar"
                                        },
                                        "my-metadata": 1234
                                    },
                                    "my-namespace": {
                                        "my-scoped-metadata": 1234
                                    }
                                }
                            }
                        ]
                    },
                    // Overhead subsegment (if any)
                ]
            }
        }
    ]
}

```
</details>

### Capturing other methods

```typescript
// Environment variables set for the Lambda
process.env.POWERTOOLS_SERVICE_NAME = 'hello-world';

const tracer = new Tracer();

class Lambda implements LambdaInterface {
  @tracer.captureMethod()
  public async dummyMethod(some: string): Promise<string> {
      // Some async logic
      return new Promise((resolve, _reject) => setTimeout(() => resolve(some), 3000));
  }

  public async handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): Promise<TResult> {
    const result = await this.dummyMethod('bar');
    
    return new Promise((resolve, _reject) => resolve({
      foo: result
    } as unknown as TResult));
  }

}

new Lambda().handler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));

```

<details>
 <summary>Click to expand and see the trace</summary>

```json
{
    "Id": "abcdef123456abcdef123456abcdef123456",
    "Duration": 0.656,
    "LimitExceeded": false,
    "Segments": [
        {
            "Id": "1234567890abcdef0",
            "Document": {
                "id": "1234567890abcdef0",
                "name": "foo-bar-function",
                "start_time": 1638792392.764036,
                "trace_id": "abcdef123456abcdef123456abcdef123456",
                "end_time": 1638792392.957155,
                "parent_id": "abcdef01234567890",
                "aws": {
                    "account_id": "111122223333",
                    "function_arn": "arn:aws:lambda:us-east-1:111122223333:function:foo-bar-function",
                    "resource_names": [
                        "foo-bar-function"
                    ]
                },
                "origin": "AWS::Lambda::Function",
                "subsegments": [
                    // Initialization subsegment (if any)
                    {
                        "id": "4be0933d48d5b52f",
                        "name": "Invocation",
                        "start_time": 1638792392.7642102,
                        "end_time": 1638792392.9384046,
                        "aws": {
                            "function_arn": "arn:aws:lambda:eu-west-1:111122223333:function:foo-bar-function"
                        },
                        "subsegments": [
                            {
                                "id": "aae0c94a16d66abd",
                                "name": "## foo-bar-function",
                                "start_time": 1638792392.766,
                                "end_time": 1638792392.836,
                                "annotations": {
                                    "ColdStart": true
                                },
                                "subsegments": [
                                    {
                                        "id": "b1ac78c231577476",
                                        "name": "### dummyMethod",
                                        "start_time": 1638845552.777,
                                        "end_time": 1638845553.459,
                                        "metadata": {
                                            "hello-world": {
                                                "dummyMethod response": "bar"
                                            }
                                            // Other metadata (if any)
                                        }
                                        // Annotations (if any)
                                        // Other subsegments (if any)
                                    }
                                ]
                            }
                        ]
                    },
                    // Overhead subsegment (if any)
                ]
            }
        }
    ]
}

```
</details>

### Capturing AWS SDK clients

**AWS SDK JS v3**
```typescript
// AWS SDK JS v3
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
// Environment variables set for the Lambda
process.env.POWERTOOLS_SERVICE_NAME = 'hello-world';

const tracer = new Tracer();
const client = new S3Client({});
tracer.captureAWSv3Client(client);

class Lambda implements LambdaInterface {

  @tracer.captureLambdaHanlder()
  public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | Promise<TResult> {

    const command = new ListObjectsV2Command({
      Bucket: process.env.BUCKET_NAME,
    });

    return client
      .send(command)
      .then((data) => {
        // Do something with data

        return {
          foo: "bar",
        } as unknown as TResult;
      })
      .catch((error) => {
        logger.error("Error from action", error);
      });
  }

}

new Lambda().handler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));

```

**AWS SDK JS v2 (specific client)**

```typescript
// AWS SDK JS v2
import { S3 } from "aws-sdk";
// Environment variables set for the Lambda
process.env.POWERTOOLS_SERVICE_NAME = 'hello-world';

const tracer = new Tracer();
const client = tracer.captureAWSClient(new S3({ apiVersion: "2006-03-01" }));

class Lambda implements LambdaInterface {

  @tracer.captureLambdaHanlder()
  public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | Promise<TResult> {

    return s3
      .listObjectsV2({
        Bucket: process.env.BUCKET_NAME || "",
      })
      .promise()
      .then((data) => {
        // Do something with data

        return {
          foo: "bar",
        } as unknown as TResult;
      })
      .catch((error) => {
        logger.error("Error from action", error);
      });
  }

}

new Lambda().handler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));

```

**AWS SDK JS v2 (all clients)**

```typescript
// Environment variables set for the Lambda
process.env.POWERTOOLS_SERVICE_NAME = 'hello-world';

const tracer = new Tracer();
// Capture all AWS SDK clients
const AWS = tracer.captureAWS(require('aws-sdk'));
const s3 = new AWS.S3({ apiVersion: "2006-03-01" });

class Lambda implements LambdaInterface {

  @tracer.captureLambdaHanlder()
  public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | Promise<TResult> {

    return s3
      .listObjectsV2({
        Bucket: process.env.BUCKET_NAME || "",
      })
      .promise()
      .then((data: unknown) => {
        // Do something with data

        return {
          foo: "bar",
        } as unknown as TResult;
      })
      .catch((error: Error) => {
        logger.error("Error from action", error);
      });
  }

}

new Lambda().handler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));

```

<details>
 <summary>Click to expand and see the trace</summary>

```json
{
    "Id": "abcdef123456abcdef123456abcdef123456",
    "Duration": 0.656,
    "LimitExceeded": false,
    "Segments": [
        {
            "Id": "1234567890abcdef0",
            "Document": {
                "id": "1234567890abcdef0",
                "name": "foo-bar-function",
                "start_time": 1638792392.764036,
                "trace_id": "abcdef123456abcdef123456abcdef123456",
                "end_time": 1638792392.957155,
                "parent_id": "abcdef01234567890",
                "aws": {
                    "account_id": "111122223333",
                    "function_arn": "arn:aws:lambda:us-east-1:111122223333:function:foo-bar-function",
                    "resource_names": [
                        "foo-bar-function"
                    ]
                },
                "origin": "AWS::Lambda::Function",
                "subsegments": [
                    // Initialization subsegment (if any)
                    {
                        "id": "4be0933d48d5b52f",
                        "name": "Invocation",
                        "start_time": 1638792392.7642102,
                        "end_time": 1638792392.9384046,
                        "aws": {
                            "function_arn": "arn:aws:lambda:eu-west-1:111122223333:function:foo-bar-function"
                        },
                        "metadata": {
                            // Handler segment metadata
                        },
                        "subsegments": [
                            {
                                "id": "aae0c94a16d66abd",
                                "name": "## foo-bar-function",
                                "start_time": 1638792392.766,
                                "end_time": 1638792392.836,
                                "http": {
                                    "response": {
                                        "status": 200
                                    }
                                },
                                "aws": {
                                    "retries": 1,
                                    "region": "eu-west-1",
                                    "operation": "ListObjectsV2",
                                    "id_2": "mmG8kljASOkl9t5TsBd4D//U5W7Dr1ZrLWEsajtNMqY+VGLFDp0OHpYLz670ETOBPWERFyYh2w0="
                                },
                                "namespace": "aws"
                            }
                        ]
                    },
                    // Overhead subsegment (if any)
                ]
            }
        },
        {
            "Id": "021345abcdef6789",
            "Document": {
                "id": "021345abcdef6789",
                "name": "foo-bar-function",
                "start_time": 1638800791.846,
                "trace_id": "abcdef123456abcdef123456abcdef123456",
                "end_time": 1638800793.349,
                "http": {
                    "response": {
                        "status": 200
                    }
                },
                "aws": {
                    "request_id": "27df07c5-1c35-42eb-ae6f-55193c404205"
                },
                "origin": "AWS::Lambda",
                "resource_arn": "arn:aws:lambda:eu-west-1:111122223333:function:foo-bar-function"
            }
        },
        {
            "Id": "117e4d4e091318a3",
            "Document": {
                "id": "117e4d4e091318a3",
                "name": "S3",
                "start_time": 1638800792.61,
                "trace_id": "abcdef123456abcdef123456abcdef123456",
                "end_time": 1638800793.247,
                "parent_id": "1234567890abcdef0",
                "inferred": true,
                "http": {
                    "response": {
                        "status": 200
                    }
                },
                "aws": {
                    "retries": 1,
                    "region": "eu-west-1",
                    "operation": "ListObjectsV2",
                    "id_2": "mmG8kljASOkl9t5TsBd4D//U5W7Dr1ZrLWEsajtNMqY+VGLFDp0OHpYLz670ETOBPWERFyYh2w0="
                },
                "origin": "AWS::S3"
            }
        }
    ]
}

```
</details>

### Disabling capture response body

```typescript
// Environment variables set for the Lambda
process.env.POWERTOOLS_SERVICE_NAME = 'hello-world';
process.env.POWERTOOLS_TRACER_CAPTURE_RESPONSE = 'false';

const tracer = new Tracer();

class Lambda implements LambdaInterface {

  @tracer.captureLambdaHanlder()
  public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | Promise<TResult> {

    return new Promise((resolve, _reject) => resolve({
      foo: 'bar'
    } as unknown as TResult));
  }

}

new Lambda().handler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));

```

<details>
 <summary>Click to expand and see the trace</summary>

```json
{
    "Id": "abcdef123456abcdef123456abcdef123456",
    "Duration": 0.656,
    "LimitExceeded": false,
    "Segments": [
        {
            "Id": "1234567890abcdef0",
            "Document": {
                "id": "1234567890abcdef0",
                "name": "foo-bar-function",
                "start_time": 1638792392.764036,
                "trace_id": "abcdef123456abcdef123456abcdef123456",
                "end_time": 1638792392.957155,
                "parent_id": "abcdef01234567890",
                "aws": {
                    "account_id": "111122223333",
                    "function_arn": "arn:aws:lambda:us-east-1:111122223333:function:foo-bar-function",
                    "resource_names": [
                        "foo-bar-function"
                    ]
                },
                "origin": "AWS::Lambda::Function",
                "subsegments": [
                    // Initialization subsegment (if any)
                    {
                        "id": "4be0933d48d5b52f",
                        "name": "Invocation",
                        "start_time": 1638792392.7642102,
                        "end_time": 1638792392.9384046,
                        "aws": {
                            "function_arn": "arn:aws:lambda:eu-west-1:111122223333:function:foo-bar-function"
                        }
                        // Annotations (if any)
                        // Other metadata (if any)
                    },
                    // Overhead subsegment (if any)
                ]
            }
        }
    ]
}

```
</details>

### Disabling capture error

```typescript
// Environment variables set for the Lambda
process.env.POWERTOOLS_TRACER_CAPTURE_ERROR = "false";
process.env.POWERTOOLS_SERVICE_NAME = 'hello-world';

const tracer = new Tracer();

class Lambda implements LambdaInterface {

  @tracer.captureLambdaHanlder()
  public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | Promise<TResult> {
    // Some logic that throws an error
    throw Error('Some error occurred')
  }

}

new Lambda().handler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));

```

<details>
 <summary>Click to expand and see the trace</summary>

```json
{
    "Id": "abcdef123456abcdef123456abcdef123456",
    "Duration": 0.656,
    "LimitExceeded": false,
    "Segments": [
        {
            "Id": "1234567890abcdef0",
            "Document": {
                "id": "1234567890abcdef0",
                "name": "foo-bar-function",
                "start_time": 1638792392.764036,
                "trace_id": "abcdef123456abcdef123456abcdef123456",
                "end_time": 1638792392.957155,
                "parent_id": "abcdef01234567890",
                "aws": {
                    "account_id": "111122223333",
                    "function_arn": "arn:aws:lambda:us-east-1:111122223333:function:foo-bar-function",
                    "resource_names": [
                        "foo-bar-function"
                    ]
                },
                "origin": "AWS::Lambda::Function",
                "subsegments": [
                    // Initialization subsegment (if any)
                    {
                        "id": "4be0933d48d5b52f",
                        "name": "Invocation",
                        "start_time": 1638792392.7642102,
                        "end_time": 1638792392.9384046,
                        "aws": {
                            "function_arn": "arn:aws:lambda:eu-west-1:111122223333:function:foo-bar-function"
                        },
                        "error": true,
                        // Annotations (if any)
                        // Other metadata (if any)
                    },
                    // Overhead subsegment (if any)
                ]
            }
        }
    ]
}

```
</details>

## Constructor options

```typescript

const tracer = new Tracer({
  enabled: true,
  serviceName: 'hello-world'
});

class Lambda implements LambdaInterface {

  @tracer.captureLambdaHanlder()
  public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | Promise<TResult> {
    return new Promise((resolve, _reject) => resolve({
      foo: 'bar'
    } as unknown as TResult));
  }

}

new Lambda().handler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));

```

<details>
 <summary>Click to expand and see the logs outputs</summary>

```bash

{
  level: 'INFO',
  message: 'This is an INFO log',
  sampling_rate: 0.5,
  service: 'hello-world',
  timestamp: '2021-03-25T09:59:31.252Z',
  xray_trace_id: 'abcdef123456abcdef123456abcdef123456',
  awsAccountId: '123456789012',
  logger: { name: 'aws-lambda-powertools-typescript', version: '0.0.1' },
  correlationIds: { myCustomCorrelationId: 'foo-bar-baz' }
}

```

</details>