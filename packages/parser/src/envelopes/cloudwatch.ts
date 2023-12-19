import { parse } from './envelope.js';
import { z, ZodSchema } from 'zod';
import { CloudWatchLogsSchema } from '../schemas/cloudwatch.js';

/**
 * CloudWatch Envelope to extract a List of log records.
 *
 *  The record's body parameter is a string (after being base64 decoded and gzipped),
 *  though it can also be a JSON encoded string.
 *  Regardless of its type it'll be parsed into a BaseModel object.
 *
 *  Note: The record will be parsed the same way so if model is str
 */
export const cloudWatchEnvelope = <T extends ZodSchema>(
  data: unknown,
  schema: T
): z.infer<T> => {
  const parsedEnvelope = CloudWatchLogsSchema.parse(data);

  return parsedEnvelope.awslogs.data.logEvents.map((record) => {
    return parse(record.message, schema);
  });
};
