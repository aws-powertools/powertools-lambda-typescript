import { z } from 'zod';

const CloudFormationCustomResourceBaseSchema = z.object({
  ServiceToken: z.string(),
  ResponseURL: z.string().url(),
  StackId: z.string(),
  RequestId: z.string(),
  LogicalResourceId: z.string(),
  ResourceType: z.string(),
  ResourceProperties: z.record(z.any()),
});

const CloudFormationCustomResourceCreateSchema =
  CloudFormationCustomResourceBaseSchema.extend({
    RequestType: z.literal('Create'),
  });

const CloudFormationCustomResourceDeleteSchema =
  CloudFormationCustomResourceBaseSchema.extend({
    RequestType: z.literal('Delete'),
  });

const CloudFormationCustomResourceUpdateSchema =
  CloudFormationCustomResourceBaseSchema.extend({
    RequestType: z.literal('Update'),
    OldResourceProperties: z.record(z.any()),
  });

export {
  CloudFormationCustomResourceCreateSchema,
  CloudFormationCustomResourceDeleteSchema,
  CloudFormationCustomResourceUpdateSchema,
  CloudFormationCustomResourceBaseSchema,
};
