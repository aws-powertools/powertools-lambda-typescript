/**
 * Test built in schema
 *
 * @group unit/parser/schema/
 */
import { AlbMultiValueHeadersSchema, AlbSchema } from '../../../src/schemas/';
import { TestEvents, makeSchemaStrictForTesting } from './utils.js';

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

  describe('should detect missing properties in schema for ', () => {
    it('alb event', () => {
      const albEvent = TestEvents.albEvent;
      const strictSchema = AlbSchema.strict();
      expect(() => strictSchema.parse(albEvent)).not.toThrow();
    });
    it('alb event with multi value headers', () => {
      const albMultiValueHeadersEvent = TestEvents.albMultiValueHeadersEvent;
      const strictSchema = makeSchemaStrictForTesting(
        AlbMultiValueHeadersSchema
      );
      expect(() => strictSchema.parse(albMultiValueHeadersEvent)).not.toThrow();
    });
  });
});
