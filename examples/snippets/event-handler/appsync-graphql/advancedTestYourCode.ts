import type { Context } from 'aws-lambda';
import { describe, expect, it } from 'vitest';
import { handler } from './advancedNestedMappings.js';

const createEventFactory = (
  fieldName: string,
  args: Record<string, unknown>,
  parentTypeName: string
) => ({
  arguments: { ...args },
  identity: null,
  source: null,
  request: {
    headers: {
      key: 'value',
    },
    domainName: null,
  },
  info: {
    fieldName,
    parentTypeName,
    selectionSetList: [],
    variables: {},
  },
  prev: null,
  stash: {},
});

const onGraphqlEventFactory = (
  fieldName: string,
  typeName: 'Query' | 'Mutation',
  args: Record<string, unknown> = {}
) => createEventFactory(fieldName, args, typeName);

describe('Unit test for AppSync GraphQL Resolver', () => {
  it('returns the location', async () => {
    // Prepare
    const event = onGraphqlEventFactory('listLocations', 'Query');

    // Act
    const result = (await handler(event, {} as Context)) as unknown[];

    // Assess
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: 'loc1',
      name: 'Location One',
      description: 'First location description',
    });
    expect(result[1]).toEqual({
      id: 'loc2',
      name: 'Location Two',
      description: 'Second location description',
    });
  });
});
