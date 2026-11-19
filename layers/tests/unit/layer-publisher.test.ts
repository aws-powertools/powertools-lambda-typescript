import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { describe, expect, it } from 'vitest';
import {
  getLayerUtilities,
  LayerPublisherStack,
} from '../../src/layer-publisher-stack.js';
import {
  buildAllowedVersions,
  collectInstalledPackages,
  collectPinnedPackages,
  findVersionDrift,
  getPinnedVersion,
  type Lockfile,
} from '../../src/lockfile.js';

describe('Class: LayerPublisherStack', () => {
  it('creates the stack with a layer in it', () => {
    // Prepare
    const app = new App();
    const stack = new LayerPublisherStack(app, 'MyTestStack', {
      layerName: 'AWSLambdaPowertoolsTypeScript',
      powertoolsPackageVersion: '1.0.1',
      buildFromLocal: true,
      ssmParameterLayerArn: '/layers/powertools-layer-arn',
    });

    // Act
    const template = Template.fromStack(stack);

    // Assess
    template.resourceCountIs('AWS::Lambda::LayerVersion', 1);
    template.hasResourceProperties('AWS::Lambda::LayerVersion', {
      CompatibleRuntimes: ['nodejs22.x', 'nodejs24.x', 'nodejs26.x'],
      LicenseInfo: 'MIT-0',
      /* CompatibleArchitectures: [
        'x86_64',
      ], */
      Description: 'Powertools for AWS Lambda (TypeScript) version 1.0.1',
      LayerName: 'AWSLambdaPowertoolsTypeScript',
    });

    template.resourceCountIs('AWS::Lambda::LayerVersionPermission', 1);
    template.hasResourceProperties('AWS::Lambda::LayerVersionPermission', {
      Action: 'lambda:GetLayerVersion',
      Principal: '*',
    });

    template.resourceCountIs('AWS::SSM::Parameter', 1);
    template.hasResourceProperties('AWS::SSM::Parameter', {
      Name: '/layers/powertools-layer-arn',
      Type: 'String',
    });

    // Synthesising the stack above runs the local bundling, which installs the
    // utilities into the tmp folder. Assert every publishable utility landed in
    // the layer so the derived list can't silently drop a package.
    const projectRoot = join(import.meta.dirname, '..', '..', '..');
    const packagesDir = join(projectRoot, 'packages');
    const utilities = getLayerUtilities(packagesDir);
    const expectedUtilities = utilities.map((util) => util.workspace);
    const bundledNodeModules = join(
      import.meta.dirname,
      '..',
      '..',
      'tmp',
      'nodejs',
      'node_modules'
    );
    const bundledScopeDir = join(bundledNodeModules, '@aws-lambda-powertools');
    const bundledUtilities = readdirSync(bundledScopeDir).filter(
      (name) => !name.startsWith('.')
    );
    for (const utility of expectedUtilities) {
      expect(bundledUtilities).toContain(utility);
    }
    // The internal testing package is private and must never ship in the layer.
    expect(bundledUtilities).not.toContain('testing-utils');

    // Every version in the layer comes from the repository lockfile (#5981).
    const pinned = collectPinnedPackages(
      JSON.parse(
        readFileSync(join(projectRoot, 'package-lock.json'), 'utf-8')
      ) as Lockfile,
      {
        roots: utilities.map((util) => `packages/${util.workspace}`),
        extraDependencies: ['zod'],
      }
    );
    expect(
      findVersionDrift(
        collectInstalledPackages(bundledNodeModules),
        buildAllowedVersions(
          pinned,
          Object.fromEntries(
            utilities.map((util) => [util.packageName, util.version])
          )
        )
      )
    ).toEqual([]);
    expect(
      collectInstalledPackages(bundledNodeModules).find(
        (entry) => entry.name === 'zod'
      )?.version
    ).toBe(getPinnedVersion(pinned, 'zod'));
  }, 120000);
});
