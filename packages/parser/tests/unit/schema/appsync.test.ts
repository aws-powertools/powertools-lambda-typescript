/**
 * Test built-in AppSync resolver schemas
 *
 * @group unit/parser/schema/appsync
 */

import { faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';
import {
  AppSyncBatchResolverSchema,
  AppSyncResolverSchema,
} from '../../../src/schemas/appsync';
import type { AppSyncResolverEvent } from '../../../src/types';
import { getTestEvent, omit } from './utils';

type Table = {
  name: string;
  event: AppSyncResolverEvent;
};

describe('AppSync Resolver Schemas', () => {
  const eventsPath = 'appsync';

  const appSyncResolverEvent: AppSyncResolverEvent = getTestEvent({
    eventsPath,
    filename: 'resolver',
  });

  const table: Table[] = [
    {
      name: 'should parse resolver event with null source',
      event: {
        ...appSyncResolverEvent,
        source: null,
      },
    },
    {
      name: 'should parse resolver event with null prev',
      event: {
        ...appSyncResolverEvent,
        prev: null,
      },
    },
    {
      name: 'should parse resolver event without custom domain',
      event: {
        ...appSyncResolverEvent,
        request: {
          ...appSyncResolverEvent.request,
          domainName: null,
        },
      },
    },
    {
      name: 'should parse resolver event with cognito identity and no rbac groups',
      event: {
        ...appSyncResolverEvent,
        identity: {
          claims: {
            sub: '192879fc-a240-4bf1-ab5a-d6a00f3063f9',
          },
          defaultAuthStrategy: 'ALLOW',
          groups: null,
          issuer:
            'https://cognito-idp.us-west-2.amazonaws.com/us-west-xxxxxxxxxxx',
          sourceIp: [faker.internet.ip()],
          sub: '192879fc-a240-4bf1-ab5a-d6a00f3063f9',
          username: 'jdoe',
        },
      },
    },
    {
      name: 'with iam identity with no cognito fields',
      event: {
        ...appSyncResolverEvent,
        identity: {
          accountId: '012345678901',
          cognitoIdentityAuthProvider: null,
          cognitoIdentityAuthType: null,
          cognitoIdentityId: null,
          cognitoIdentityPoolId: null,
          sourceIp: [faker.internet.ip()],
          userArn: 'arn:aws:sts::012345678901:assumed-role/role',
          username: 'AROAXYKJUOW6FHGUSK5FA:username',
        },
      },
    },
    {
      name: 'should parse resolver event with iam identity with cognito fields',
      event: {
        ...appSyncResolverEvent,
        identity: {
          accountId: '012345678901',
          cognitoIdentityAuthProvider: 'cognitoIdentityAuthProvider',
          cognitoIdentityAuthType: 'cognitoIdentityAuthType',
          cognitoIdentityId: 'cognitoIdentityId',
          cognitoIdentityPoolId: 'cognitoIdentityPoolId',
          sourceIp: [faker.internet.ip()],
          userArn: 'arn:aws:sts::012345678901:assumed-role/role',
          username: 'AROAXYKJUOW6FHGUSK5FA:username',
        },
      },
    },
    {
      name: 'should parse resolver event with lambda identity',
      event: {
        ...appSyncResolverEvent,
        identity: {
          resolverContext: {
            field1: 'value',
          },
        },
      },
    },
    {
      name: 'should parse resolver event with oidc identity',
      event: {
        ...appSyncResolverEvent,
        identity: {
          claims: {
            sub: 'sub',
          },
          issuer: 'issuer',
          sub: 'sub',
        },
      },
    },
  ];

  describe('AppSync Resolver Schema', () => {
    it('should return validation error when the event is invalid', () => {
      const { error } = AppSyncResolverSchema.safeParse(
        omit(['request', 'info'], appSyncResolverEvent)
      );

      expect(error?.issues).toEqual([
        {
          code: 'invalid_type',
          expected: 'object',
          received: 'undefined',
          path: ['request'],
          message: 'Required',
        },
        {
          code: 'invalid_type',
          expected: 'object',
          received: 'undefined',
          path: ['info'],
          message: 'Required',
        },
      ]);
    });

    it('should parse resolver event without identity field', () => {
      const event: Omit<AppSyncResolverEvent, 'identity'> = omit(
        ['identity'],
        appSyncResolverEvent
      );
      const parsedEvent = AppSyncResolverSchema.parse(event);
      expect(parsedEvent).toEqual(event);
    });

    it.each(table)('$name', ({ event }: Table) => {
      const parsedEvent = AppSyncResolverSchema.parse(event);
      expect(parsedEvent).toEqual(event);
    });
  });

  describe('Batch AppSync Resolver Schema', () => {
    it('should return validation error when the event is invalid', () => {
      const event = omit(['request', 'info'], appSyncResolverEvent);

      const { error } = AppSyncBatchResolverSchema.safeParse([event]);

      expect(error?.issues).toEqual([
        {
          code: 'invalid_type',
          expected: 'object',
          received: 'undefined',
          path: [0, 'request'],
          message: 'Required',
        },
        {
          code: 'invalid_type',
          expected: 'object',
          received: 'undefined',
          path: [0, 'info'],
          message: 'Required',
        },
      ]);
    });

    it('should parse batches of appsync resolver events', () => {
      const events = table.map((table: Table) => table.event);
      const parsedEvent = AppSyncBatchResolverSchema.parse(events);
      expect(parsedEvent).toEqual(events);
    });
  });
});
