import { describe, expect, it } from 'vitest';
import {
  AppSyncBatchResolverSchema,
  AppSyncResolverSchema,
} from '../../../src/schemas/appsync.js';
import type { AppSyncResolverEvent } from '../../../src/types/schema.js';
import { getTestEvent, omit } from './utils.js';

describe('Schema: AppSync Resolver', () => {
  const eventsPath = 'appsync';
  const appSyncResolverEvent = getTestEvent<AppSyncResolverEvent>({
    eventsPath,
    filename: 'resolver',
  });

  const events = [
    {
      name: 'null source',
      event: {
        ...appSyncResolverEvent,
        source: null,
      },
    },
    {
      name: 'null prev',
      event: {
        ...appSyncResolverEvent,
        prev: null,
      },
    },
    {
      name: 'no custom domain',
      event: {
        ...appSyncResolverEvent,
        request: {
          ...appSyncResolverEvent.request,
          domainName: null,
        },
      },
    },
    {
      name: 'cognito identity and no rbac groups',
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
          sourceIp: ['1.1.1.1'],
          sub: '192879fc-a240-4bf1-ab5a-d6a00f3063f9',
          username: 'jdoe',
        },
      },
    },
    {
      name: 'iam identity with no cognito fields',
      event: {
        ...appSyncResolverEvent,
        identity: {
          accountId: '012345678901',
          cognitoIdentityAuthProvider: null,
          cognitoIdentityAuthType: null,
          cognitoIdentityId: null,
          cognitoIdentityPoolId: null,
          sourceIp: ['1.1.1.1'],
          userArn: 'arn:aws:sts::012345678901:assumed-role/role',
          username: 'AROAXYKJUOW6FHGUSK5FA:username',
        },
      },
    },
    {
      name: 'iam identity with cognito fields',
      event: {
        ...appSyncResolverEvent,
        identity: {
          accountId: '012345678901',
          cognitoIdentityAuthProvider: 'cognitoIdentityAuthProvider',
          cognitoIdentityAuthType: 'cognitoIdentityAuthType',
          cognitoIdentityId: 'cognitoIdentityId',
          cognitoIdentityPoolId: 'cognitoIdentityPoolId',
          sourceIp: ['1.1.1.1'],
          userArn: 'arn:aws:sts::012345678901:assumed-role/role',
          username: 'AROAXYKJUOW6FHGUSK5FA:username',
        },
      },
    },
    {
      name: 'lambda identity',
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
      name: 'oidc identity',
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

  it.each(events)('parses an AppSyn resolver event with $name', ({ event }) => {
    // Assess
    const result = AppSyncResolverSchema.parse(event);

    // Assess
    expect(result).toEqual(event);
  });

  it('throws when the event is not an AppSync resolver event', () => {
    // Prepare
    const event = omit(
      ['request', 'info'],
      structuredClone(appSyncResolverEvent)
    );

    // Act & Assess
    expect(() => AppSyncResolverSchema.parse(event)).toThrow();
  });

  it('parses batches of AppSync resolver events', () => {
    // Prepare
    const event = events.map((event) => structuredClone(event.event));

    // Act
    const result = AppSyncBatchResolverSchema.parse(event);

    // Assess
    expect(result).toEqual(event);
  });
});
