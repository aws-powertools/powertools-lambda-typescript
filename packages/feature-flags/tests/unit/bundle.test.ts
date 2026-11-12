import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { describe, expect, it } from 'vitest';

describe('AppConfig bundle boundaries', () => {
  it.each([
    {
      entry: 'index.ts',
      format: 'esm',
      includesSdk: false,
      includesJmespath: false,
    },
    {
      entry: 'index.ts',
      format: 'cjs',
      includesSdk: false,
      includesJmespath: false,
    },
    {
      entry: 'appconfig-agent/index.ts',
      format: 'esm',
      includesSdk: false,
      includesJmespath: false,
    },
    {
      entry: 'appconfig-agent/index.ts',
      format: 'cjs',
      includesSdk: false,
      includesJmespath: false,
    },
    {
      entry: 'appconfig-agent/appConfigVariantStore.ts',
      format: 'esm',
      includesSdk: false,
      includesJmespath: false,
    },
    {
      entry: 'appconfig-agent/appConfigVariantStore.ts',
      format: 'cjs',
      includesSdk: false,
      includesJmespath: false,
    },
    {
      entry: 'appconfig/index.ts',
      format: 'esm',
      includesSdk: true,
      includesJmespath: false,
    },
    {
      entry: 'appconfig/index.ts',
      format: 'cjs',
      includesSdk: true,
      includesJmespath: false,
    },
    {
      entry: 'envelope/index.ts',
      format: 'esm',
      includesSdk: false,
      includesJmespath: true,
    },
    {
      entry: 'envelope/index.ts',
      format: 'cjs',
      includesSdk: false,
      includesJmespath: true,
    },
  ] as const)(
    'bundles $entry as $format with includesSdk=$includesSdk and includesJmespath=$includesJmespath',
    async ({ entry, format, includesSdk, includesJmespath }) => {
      // Prepare
      // Resolve workspace dependencies to source, independent of CI's cached build output.
      const alias = {
        '@aws-lambda-powertools/commons/typeutils': fileURLToPath(
          new URL('../../../commons/src/typeUtils.ts', import.meta.url)
        ),
        '@aws-lambda-powertools/commons/utils/base64': fileURLToPath(
          new URL('../../../commons/src/fromBase64.ts', import.meta.url)
        ),
        '@aws-lambda-powertools/commons/utils/env': fileURLToPath(
          new URL('../../../commons/src/envUtils.ts', import.meta.url)
        ),
        '@aws-lambda-powertools/commons': fileURLToPath(
          new URL('../../../commons/src/index.ts', import.meta.url)
        ),
        '@aws-lambda-powertools/jmespath': fileURLToPath(
          new URL('../../../jmespath/src/index.ts', import.meta.url)
        ),
        '@aws-lambda-powertools/jmespath/functions': fileURLToPath(
          new URL(
            '../../../jmespath/src/PowertoolsFunctions.ts',
            import.meta.url
          )
        ),
        '@aws-lambda-powertools/parameters/appconfig-agent': fileURLToPath(
          new URL(
            '../../../parameters/src/appconfig-agent/index.ts',
            import.meta.url
          )
        ),
        '@aws-lambda-powertools/parameters/appconfig': fileURLToPath(
          new URL('../../../parameters/src/appconfig/index.ts', import.meta.url)
        ),
        '@aws-lambda-powertools/parameters/errors': fileURLToPath(
          new URL('../../../parameters/src/errors.ts', import.meta.url)
        ),
      };
      // Act
      const result = await build({
        entryPoints: [
          fileURLToPath(new URL(`../../src/${entry}`, import.meta.url)),
        ],
        bundle: true,
        platform: 'node',
        format,
        metafile: true,
        write: false,
        alias,
      });
      // Assess
      const sdkInputs = Object.keys(result.metafile.inputs).filter((path) =>
        path.includes('@aws-sdk/client-appconfigdata')
      );
      expect(sdkInputs.length > 0).toBe(includesSdk);
      const jmespathInputs = Object.keys(result.metafile.inputs).filter(
        (path) => path.includes('/jmespath/')
      );
      expect(jmespathInputs.length > 0).toBe(includesJmespath);
    }
  );
});
