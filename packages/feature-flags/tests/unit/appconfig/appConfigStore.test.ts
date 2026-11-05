import { AppConfigProvider } from '@aws-lambda-powertools/parameters/appconfig';
import {
  GetParameterError,
  ParameterNotFoundError,
  TransformParameterError,
} from '@aws-lambda-powertools/parameters/errors';
import {
  AppConfigDataClient,
  GetLatestConfigurationCommand,
  StartConfigurationSessionCommand,
} from '@aws-sdk/client-appconfigdata';
import { Uint8ArrayBlobAdapter } from '@smithy/util-stream';
import { mockClient } from 'aws-sdk-client-mock';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { appConfigStore } from '../../../src/appconfig/index.js';
import {
  FeatureFlags,
  SchemaValidationError,
  StoreUnavailableError,
} from '../../../src/index.js';

describe('appConfigStore', () => {
  const client = mockClient(AppConfigDataClient);
  const options = {
    application: 'my-app',
    environment: 'prod',
    name: 'features',
  };

  beforeEach(() => {
    client.reset();
    client
      .on(StartConfigurationSessionCommand)
      .resolves({ InitialConfigurationToken: 'initial-token' });
    client.on(GetLatestConfigurationCommand).resolves({
      Configuration: Uint8ArrayBlobAdapter.fromString(
        JSON.stringify({ checkout: { default: true } })
      ),
      NextPollConfigurationToken: 'next-token',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it('retrieves JSON and evaluates a flag', async () => {
    // Prepare
    const store = appConfigStore(options);
    const flags = new FeatureFlags({ store });
    // Act
    const result = await flags.evaluate({ name: 'checkout', default: false });
    // Assess
    expect(result).toBe(true);
    expect(store.name).toBe('appconfig');
    expect(client).toReceiveCommandWith(StartConfigurationSessionCommand, {
      ApplicationIdentifier: 'my-app',
      EnvironmentIdentifier: 'prod',
      ConfigurationProfileIdentifier: 'features',
    });
  });

  it('selects an embedded Flag Document', async () => {
    // Prepare
    client.on(GetLatestConfigurationCommand).resolves({
      Configuration: Uint8ArrayBlobAdapter.fromString(
        JSON.stringify({ settings: { flags: { checkout: { default: true } } } })
      ),
    });
    const flags = new FeatureFlags({
      store: appConfigStore({ ...options, envelope: 'settings.flags' }),
    });
    // Act
    const result = await flags.evaluate({ name: 'checkout', default: false });
    // Assess
    expect(result).toBe(true);
  });

  it('rejects an envelope miss without using the whole document', async () => {
    // Prepare
    const flags = new FeatureFlags({
      store: appConfigStore({ ...options, envelope: 'settings.flags' }),
    });
    // Act
    const result = flags.evaluate({ name: 'checkout', default: false });
    // Assess
    await expect(result).rejects.toBeInstanceOf(SchemaValidationError);
    await expect(result).rejects.toThrow("Envelope 'settings.flags'");
  });

  it.each([
    { name: 'ThrottlingException' },
    { name: 'UnknownException', $metadata: { httpStatusCode: 503 } },
  ])('returns the Fallback for SDK availability failure %j', async (fields) => {
    // Prepare
    client
      .on(StartConfigurationSessionCommand)
      .rejects(Object.assign(new Error('retrieval failed'), fields));
    const flags = new FeatureFlags({ store: appConfigStore(options) });
    // Act
    const result = await flags.evaluate({ name: 'checkout', default: false });
    // Assess
    expect(result).toBe(false);
  });

  it('preserves the Parameters cause in StoreUnavailableError', async () => {
    // Prepare
    const cause = Object.assign(new Error('retrieval failed'), {
      name: 'ThrottlingException',
    });
    const error = new GetParameterError('retrieval failed', { cause });
    vi.spyOn(AppConfigProvider.prototype, 'get').mockRejectedValue(error);
    const store = appConfigStore(options);
    // Act
    const result = store.getMany(['checkout'], {});
    // Assess
    await expect(result).rejects.toBeInstanceOf(StoreUnavailableError);
    await expect(result).rejects.toMatchObject({
      message: 'appconfig is unavailable',
      cause: error,
    });
  });

  it.each([
    new GetParameterError('denied', {
      cause: Object.assign(new Error('access denied'), {
        name: 'AccessDeniedException',
        $metadata: { httpStatusCode: 403 },
      }),
    }),
    new ParameterNotFoundError('missing profile'),
    new TransformParameterError('json', 'malformed document'),
  ])(
    'propagates Parameters misconfiguration unchanged for %s',
    async (error) => {
      // Prepare
      vi.spyOn(AppConfigProvider.prototype, 'get').mockRejectedValue(error);
      const flags = new FeatureFlags({ store: appConfigStore(options) });
      // Act
      const result = flags.evaluate({ name: 'checkout', default: false });
      // Assess
      await expect(result).rejects.toBe(error);
    }
  );

  it('propagates SDK access denial with its original cause', async () => {
    // Prepare
    const cause = Object.assign(new Error('access denied'), {
      name: 'AccessDeniedException',
      $metadata: { httpStatusCode: 403 },
    });
    client.on(StartConfigurationSessionCommand).rejects(cause);
    const flags = new FeatureFlags({ store: appConfigStore(options) });
    // Act
    const result = flags.evaluate({ name: 'checkout', default: false });
    // Assess
    await expect(result).rejects.toBeInstanceOf(GetParameterError);
    await expect(result).rejects.toHaveProperty('cause', cause);
  });

  it('propagates a missing profile instead of returning the Fallback', async () => {
    // Prepare
    client.on(GetLatestConfigurationCommand).resolves({});
    const flags = new FeatureFlags({ store: appConfigStore(options) });
    // Act
    const result = flags.evaluate({ name: 'checkout', default: false });
    // Assess
    await expect(result).rejects.toBeInstanceOf(ParameterNotFoundError);
  });

  it('propagates malformed JSON instead of returning the Fallback', async () => {
    // Prepare
    client.on(GetLatestConfigurationCommand).resolves({
      Configuration: Uint8ArrayBlobAdapter.fromString('not JSON'),
    });
    const flags = new FeatureFlags({ store: appConfigStore(options) });
    // Act
    const result = flags.evaluate({ name: 'checkout', default: false });
    // Assess
    await expect(result).rejects.toBeInstanceOf(TransformParameterError);
  });

  it('passes maxAge to the provider and reuses its cache', async () => {
    // Prepare
    vi.useFakeTimers();
    const getSpy = vi.spyOn(AppConfigProvider.prototype, 'get');
    const store = appConfigStore({ ...options, maxAge: 30 });
    // Act
    await store.getAll({});
    vi.advanceTimersByTime(29_000);
    await store.getAll({});
    vi.advanceTimersByTime(1_001);
    await store.getAll({});
    // Assess
    expect(getSpy).toHaveBeenCalledWith('features', {
      transform: 'json',
      maxAge: 30,
      throwOnMissing: true,
    });
    expect(client.commandCalls(GetLatestConfigurationCommand)).toHaveLength(2);
    expect(client.commandCalls(StartConfigurationSessionCommand)).toHaveLength(
      1
    );
  });

  it('uses the supplied AWS SDK client', async () => {
    // Prepare
    const awsSdkV3Client = new AppConfigDataClient({ region: 'eu-west-1' });
    const instanceMock = mockClient(awsSdkV3Client);
    instanceMock
      .on(StartConfigurationSessionCommand)
      .resolves({ InitialConfigurationToken: 'instance-token' });
    instanceMock.on(GetLatestConfigurationCommand).resolves({
      Configuration: Uint8ArrayBlobAdapter.fromString(
        '{"checkout":{"default":false}}'
      ),
    });
    const flags = new FeatureFlags({
      store: appConfigStore({ ...options, awsSdkV3Client }),
    });
    // Act
    const result = await flags.evaluate({ name: 'checkout', default: true });
    // Assess
    expect(result).toBe(false);
    expect(instanceMock).toReceiveCommandWith(GetLatestConfigurationCommand, {
      ConfigurationToken: 'instance-token',
    });
    expect(client.commandCalls(StartConfigurationSessionCommand)).toHaveLength(
      0
    );
    instanceMock.restore();
  });

  it('configures a new SDK client with clientConfig', async () => {
    // Prepare
    const getSpy = vi.spyOn(AppConfigProvider.prototype, 'get');
    const store = appConfigStore({
      ...options,
      clientConfig: { region: 'eu-south-2' },
    });
    // Act
    await store.getAll({});
    // Assess
    const provider = getSpy.mock.instances[0];
    if (!(provider instanceof AppConfigProvider))
      throw new Error('Expected an AppConfigProvider');
    await expect(provider.client.config.region()).resolves.toBe('eu-south-2');
  });

  it('defaults application to POWERTOOLS_SERVICE_NAME', async () => {
    // Prepare
    vi.stubEnv('POWERTOOLS_SERVICE_NAME', 'service-app');
    const store = appConfigStore({ environment: 'prod', name: 'features' });
    // Act
    await store.getAll({});
    // Assess
    expect(client).toReceiveCommandWith(StartConfigurationSessionCommand, {
      ApplicationIdentifier: 'service-app',
      EnvironmentIdentifier: 'prod',
      ConfigurationProfileIdentifier: 'features',
    });
  });

  it('passes the logger through to the rule engine', async () => {
    // Prepare
    const logger = {
      debug: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      error: vi.fn(),
    };
    const store = appConfigStore({ ...options, logger });
    // Act
    await new FeatureFlags({ store }).evaluate({
      name: 'checkout',
      default: false,
    });
    // Assess
    expect(logger.debug).toHaveBeenCalledExactlyOnceWith({
      store: 'rule-engine',
      name: 'checkout',
      outcome: 'default',
    });
    expect(logger.warn).not.toHaveBeenCalled();
  });
});
