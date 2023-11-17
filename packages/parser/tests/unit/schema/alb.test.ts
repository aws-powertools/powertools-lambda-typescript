/**
 * Test built in schema
 *
 * @group unit/parser/schema/
 */
import {
  AlbSchema,
  AlbMultiValueHeadersSchema,
} from '../../../src/schemas/alb';
import { loadExampleEvent } from './utils';

describe('ALB ', () => {
  it('should parse alb event', () => {
    const albEvent = loadExampleEvent('albEvent.json');
    expect(AlbSchema.parse(albEvent)).toEqual(albEvent);
  });
  it('should parse alb event path trailing slash', () => {
    const albEventPathTrailingSlash = loadExampleEvent(
      'albEventPathTrailingSlash.json'
    );
    expect(AlbSchema.parse(albEventPathTrailingSlash)).toEqual(
      albEventPathTrailingSlash
    );
  });
  it('should parse alb event with multi value headers event', () => {
    const albMultiValueHeadersEvent = loadExampleEvent(
      'albMultiValueHeadersEvent.json'
    );
    expect(AlbMultiValueHeadersSchema.parse(albMultiValueHeadersEvent)).toEqual(
      albMultiValueHeadersEvent
    );
  });
});
