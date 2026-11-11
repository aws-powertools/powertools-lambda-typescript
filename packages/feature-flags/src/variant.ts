import { isRecord } from '@aws-lambda-powertools/commons';
import { isFiniteContextValue } from './context.js';
import type { Variant } from './types/index.js';

/** Tracks built-in Variant stores without importing their transport. @internal */
const variantStores = new WeakSet<object>();

/** Registers a Variant store for runtime fallback validation. @internal */
const registerVariantStore = (store: object): void => {
  variantStores.add(store);
};

/** Checks whether a store requires Variant fallbacks. @internal */
const isVariantStore = (store: object): boolean => variantStores.has(store);

/** Checks the exact normalized Variant shape and every attribute. @internal */
const isVariant = (value: unknown): value is Variant =>
  isRecord(value) &&
  Reflect.ownKeys(value).length === 3 &&
  Object.hasOwn(value, 'enabled') &&
  typeof value.enabled === 'boolean' &&
  Object.hasOwn(value, 'variant') &&
  typeof value.variant === 'string' &&
  Object.hasOwn(value, 'attributes') &&
  isRecord(value.attributes) &&
  Object.values(value.attributes).every(isFiniteContextValue);

export { isVariant, isVariantStore, registerVariantStore };
