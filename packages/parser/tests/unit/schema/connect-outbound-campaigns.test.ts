import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { JSONStringified } from '../../../src/helpers/index.js';
import {
  ConnectOutboundCampaignsCustomerProfileSchema,
  ConnectOutboundCampaignsSchema,
} from '../../../src/schemas/connect-outbound-campaigns.js';
import type { ConnectOutboundCampaignsEvent } from '../../../src/types/schema.js';
import { getTestEvent } from '../helpers/utils.js';

describe('Schema: ConnectOutboundCampaigns', () => {
  const baseEvent = getTestEvent<ConnectOutboundCampaignsEvent>({
    eventsPath: 'connect-outbound-campaigns',
    filename: 'base',
  });

  it('parses a valid ConnectOutboundCampaigns event', () => {
    // Prepare
    const event = structuredClone(baseEvent);

    // Act
    const result = ConnectOutboundCampaignsSchema.parse(event);

    // Assess
    expect(result).toStrictEqual(event);
  });

  it('throws if the event is missing required fields', () => {
    // Prepare
    const event = structuredClone(
      baseEvent
    ) as Partial<ConnectOutboundCampaignsEvent>;
    delete event.InvocationMetadata;

    // Act & Assess
    expect(() => ConnectOutboundCampaignsSchema.parse(event)).toThrow();
  });

  it('parses CustomerData when extending the customer profile schema with JSONStringified', () => {
    // Prepare
    const customerDataSchema = z.object({
      firstName: z.string(),
      lastName: z.string(),
      email: z.email(),
    });
    const customerProfileSchema =
      ConnectOutboundCampaignsCustomerProfileSchema.extend({
        CustomerData: JSONStringified(customerDataSchema),
      });
    const eventSchema = ConnectOutboundCampaignsSchema.extend({
      Items: z.object({
        CustomerProfiles: z.array(customerProfileSchema),
      }),
    });
    const event = structuredClone(baseEvent);

    // Act
    const result = eventSchema.parse(event);

    // Assess
    expect(result.Items.CustomerProfiles[0]).toStrictEqual({
      ProfileId: 'customer-001',
      CustomerData: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
      },
      IdempotencyToken: 'token-xyz789',
    });
  });
});
