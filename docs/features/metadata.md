---
title: Metadata
description: Utility to fetch data from the AWS Lambda Metadata endpoint
status: new
---

<!-- markdownlint-disable MD043 -->
The Metadata utility allows you to fetch data from the AWS Lambda Metadata Endpoint (LMDS). This can be useful for retrieving information about the Lambda function, such as the Availability Zone ID.

## Getting started

### Installation

Add the library to your project:

```shell
npm install @aws-lambda-powertools/commons
```

### Usage

You can fetch data from the LMDS using the `getMetadata` function. For example, to retrieve the Availability Zone ID:

???+ tip
    Metadata is cached for the duration of the Lambda execution, so subsequent calls to `getMetadata` will return the cached data.

=== "index.ts"

  ```ts hl_lines="1 5 8"
  --8<-- "examples/snippets/commons/metadata.ts"
  ```

### Available metadata

| Property             | Type     | Description                                             |
| -------------------- | -------- | ------------------------------------------------------- |
| `AvailabilityZoneID` | `string` | The AZ where the function is running (e.g., `use1-az1`) |

## Testing your code

The metadata endpoint is not available during local development or testing. To ease testing, the `getMetadata` function automatically detects when it's running in a non-Lambda environment and returns an empty object. This allows you to write tests without needing to mock the LMDS responses.

If instead you want to mock specific metadata values for testing purposes, you can do so by setting environment variables that correspond to the metadata endpoint and authentication token, as well as mocking the `fetch` function to return the desired metadata. Here's an example of how to do this:

=== "index.test.ts"

  ```ts hl_lines="11-14 24-26 35"
  --8<-- "examples/snippets/commons/testingMetadata.ts"
  ```

We also expose a `clearMetadataCache` function that can be used to clear the cached metadata, allowing you to test different metadata values within the same execution context.
