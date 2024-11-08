import { describe, expect, it } from 'vitest';
import { AlbMultiValueHeadersSchema, AlbSchema } from '../../../src/schemas/';
import { TestEvents } from './utils.js';

describe('ALB ', () => {
  it('should parse alb event', () => {
    const albEvent = TestEvents.albEvent;
    expect(AlbSchema.parse(albEvent)).toEqual(albEvent);
  });
  it('should parse alb event path trailing slash', () => {
    const albEventPathTrailingSlash = TestEvents.albEventPathTrailingSlash;
    expect(AlbSchema.parse(albEventPathTrailingSlash)).toEqual(
      albEventPathTrailingSlash
    );
  });
  it('should parse alb event with multi value headers event', () => {
    const albMultiValueHeadersEvent = TestEvents.albMultiValueHeadersEvent;

    expect(AlbMultiValueHeadersSchema.parse(albMultiValueHeadersEvent)).toEqual(
      albMultiValueHeadersEvent
    );
  });
});
