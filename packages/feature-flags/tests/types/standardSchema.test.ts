import type { JSONValue } from '@aws-lambda-powertools/commons/types';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import { describe, expectTypeOf, it } from 'vitest';
import {
  type EvaluateManyResult,
  type EvaluateWithSchemaOptions,
  FeatureFlags,
} from '../../src/index.js';
import { createSchema, settingsSchema } from '../helpers/standardSchema.js';

/** Creates a feature flag evaluator for type assertions. */
const prepare = () =>
  new FeatureFlags({
    store: {
      name: 'in-memory',
      getMany: async () => ({}),
      getAll: async () => ({}),
    },
  });

describe('Type: Standard Schema evaluation', () => {
  it('infers the schema output instead of its input', () => {
    // Prepare
    const flags = prepare();
    const options: EvaluateWithSchemaOptions<typeof settingsSchema> = {
      name: 'settings',
      default: { theme: 'light' },
      schema: settingsSchema,
    };
    // Act
    const result = flags.evaluate(options);
    // Assess
    expectTypeOf(result).resolves.toEqualTypeOf<{
      theme: string;
      validated: boolean;
    }>();
  });

  it('infers schema outputs and widens other batch fallbacks', () => {
    // Prepare
    const flags = prepare();
    // Act
    const result = flags.evaluateMany({
      flags: {
        settings: { theme: 'light' },
        banner: 'none',
        enabled: false,
        limit: 10,
        unchecked: null,
      },
      schemas: { settings: settingsSchema },
    });
    // Assess
    expectTypeOf(result).resolves.toEqualTypeOf<{
      settings: { theme: string; validated: boolean };
      banner: string;
      enabled: boolean;
      limit: number;
      unchecked: JSONValue;
    }>();
    expectTypeOf<
      EvaluateManyResult<
        { settings: { theme: string }; banner: string },
        { settings: typeof settingsSchema }
      >
    >().toEqualTypeOf<{
      settings: { theme: string; validated: boolean };
      banner: string;
    }>();
  });

  it('accepts calls without schemas', () => {
    // Prepare
    const flags = prepare();
    // Act
    const single = flags.evaluate({ name: 'enabled', default: false });
    const many = flags.evaluateMany({
      flags: { settings: { theme: 'light' }, enabled: false },
    });
    const emptySchemas = flags.evaluateMany({
      flags: { settings: { theme: 'light' }, enabled: false },
      schemas: {},
    });
    // Assess
    expectTypeOf(single).resolves.toEqualTypeOf<boolean>();
    expectTypeOf(many).resolves.toEqualTypeOf<{
      settings: JSONValue;
      enabled: boolean;
    }>();
    expectTypeOf(emptySchemas).toEqualTypeOf(many);
  });

  it('rejects schemas that can produce undefined', () => {
    // Prepare
    const flags = prepare();
    const schema = createSchema<string, string | undefined>((value) => ({
      value: String(value),
    }));
    // Act
    const single = flags.evaluate({
      name: 'settings',
      default: 'light',
      // @ts-expect-error Schema outputs must not include undefined.
      schema,
    });
    const many = flags.evaluateMany({
      flags: { settings: 'light', banner: 'none' },
      // @ts-expect-error Each batch schema must reject undefined outputs.
      schemas: { settings: schema },
    });
    // Assess
    expectTypeOf(schema).toEqualTypeOf<
      StandardSchemaV1<string, string | undefined>
    >();
    void single;
    void many;
  });

  it('rejects undefined outputs in an optional schema map', () => {
    // Prepare
    const flags = prepare();
    const schemas: { settings?: StandardSchemaV1<string, string | undefined> } =
      {};
    // Act
    const result = flags.evaluateMany({
      flags: { settings: 'light' },
      // @ts-expect-error Optional schema entries must also reject undefined outputs.
      schemas,
    });
    // Assess
    expectTypeOf(schemas).toEqualTypeOf<{
      settings?: StandardSchemaV1<string, string | undefined>;
    }>();
    void result;
  });

  it('checks the single fallback against the schema input', () => {
    // Prepare
    const flags = prepare();
    // Act
    // @ts-expect-error The fallback must match the schema's input type.
    const result = flags.evaluate({
      name: 'settings',
      default: 10,
      schema: settingsSchema,
    });
    // Assess
    expectTypeOf(settingsSchema).toExtend<
      StandardSchemaV1<{ theme: string }, { theme: string; validated: boolean }>
    >();
    void result.catch(() => {});
  });

  it('includes the fallback type for optional batch schemas', () => {
    // Prepare
    const flags = prepare();
    const schema = createSchema<string, { theme: string }>((value) => ({
      value: { theme: String(value) },
    }));
    const schemas: { settings?: typeof schema } = { settings: schema };
    // Act
    const result = flags.evaluateMany({
      flags: { settings: 'light', banner: 'none' },
      schemas,
    });
    // Assess
    expectTypeOf(result).resolves.toEqualTypeOf<{
      settings: string | { theme: string };
      banner: string;
    }>();
  });

  it('rejects schemas for flags outside the batch', () => {
    // Prepare
    const flags = prepare();
    // Act
    const result = flags.evaluateMany({
      flags: { settings: { theme: 'light' } },
      // @ts-expect-error Schema names must belong to the requested flags.
      schemas: { extra: settingsSchema },
    });
    // Assess
    expectTypeOf(result).toExtend<Promise<unknown>>();
  });

  it('infers outputs for special flag names', () => {
    // Prepare
    const flags = prepare();
    // Act
    const result = flags.evaluateMany({
      flags: { ['__proto__']: { theme: 'light' }, toString: 'none' },
      schemas: { ['__proto__']: settingsSchema },
    });
    // Assess
    expectTypeOf(result).resolves.toEqualTypeOf<{
      ['__proto__']: { theme: string; validated: boolean };
      toString: string;
    }>();
  });
});
