import { z } from 'zod';
import type {
  ConnectOutboundCampaignsCustomerProfile,
  ConnectOutboundCampaignsEvent,
} from '../types/schema.js';

/**
 * Zod schema for Amazon Connect Outbound Campaigns customer profile records.
 *
 * `CustomerData` is a JSON string with campaign-defined key-value pairs. You can
 * parse it by extending this schema with `JSONStringified` from
 * `@aws-lambda-powertools/parser/helpers`.
 *
 * @see {@link ConnectOutboundCampaignsCustomerProfile | `ConnectOutboundCampaignsCustomerProfile`}
 * @see {@link https://docs.aws.amazon.com/connect/latest/adminguide/lambda-invoke-functions.html}
 */
const ConnectOutboundCampaignsCustomerProfileSchema = z.object({
  ProfileId: z.string(),
  CustomerData: z.string(),
  IdempotencyToken: z.string(),
});

/**
 * Zod schema for Amazon Connect Outbound Campaigns custom action events.
 *
 * @example
 * ```json
 * {
 *   "InvocationMetadata": {
 *     "CampaignContext": {
 *       "CampaignId": "campaign-12345",
 *       "RunId": "run-67890",
 *       "ActionId": "activity-abc123",
 *       "CampaignName": "Welcome Campaign"
 *     }
 *   },
 *   "Items": {
 *     "CustomerProfiles": [
 *       {
 *         "ProfileId": "customer-001",
 *         "CustomerData": "{\"firstName\":\"John\",\"lastName\":\"Doe\",\"email\":\"john.doe@example.com\"}",
 *         "IdempotencyToken": "token-xyz789"
 *       }
 *     ]
 *   }
 * }
 * ```
 *
 * @see {@link ConnectOutboundCampaignsEvent | `ConnectOutboundCampaignsEvent`}
 * @see {@link https://docs.aws.amazon.com/connect/latest/adminguide/lambda-invoke-functions.html}
 */
const ConnectOutboundCampaignsSchema = z.object({
  InvocationMetadata: z.object({
    CampaignContext: z.object({
      CampaignId: z.string(),
      RunId: z.string(),
      ActionId: z.string(),
      CampaignName: z.string(),
    }),
  }),
  Items: z.object({
    CustomerProfiles: z.array(ConnectOutboundCampaignsCustomerProfileSchema),
  }),
});

export {
  ConnectOutboundCampaignsCustomerProfileSchema,
  ConnectOutboundCampaignsSchema,
};
