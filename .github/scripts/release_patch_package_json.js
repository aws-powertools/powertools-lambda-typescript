const { readFileSync, writeFileSync } = require('node:fs');
const { join, resolve } = require('node:path');

if (process.argv.length < 3) {
  console.error('Usage: node release_patch_package_json.js <package_path>\n');
  process.exit(1);
}
const basePath = resolve(process.argv[2]);
const packageJsonPath = join(basePath, 'package.json');
const alphaPackages = ['@aws-lambda-powertools/idempotency'];
const betaPackages = ['@aws-lambda-powertools/parameters'];

/**
 * This script is used to create a new package.json file for the tarball that will be published to npm.
 *
 * The original package.json file is read and the following fields are extracted:
 * - name
 * - version
 * - description
 * - author
 * - license
 * - homepage
 * - repository
 * - bugs
 * - keywords
 * - dependencies
 * - devDependencies
 *
 * For beta packages, the version number is updated to include a beta suffix.
 *
 * The new package.json file is written to the lib folder, which is the folder that will be packed and published to npm.
 * For beta packages, the original package.json file is also temporarily updated with the new beta version number so that
 * the version number in the registry is correct and matches the tarball.
 */
(() => {
  try {
    // Read the original package.json file
    const pkgJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    // Extract the fields we want to keep
    const {
      name,
      version: originalVersion,
      description,
      author,
      license,
      homepage,
      repository,
      bugs,
      keywords,
      dependencies,
      exports,
      typesVersions,
      main,
      types,
    } = pkgJson;

    let version = originalVersion;
    // If the package is an alpha or beta package, update the version number to include a suffix
    if (alphaPackages.includes(name)) {
      version = `${version}-alpha`;
    } else if (betaPackages.includes(name)) {
      version = `${version}-beta`;
    }

    // Create a new package.json file with the updated version for the tarball
    const newPkgJson = {
      name,
      version,
      description,
      author,
      license,
      homepage,
      repository,
      bugs,
      keywords,
      dependencies,
    };

    // Write the new package.json file inside the folder that will be packed
    writeFileSync(
      `${outDir}/package.json`,
      JSON.stringify(newPkgJson, null, 2)
    );

    if (betaPackages.includes(name) || alphaPackages.includes(name)) {
      // Temporarily update the original package.json file with the new beta version.
      // This version number will be picked up during the `npm publish` step, so that
      // the version number in the registry is correct and matches the tarball.
      // The original package.json file will be restored by lerna after the publish step.
      writeFileSync(
        'package.json',
        JSON.stringify({ ...pkgJson, version }, null, 2)
      );
    }
  } catch (err) {
    throw err;
  }
})();
