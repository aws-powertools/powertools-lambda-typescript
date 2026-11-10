import { describe, expectTypeOf, it } from 'vitest';
import {
  type AppConfigStoreOptions,
  appConfigStore,
  type EnvelopeSearchFn,
} from '../../src/appconfig/index.js';
import {
  type EnvelopeSearchFn as AgentEnvelopeSearchFn,
  type AppConfigAgentStoreOptions,
  appConfigAgentStore,
} from '../../src/appconfig-agent/index.js';
import type { Store } from '../../src/index.js';

describe('Type: AppConfig stores', () => {
  it('accepts paired envelope options and exports the same search-function type', () => {
    // Prepare
    const envelopeSearchFn: EnvelopeSearchFn = (_expression, data) => data;
    const options = {
      application: 'my-app',
      environment: 'prod',
      name: 'features',
      envelope: 'settings.flags',
      envelopeSearchFn,
    };
    // Act
    const sdkStore = appConfigStore(options);
    const agentStore = appConfigAgentStore(options);
    // Assess
    expectTypeOf(sdkStore).toEqualTypeOf<Store>();
    expectTypeOf(agentStore).toEqualTypeOf<Store>();
    expectTypeOf<EnvelopeSearchFn>().toEqualTypeOf<AgentEnvelopeSearchFn>();
    expectTypeOf<EnvelopeSearchFn>().toEqualTypeOf<
      (expression: string, data: unknown) => unknown
    >();
  });

  it('requires a search function with an envelope', () => {
    // Prepare
    const options = {
      application: 'my-app',
      environment: 'prod',
      name: 'features',
      envelope: 'settings.flags',
    };
    // Act
    // @ts-expect-error An envelope requires an envelopeSearchFn.
    const createSdkStore = () => appConfigStore(options);
    // @ts-expect-error An envelope requires an envelopeSearchFn.
    const createAgentStore = () => appConfigAgentStore(options);
    // Assess
    expectTypeOf(createSdkStore).returns.toEqualTypeOf<Store>();
    expectTypeOf(createAgentStore).returns.toEqualTypeOf<Store>();
  });

  it('requires an envelope with a search function', () => {
    // Prepare
    const options = {
      application: 'my-app',
      environment: 'prod',
      name: 'features',
      envelopeSearchFn: (_expression: string, data: unknown) => data,
    };
    // Act
    // @ts-expect-error An envelopeSearchFn requires an envelope.
    const createSdkStore = () => appConfigStore(options);
    // @ts-expect-error An envelopeSearchFn requires an envelope.
    const createAgentStore = () => appConfigAgentStore(options);
    // Assess
    expectTypeOf(createSdkStore).returns.toEqualTypeOf<Store>();
    expectTypeOf(createAgentStore).returns.toEqualTypeOf<Store>();
  });
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
