import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const cjsPackageJson = '{ "type": "commonjs" }';
writeFileSync(
  join(__dirname, '..', 'lib', 'cjs', 'package.json'),
  cjsPackageJson,
  'utf-8'
);

const esmPackageJson = '{ "type": "module" }';
writeFileSync(
  join(__dirname, '..', 'lib', 'esm', 'package.json'),
  esmPackageJson,
  'utf-8'
);
