import { readFileSync } from 'node:fs';
import { UnauthorizedException } from '@aws-lambda-powertools/event-handler/appsync-events';
import type { Context } from 'aws-lambda';
import { describe, expect, it } from 'vitest';
import { handler } from './unauthorizedException.js'; // (1)!

describe('On publish', () => {
  it('rejects subscriptions on /default/bar', async () => {
    // Prepare
    const event = structuredClone(
      JSON.parse(readFileSync('./samples/onSubscribeEvent.json', 'utf-8'))
    );

    // Act & Assess
    await expect(() => handler(event, {} as Context)).rejects.toThrow(
      UnauthorizedException
    );
  });
});
