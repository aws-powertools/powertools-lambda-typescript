import { z } from 'zod';
import type {
  CloudFormationCustomResourceCreateEvent,
  CloudFormationCustomResourceDeleteEvent,
  CloudFormationCustomResourceUpdateEvent,
} from '../types/schema.js';

const CloudFormationCustomResourceBaseSchema = z.object({
  ServiceToken: z.string(),
  ResponseURL: z.url(),
  StackId: z.string(),
  RequestId: z.string(),
  LogicalResourceId: z.string(),
  ResourceType: z.string(),
  ResourceProperties: z.record(z.string(), z.any()),
});

/**
 * Zod schema for CloudFormation Custom Resource event with RequestType = 'Create'
 *
 * @example
 * ```json
 * {
 *   "RequestType": "Create",
 *   "ServiceToken": "arn:aws:lambda:us-east-1:xxx:function:xxxx-CrbuiltinfunctionidProvi-2vKAalSppmKe",
 *   "ResponseURL": "https://cloudformation-custom-resource-response-useast1.s3.amazonaws.com/7F%7Cb1f50fdfc25f3b",
 *   "StackId": "arn:aws:cloudformation:us-east-1:xxxx:stack/xxxx/271845b0-f2e8-11ed-90ac-0eeb25b8ae21",
 *   "RequestId": "xxxxx-d2a0-4dfb-ab1f-xxxxxx",
 *   "LogicalResourceId": "xxxxxxxxx",
 *   "ResourceType": "Custom::MyType",
 *   "ResourceProperties": {
 *     "ServiceToken": "arn:aws:lambda:us-east-1:xxxxx:function:xxxxx",
 *     "MyProps": "ss"
 *   }
 * }
 * ```
 * @see {@link CloudFormationCustomResourceCreateEvent | `CloudFormationCustomResourceCreateEvent`}
 * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/crpg-ref-requesttypes-create.html}
 */
const CloudFormationCustomResourceCreateSchema = z.object({
  ...CloudFormationCustomResourceBaseSchema.shape,
  RequestType: z.literal('Create'),
});

/**
 * Zod schema for CloudFormation Custom Resource event with RequestType = 'Delete'
 *
 * @example
 * ```json
 * {
 *   "RequestType": "Delete",
 *   "ServiceToken": "arn:aws:lambda:us-east-1:xxx:function:xxxx-CrbuiltinfunctionidProvi-2vKAalSppmKe",
 *   "ResponseURL": "https://cloudformation-custom-resource-response-useast1.s3.amazonaws.com/7F%7Cb1f50fdfc25f3b",
 *   "StackId": "arn:aws:cloudformation:us-east-1:xxxx:stack/xxxx/271845b0-f2e8-11ed-90ac-0eeb25b8ae21",
 *   "RequestId": "xxxxx-d2a0-4dfb-ab1f-xxxxxx",
 *   "LogicalResourceId": "xxxxxxxxx",
 *   "ResourceType": "Custom::MyType",
 *   "ResourceProperties": {
 *     "ServiceToken": "arn:aws:lambda:us-east-1:xxxxx:function:xxxxx",
 *     "MyProps": "ss"
 *   }
 * }
 * ```
 * @see {@link CloudFormationCustomResourceDeleteEvent | `CloudFormationCustomResourceDeleteEvent`}
 * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/crpg-ref-requesttypes-delete.html}
 */
const CloudFormationCustomResourceDeleteSchema = z.object({
  ...CloudFormationCustomResourceBaseSchema.shape,
  RequestType: z.literal('Delete'),
});

/**
 * Zod schema for CloudFormation Custom Resource event with RequestType = 'Update'
 *
 * @example
 * ```json
 * {
 *   "RequestType": "Update",
 *   "ServiceToken": "arn:aws:lambda:us-east-1:xxx:function:xxxx-CrbuiltinfunctionidProvi-2vKAalSppmKe",
 *   "ResponseURL": "https://cloudformation-custom-resource-response-useast1.s3.amazonaws.com/7F%7Cb1f50fdfc25f3b",
 *   "StackId": "arn:aws:cloudformation:us-east-1:xxxx:stack/xxxx/271845b0-f2e8-11ed-90ac-0eeb25b8ae21",
 *   "RequestId": "xxxxx-d2a0-4dfb-ab1f-xxxxxx",
 *   "LogicalResourceId": "xxxxxxxxx",
 *   "ResourceType": "Custom::MyType",
 *   "ResourceProperties": {
 *     "ServiceToken": "arn:aws:lambda:us-east-1:xxxxx:function:xxxxx",
 *     "MyProps": "new"
 *   },
 *   "OldResourceProperties": {
 *     "ServiceToken": "arn:aws:lambda:us-east-1:xxxxx:function:xxxxx-xxxx-xxx",
 *     "MyProps": "old"
 *   }
 * }
 * ```
 * @see {@link CloudFormationCustomResourceUpdateEvent | `CloudFormationCustomResourceUpdateEvent`}
 * @see {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/crpg-ref-requesttypes-update.html}
 */
const CloudFormationCustomResourceUpdateSchema = z.object({
  ...CloudFormationCustomResourceBaseSchema.shape,
  RequestType: z.literal('Update'),
  OldResourceProperties: z.record(z.string(), z.any()),
});

export {
  CloudFormationCustomResourceCreateSchema,
  CloudFormationCustomResourceDeleteSchema,
  CloudFormationCustomResourceUpdateSchema,
};
