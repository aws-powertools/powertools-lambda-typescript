import { describe, expectTypeOf, it } from 'vitest';
import {
  type AppConfigVariantStoreOptions,
  appConfigVariantStore,
  disabledVariant,
} from '../../src/appconfig-agent/index.js';
import { FeatureFlags, type Store, type Variant } from '../../src/index.js';
import { settingsSchema } from '../helpers/standardSchema.js';

describe('Type: Variant evaluation', () => {
  it('infers the store value and returns full Variants for every batch key', () => {
    // Prepare
    const options: AppConfigVariantStoreOptions = {
      environment: 'prod',
      name: 'features',
    };
    const store = appConfigVariantStore(options);
    const flags = new FeatureFlags({ store });
    // Act
    const single = flags.evaluate({ name: 'ui', default: disabledVariant() });
    const many = flags.evaluateMany({
      flags: {
        ui: disabledVariant(),
        basic: { enabled: false, variant: 'custom', attributes: {} },
      },
    });
    const enabled = flags.getEnabledFeatures();
    // Assess
    expectTypeOf(store).toEqualTypeOf<Store<Variant>>();
    expectTypeOf(flags).toEqualTypeOf<FeatureFlags<Variant>>();
    expectTypeOf(single).resolves.toEqualTypeOf<Variant>();
    expectTypeOf(many).resolves.toEqualTypeOf<{
      ui: Variant;
      basic: Variant;
    }>();
    expectTypeOf(enabled).resolves.toEqualTypeOf<string[]>();
  });

  it('rejects primitive fallbacks and schemas on Variant instances', () => {
    // Prepare
    const flags = new FeatureFlags({
      store: appConfigVariantStore({ environment: 'prod', name: 'features' }),
    });
    const fallback = disabledVariant();
    // Act
    // @ts-expect-error Variant stores require a full Variant fallback.
    const primitive = flags.evaluate({ name: 'ui', default: false });
    // @ts-expect-error Variant stores do not accept schemas.
    const schema = flags.evaluate({
      name: 'ui',
      default: fallback,
      schema: settingsSchema,
    });
    // @ts-expect-error Every Variant batch fallback must be a Variant.
    const primitives = flags.evaluateMany({ flags: { ui: false } });
    const schemas = flags.evaluateMany({
      flags: { ui: fallback },
      // @ts-expect-error Variant batches do not accept schema maps.
      schemas: { ui: settingsSchema },
    });
    // Assess
    expectTypeOf(fallback).toEqualTypeOf<Variant>();
    void primitive.catch(() => {});
    void schema.catch(() => {});
    void primitives.catch(() => {});
    void schemas.catch(() => {});
  });
});
