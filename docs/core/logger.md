---
title: Logger
description: Core utility
---

Logger provides an opinionated logger with output structured as JSON.

## Key features

* Capture key fields from Lambda context, cold start and structures logging output as JSON
* Log Lambda event when instructed (disabled by default)
* Log sampling enables DEBUG log level for a percentage of requests (disabled by default)
* Append additional keys to structured log at any point in time

## Getting started

Logger requires two settings:

Setting | Description | Environment variable | Constructor parameter
------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------- | -------------------------------------------------
**Logging level** | Sets how verbose Logger should be (INFO, by default) |  `LOG_LEVEL` | `level`
**Service** | Sets **service** key that will be present across all log statements | `POWERTOOLS_SERVICE_NAME` | `service`

> Example using AWS Serverless Application Model (SAM)

=== "template.yaml"
	```yaml hl_lines="9 10"
    Resources:
      HelloWorldFunction:
        Type: AWS::Serverless::Function
        Properties:
          Runtime: nodejs14.x
          Environment:
            Variables:
              LOG_LEVEL: INFO
              POWERTOOLS_SERVICE_NAME: example
	```
=== "app.py"
	```typescript hl_lines="3 4"
	import { Logger } from '@aws-lambda-powertools/logger';
	
	const logger = Logger(); // Sets service via env var
	// OR const logger = Logger({ service: 'example' });
	```

### Standard structured keys

Your Logger will include the following keys to your structured logging:

Key | Example | Note
------------------------------------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------
**level**: `str` | `INFO` | Logging level
**location**: `str` | `collect.handler:1` | Source code location where statement was executed
**message**: `Any` | `Collecting payment` | Unserializable JSON values are casted as `str`
**timestamp**: `str` | `2021-05-03 10:20:19,650+0200` | Timestamp with milliseconds, by default uses local timezone
**service**: `str` | `payment` | Service name defined, by default `service_undefined`
**xray_trace_id**: `str` | `1-5759e988-bd862e3fe1be46a994272793` | When [tracing is enabled](https://docs.aws.amazon.com/lambda/latest/dg/services-xray.html){target="_blank"}, it shows X-Ray Trace ID
**sampling_rate**: `float` |  `0.1` | When enabled, it shows sampling rate in percentage e.g. 10%
**exception_name**: `str` | `ValueError` | When `logger.exception` is used and there is an exception
**exception**: `str` | `Traceback (most recent call last)..` | When `logger.exception` is used and there is an exception

:construction: WIP :construction:

**How do I aggregate and search Powertools logs across accounts?**

As of now, ElasticSearch (ELK) or 3rd party solutions are best suited to this task.

Please see this discussion for more information: https://github.com/awslabs/aws-lambda-powertools-python/issues/460
