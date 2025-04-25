import { readFileSync } from 'node:fs';
import type { OnPublishOutput } from '@aws-lambda-powertools/event-handler/types';
import type { Context } from 'aws-lambda';
import { describe, expect, it } from 'vitest';
import { handler } from './gettingStartedOnPublish.js'; // (1)!

describe('On publish', () => {
  it('handles publish on /default/foo', async () => {
    // Prepare
    const event = structuredClone(
      JSON.parse(readFileSync('./samples/onPublishEvent.json', 'utf-8'))
    );

    // Act
    const result = (await handler(event, {} as Context)) as OnPublishOutput;

    // Assess
    expect(result.events).toHaveLength(3);
    expect(result.events[0].payload).toEqual({
      processed: true,
      original_payload: event.events[0].payload,
    });
    expect(result.events[1].payload).toEqual({
      processed: true,
      original_payload: event.events[1].payload,
    });
    expect(result.events[2].payload).toEqual({
      processed: true,
      original_payload: event.events[2].payload,
    });
  });
});
