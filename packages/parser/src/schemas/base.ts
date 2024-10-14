import z from 'zod';

/**
 * A base schema for record objects with string keys and string values
 */
const RecordSchema = z.record(z.string());

/**
 * A base schema for HTTP methods
 */
const HttpMethodSchema = z.enum([
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'HEAD',
  'OPTIONS',
]);

export { RecordSchema, HttpMethodSchema };
