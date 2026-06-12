---
title: Signer
descrition: Utility
---

<!-- markdownlint-disable MD043 --->

This utility provides a way to sign HTTP requests to AWS services using the [AWS Signature Version 4 (SigV4)](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_sigv4_signing.html){target="_blank"} signing process, so you can call IAM-authenticated endpoints such as Amazon API Gateway, AWS Lambda function URLs, or AWS AppSync from within your Lambda functions.

## Key features

* Sign web-standard `Request` objects with AWS Signature Version 4
* Drop-in signed `fetch` for sending signed requests in one step
* Works with any HTTP client by exposing the signed request and headers
* Reads credentials and region from the Lambda runtime by default, with no extra dependencies

## Getting started

```bash
npm install @aws-lambda-powertools/signer
```

The signer takes a web-standard [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request){target="_blank"} (or anything you can pass to `fetch`, like a URL string) and returns a new, signed `Request` with the SigV4 headers added. It performs no network I/O, so you stay in control of how the request is sent.

```typescript hl_lines="1 3 7"
--8<-- "examples/snippets/signer/gettingStarted.ts"
```

By default, the signer reads the AWS credentials and region from the [environment variables](https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars.html#configuration-envvars-runtime){target="_blank"} that the Lambda runtime always provides, so no additional configuration is required when running in Lambda.

!!! note "The `service` is required"
    The service name (for example `execute-api`, `lambda`, or `appsync`) cannot be reliably determined from the request URL, since custom domains and Amazon CloudFront hide the underlying service. You must always provide it.

## Sending signed requests

If all you want is to sign and immediately send the request, use `createSignedFetcher`. It consumes a signer instance and returns a function with the same signature as the global `fetch`, signing each request before sending it.

```typescript hl_lines="1 2 5"
--8<-- "examples/snippets/signer/fetcher.ts"
```

Because the returned function is a drop-in `fetch`, you can also pass it to libraries that accept a custom `fetch` implementation.

## Using other HTTP clients

Signing and sending are deliberately kept separate, so you can use the signed request with any HTTP client (for example `axios`, `got`, a generated SDK client, or a request interceptor). Call `sign()` to obtain a signed `Request`, then read its `url`, `method`, and `headers`.

```typescript hl_lines="11-15"
--8<-- "examples/snippets/signer/headers.ts"
```

## Advanced

### Configuring the region

The region defaults to the `AWS_REGION` environment variable that Lambda sets. You can override it, for example to sign requests for a service in a different region.

```typescript hl_lines="5"
--8<-- "examples/snippets/signer/region.ts"
```

1. The `region` option takes precedence over the `AWS_REGION` environment variable.

### Configuring credentials

When running outside of Lambda, the standard AWS credentials environment variables may not be set. In that case, pass your own credentials or a credential provider, such as `fromNodeProviderChain()` from [`@aws-sdk/credential-provider-node`](https://www.npmjs.com/package/@aws-sdk/credential-provider-node){target="_blank"}, which you install yourself.

```typescript hl_lines="6-12"
--8<-- "examples/snippets/signer/credentials.ts"
```

### Handling errors

The signer throws typed errors that all extend `SignerError`:

| Error                 | When it is thrown                                                                                          |
| --------------------- | ---------------------------------------------------------------------------------------------------------- |
| `SignerConfigError`   | The region cannot be determined (at construction), or credentials are missing or cannot be resolved.       |
| `RequestSigningError` | Signing the request fails, for example because the request body cannot be read or replayed.                |
| `SignerError`         | Base class for the errors above. Catch this to handle any signer error.                                    |

You can import them from the `@aws-lambda-powertools/signer/errors` subpath.

!!! note "Request bodies"
    To compute the request signature, the request body is buffered and hashed. Strings, buffers, and finite streams are handled transparently. A body that cannot be read or replayed — for example a stream that errors mid-read — cannot be signed and raises a `RequestSigningError`.
