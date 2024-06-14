import { search } from './search.js';
import { PowertoolsFunctions } from './PowertoolsFunctions.js';
import type { JMESPathParsingOptions, JSONObject } from './types.js';

/**
 * Searches and extracts data using JMESPath
 *
 * Envelope being the JMESPath expression to extract the data you're after
 *
 * Built-in JMESPath functions include: `powertools_json`, `powertools_base64`, `powertools_base64_gzip`
 *
 * @example
 * ```typescript
 * import { extractDataFromEnvelope } from '@aws-lambda-powertools/jmespath/envelopes';
 *
 * type CustomEvent = {
 *   body: string; // "{\"customerId\":\"dd4649e6-2484-4993-acb8-0f9123103394\"}"
 * };
 *
 * type EventBody = {
 *   customerId: string;
 * };
 *
 * export const handler = async (event: CustomEvent): Promise<unknown> => {
 *   const payload = extractDataFromEnvelope<EventBody>(event, "powertools_json(body)");
 *   const { customerId } = payload; // now deserialized
 *   // ...
 * };
 * ```
 *
 * We provide built-in envelopes for popular AWS Lambda event sources to easily decode and/or deserialize JSON objects.
 *
 * @example
 * ```typescript
 * import {
 *   extractDataFromEnvelope,
 *   SQS,
 * } from '@aws-lambda-powertools/jmespath/envelopes';
 * import type { SQSEvent } from 'aws-lambda';
 *
 * type MessageBody = {
 *   customerId: string;
 * };
 *
 * export const handler = async (event: SQSEvent): Promise<unknown> => {
 *   const records = extractDataFromEnvelope<Array<MessageBody>>(event, SQS);
 *   for (const record in records) { // records is now a list containing the deserialized body of each message
 *     const { customerId } = record;
 *   }
 * };
 * ```
 *
 * @param data The JSON object to search
 * @param envelope The JMESPath expression to use
 * @param options The parsing options to use
 */
const extractDataFromEnvelope = <T>(
  data: JSONObject,
  envelope: string,
  options?: JMESPathParsingOptions
): T => {
  if (!options) {
    options = { customFunctions: new PowertoolsFunctions() };
  }

  return search(envelope, data, options) as T;
};

const API_GATEWAY_REST = 'powertools_json(body)';
const API_GATEWAY_HTTP = 'powertools_json(body)';
const SQS = 'Records[*].powertools_json(body)';
const SNS = 'Records[0].Sns.Message | powertools_json(@)';
const EVENTBRIDGE = 'detail';
const CLOUDWATCH_EVENTS_SCHEDULED = 'detail';
const KINESIS_DATA_STREAM =
  'Records[*].kinesis.powertools_json(powertools_base64(data))';
const CLOUDWATCH_LOGS =
  'awslogs.powertools_base64_gzip(data) | powertools_json(@).logEvents[*]';
const S3_SNS_SQS =
  'Records[*].powertools_json(body).powertools_json(Message).Records[0]';
const S3_SQS = 'Records[*].powertools_json(body).Records[0]';
const S3_SNS_KINESIS_FIREHOSE =
  'records[*].powertools_json(powertools_base64(data)).powertools_json(Message).Records[0]';
const S3_KINESIS_FIREHOSE =
  'records[*].powertools_json(powertools_base64(data)).Records[0]';
const S3_EVENTBRIDGE_SQS = 'Records[*].powertools_json(body).detail';

export {
  extractDataFromEnvelope,
  API_GATEWAY_REST,
  API_GATEWAY_HTTP,
  SQS,
  SNS,
  EVENTBRIDGE,
  CLOUDWATCH_EVENTS_SCHEDULED,
  KINESIS_DATA_STREAM,
  CLOUDWATCH_LOGS,
  S3_SNS_SQS,
  S3_SQS,
  S3_SNS_KINESIS_FIREHOSE,
  S3_KINESIS_FIREHOSE,
  S3_EVENTBRIDGE_SQS,
};
