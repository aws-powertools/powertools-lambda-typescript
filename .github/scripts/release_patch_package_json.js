/**
 * This script is used to update the package.json file of an utility to include pre-release suffixes
 * and remove fields that are not needed in the tarball that will be published to npm.
 *
 * We read the original package.json file and extract all the fields. Then, if the is an
 * alpha or beta package, we update the version number to include a suffix. Finally, we write the updated
 * package.json file to disk that includes the patched version number and all the fields we want to keep.
 *
 * The file will be restored to its original state after the release is complete.
 */
const { readFileSync, writeFileSync } = require('node:fs');
const { join, resolve } = require('node:path');

if (process.argv.length < 3) {
  console.error('Usage: node release_patch_package_json.js <package_path>\n');
  process.exit(1);
}
const basePath = resolve(process.argv[2]);
const packageJsonPath = join(basePath, 'package.json');
const alphaPackages = [
  '@aws-lambda-powertools/event-handler'
];
const betaPackages = [];

(() => {
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
    peerDependencies,
    peerDependenciesMeta,
    exports,
    typesVersions,
    main,
    types,
    files,
    private: privateField,
    type,
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
    peerDependencies,
    peerDependenciesMeta,
    main,
    types,
    files,
    type,
  };

  // Not all utilities have these fields, so only add them if they exist to avoid
  // having empty or undefined fields in the package.json file.
  if (exports) {
    newPkgJson.exports = exports;
  }
  if (typesVersions) {
    newPkgJson.typesVersions = typesVersions;
  }
  if (privateField) {
    newPkgJson.private = privateField;
  }

  // Temporarily update the original package.json file.
  // This version will be picked up during the `npm publish` step, so that
  // the version number and metadata in the registry are correct and match the tarball.
  writeFileSync('package.json', JSON.stringify(newPkgJson, null, 2));
})();
