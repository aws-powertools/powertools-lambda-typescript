/**
 * Test built-in AppSync resolver schemas
 *
 * @group unit/parser/schema/appsync
 */

import { describe, expect, it } from 'vitest';
import {
  AppSyncBatchResolverSchema,
  AppSyncResolverSchema,
} from '../../../src/schemas/appsync';
import type { AppSyncResolverEvent } from '../../../src/types';
import { getTestEvent } from './utils';

type Table = {
  name: string;
  filename: string;
};

describe('AppSync Resolver Schemas', () => {
  const eventsPath = 'appsync';

  const table = [
    {
      name: 'should parse resolver event without identity field',
      filename: 'no-identity',
    },
    {
      name: 'should parse resolver event with null source',
      filename: 'null-source',
    },
    {
      name: 'should parse resolver event with null prev',
      filename: 'null-prev',
    },
    {
      name: 'should parse resolver event with custom domain name',
      filename: 'custom-domain-name',
    },
    {
      name: 'should parse resolver event with cognito identity and rbac groups',
      filename: 'cognito-identity-group',
    },
    {
      name: 'should parse resolver event with cognito identity and no rbac groups',
      filename: 'cognito-identity-null-group',
    },
    {
      name: 'with iam identity with no cognito fields',
      filename: 'iam-identity-no-cognito',
    },
    {
      name: 'should parse resolver event with iam identity with cognito fields',
      filename: 'iam-identity-cognito',
    },
    {
      name: 'should parse resolver event with lambda identity',
      filename: 'lambda-identity',
    },
    {
      name: 'should parse resolver event with oidc identity',
      filename: 'oidc-identity',
    },
  ];

  describe('AppSync Resolver Schema', () => {
    it('should return validation error when the event is invalid', () => {
      const event = getTestEvent({ eventsPath, filename: 'invalid' });

      const { error } = AppSyncResolverSchema.safeParse(event);

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

    it.each(table)('$name', ({ filename }) => {
      const event = getTestEvent<AppSyncResolverEvent>({
        eventsPath,
        filename,
      });

      const parsedEvent = AppSyncResolverSchema.parse(event);

      expect(parsedEvent).toEqual(event);
    });
  });

  describe('Batch AppSync Resolver Schema', () => {
    it('should return validation error when the event is invalid', () => {
      const event = getTestEvent<AppSyncResolverEvent>({
        eventsPath,
        filename: 'invalid',
      });

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
      const filenames = table.map((table: Table) => table.filename);

      const events = filenames.map((filename) =>
        getTestEvent<AppSyncResolverEvent>({ eventsPath, filename })
      );

      const parsedEvent = AppSyncBatchResolverSchema.parse(events);

      expect(parsedEvent).toEqual(events);
    });
  });
});
