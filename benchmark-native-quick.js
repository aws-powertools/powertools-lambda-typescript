#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import { performance } from 'perf_hooks';

const ITERATIONS = 20;
const WARMUP_ITERATIONS = 3;

function cleanBuild() {
  try {
    execSync('rm -rf packages/commons/lib packages/commons/.tsbuildinfo', {
      stdio: 'pipe',
    });
  } catch {
    // Ignore errors
  }
}

function measureCommand(command, workdir = '.') {
  const start = performance.now();
  try {
    execSync(command, {
      stdio: 'pipe',
      cwd: workdir,
      timeout: 30000,
    });
    return performance.now() - start;
  } catch (error) {
    console.error(`Command failed: ${command} in ${workdir}`);
    throw error;
  }
}

function calculateStats(times) {
  const sorted = [...times].sort((a, b) => a - b);
  const mean = times.reduce((a, b) => a + b, 0) / times.length;
  const median = sorted[Math.floor(sorted.length / 2)];
  const variance =
    times.reduce((acc, val) => acc + (val - mean) ** 2, 0) / times.length;
  const stdDev = Math.sqrt(variance);

  return {
    mean: Math.round(mean),
    median: Math.round(median),
    stdDev: Math.round(stdDev),
    min: Math.round(sorted[0]),
    max: Math.round(sorted[sorted.length - 1]),
    p95: Math.round(sorted[Math.floor(sorted.length * 0.95)]),
  };
}

function benchmarkBuild(name, command, workdir = '.', cleanFirst = false) {
  console.log(`\nBenchmarking: ${name}`);

  const times = [];

  // Warmup
  for (let i = 0; i < WARMUP_ITERATIONS; i++) {
    if (cleanFirst) cleanBuild();
    measureCommand(command, workdir);
  }

  // Actual benchmark
  console.log(`Running ${ITERATIONS} iterations...`);
  for (let i = 0; i < ITERATIONS; i++) {
    if (cleanFirst) cleanBuild();
    const time = measureCommand(command, workdir);
    times.push(time);

    if ((i + 1) % 5 === 0) {
      console.log(`  ${i + 1}/${ITERATIONS} complete`);
    }
  }

  return { name, command, workdir, times, stats: calculateStats(times) };
}

console.log('Quick Native TypeScript Benchmark');
console.log('=================================');

// Create temporary tsconfig without baseUrl for native compiler
const tempTsConfig = {
  compilerOptions: {
    target: 'ES2023',
    module: 'NodeNext',
    moduleResolution: 'NodeNext',
    declaration: true,
    isolatedModules: true,
    esModuleInterop: true,
    forceConsistentCasingInFileNames: true,
    strict: true,
    skipLibCheck: true,
    outDir: './lib/esm',
    rootDir: './src',
  },
  include: ['./src/**/*'],
};

fs.writeFileSync(
  'packages/commons/tsconfig.native.json',
  JSON.stringify(tempTsConfig, null, 2)
);

const results = [];

// Test native compiler
results.push(
  benchmarkBuild(
    'Native TS (Clean)',
    'node ../../node_modules/@typescript/native-preview/bin/tsgo.js -p tsconfig.native.json',
    'packages/commons',
    true
  )
);

results.push(
  benchmarkBuild(
    'Native TS (Incremental)',
    'node ../../node_modules/@typescript/native-preview/bin/tsgo.js -p tsconfig.native.json',
    'packages/commons',
    false
  )
);

// Test regular TypeScript
results.push(
  benchmarkBuild(
    'Regular TS (Clean)',
    'npx tsc -p tsconfig.native.json',
    'packages/commons',
    true
  )
);

results.push(
  benchmarkBuild(
    'Regular TS (Incremental)',
    'npx tsc -p tsconfig.native.json',
    'packages/commons',
    false
  )
);

// Results
console.log('\n' + '='.repeat(60));
console.log('RESULTS COMPARISON');
console.log('='.repeat(60));

console.log(
  'Test'.padEnd(25) +
    'Mean'.padStart(8) +
    'Min'.padStart(8) +
    'Max'.padStart(8) +
    'StdDev'.padStart(8)
);
console.log('-'.repeat(57));

results.forEach((result) => {
  console.log(
    result.name.padEnd(25) +
      `${result.stats.mean}ms`.padStart(8) +
      `${result.stats.min}ms`.padStart(8) +
      `${result.stats.max}ms`.padStart(8) +
      `${result.stats.stdDev}ms`.padStart(8)
  );
});

// Performance comparison
console.log('\n' + '='.repeat(60));
console.log('PERFORMANCE ANALYSIS');
console.log('='.repeat(60));

const nativeClean = results.find((r) => r.name === 'Native TS (Clean)');
const regularClean = results.find((r) => r.name === 'Regular TS (Clean)');
const nativeIncremental = results.find(
  (r) => r.name === 'Native TS (Incremental)'
);
const regularIncremental = results.find(
  (r) => r.name === 'Regular TS (Incremental)'
);

if (nativeClean && regularClean) {
  const speedup = regularClean.stats.mean / nativeClean.stats.mean;
  const improvement =
    ((regularClean.stats.mean - nativeClean.stats.mean) /
      regularClean.stats.mean) *
    100;

  console.log('Clean Build Comparison:');
  console.log(`  Regular TypeScript: ${regularClean.stats.mean}ms`);
  console.log(`  Native TypeScript:  ${nativeClean.stats.mean}ms`);
  console.log(
    `  Native is ${speedup.toFixed(2)}x faster (${improvement.toFixed(1)}% improvement)`
  );
}

if (nativeIncremental && regularIncremental) {
  const speedup = regularIncremental.stats.mean / nativeIncremental.stats.mean;
  const improvement =
    ((regularIncremental.stats.mean - nativeIncremental.stats.mean) /
      regularIncremental.stats.mean) *
    100;

  console.log('\nIncremental Build Comparison:');
  console.log(`  Regular TypeScript: ${regularIncremental.stats.mean}ms`);
  console.log(`  Native TypeScript:  ${nativeIncremental.stats.mean}ms`);
  console.log(
    `  Native is ${speedup.toFixed(2)}x faster (${improvement.toFixed(1)}% improvement)`
  );
}

// System info
const systemInfo = {
  nodeVersion: process.version,
  platform: process.platform,
  arch: process.arch,
  cpus: os.cpus().length,
  regularTypescriptVersion: execSync('npx tsc --version', {
    encoding: 'utf8',
  }).trim(),
  nativeTypescriptVersion: execSync(
    'node node_modules/@typescript/native-preview/bin/tsgo.js --version',
    { encoding: 'utf8' }
  ).trim(),
};

console.log('\nSystem Information:');
console.log(`  Node.js: ${systemInfo.nodeVersion}`);
console.log(`  Regular TypeScript: ${systemInfo.regularTypescriptVersion}`);
console.log(`  Native TypeScript: ${systemInfo.nativeTypescriptVersion}`);
console.log(`  Platform: ${systemInfo.platform} ${systemInfo.arch}`);
console.log(`  CPUs: ${systemInfo.cpus}`);

// Cleanup
try {
  fs.unlinkSync('packages/commons/tsconfig.native.json');
} catch {}

console.log('\n' + '='.repeat(60));
console.log('BENCHMARK COMPLETE');
console.log('='.repeat(60));
