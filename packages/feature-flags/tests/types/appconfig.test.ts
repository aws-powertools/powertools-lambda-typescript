import { describe, expectTypeOf, it } from 'vitest';
import {
  type AppConfigStoreOptions,
  appConfigStore,
} from '../../src/appconfig/index.js';
import {
  type AppConfigAgentStoreOptions,
  appConfigAgentStore,
} from '../../src/appconfig-agent/index.js';
import type { Store } from '../../src/index.js';

describe('Type: AppConfig stores', () => {
  it('returns a Store from both factories', () => {
    // Prepare
    const options = {
      name: 'features',
      environment: 'prod',
      application: 'my-app',
    };
    // Act
    const sdkStore = appConfigStore(options);
    const agentStore = appConfigAgentStore(options);
    // Assess
    expectTypeOf(sdkStore).toEqualTypeOf<Store>();
    expectTypeOf(agentStore).toEqualTypeOf<Store>();
  });

  it('requires the configuration profile name', () => {
    // Prepare
    const options = { environment: 'prod', application: 'my-app' };
    // Act
    // @ts-expect-error A profile name is required.
    const sdkStore = appConfigStore(options);
    // @ts-expect-error A profile name is required.
    const agentStore = appConfigAgentStore(options);
    // Assess
    expectTypeOf(sdkStore).toEqualTypeOf<Store>();
    expectTypeOf(agentStore).toEqualTypeOf<Store>();
    expectTypeOf<AppConfigStoreOptions['name']>().toEqualTypeOf<string>();
    expectTypeOf<AppConfigAgentStoreOptions['name']>().toEqualTypeOf<string>();
  });

  it('requires the environment', () => {
    // Prepare
    const options = { name: 'features', application: 'my-app' };
    // Act
    // @ts-expect-error An environment is required.
    const sdkStore = appConfigStore(options);
    // @ts-expect-error An environment is required.
    const agentStore = appConfigAgentStore(options);
    // Assess
    expectTypeOf(sdkStore).toEqualTypeOf<Store>();
    expectTypeOf(agentStore).toEqualTypeOf<Store>();
    expectTypeOf<
      AppConfigStoreOptions['environment']
    >().toEqualTypeOf<string>();
    expectTypeOf<
      AppConfigAgentStoreOptions['environment']
    >().toEqualTypeOf<string>();
  });
});
