#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

const ITERATIONS = 100;
const WARMUP_RUNS = 5;

function cleanup() {
  try {
    execSync(
      'rm -rf lib packages/commons/lib packages/commons/.tsbuildinfo tsconfig.native.tsbuildinfo',
      { stdio: 'ignore' }
    );
  } catch {}
}

function runCommand(cmd, cwd = process.cwd()) {
  const start = process.hrtime.bigint();
  try {
    execSync(cmd, { cwd, stdio: 'ignore' });
    const end = process.hrtime.bigint();
    return Number(end - start) / 1000000; // Convert to milliseconds
  } catch (error) {
    console.error(`Command failed: ${cmd}`);
    throw error;
  }
}

function calculateStats(times) {
  const sorted = times.slice().sort((a, b) => a - b);
  const sum = times.reduce((a, b) => a + b, 0);
  const mean = sum / times.length;
  const variance =
    times.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / times.length;

  return {
    mean: mean,
    median: sorted[Math.floor(sorted.length / 2)],
    min: sorted[0],
    max: sorted[sorted.length - 1],
    stdDev: Math.sqrt(variance),
    p95: sorted[Math.floor(sorted.length * 0.95)],
    p99: sorted[Math.floor(sorted.length * 0.99)],
  };
}

function benchmark() {
  console.log('Starting TypeScript compiler benchmark...');
  console.log(`Iterations: ${ITERATIONS}, Warmup runs: ${WARMUP_RUNS}`);

  const results = {
    native: { clean: [], incremental: [] },
    regular: { clean: [], incremental: [] },
  };

  // Native compiler benchmarks
  console.log('\n=== Native TypeScript Compiler ===');

  // Clean builds
  console.log('Running native clean builds...');
  for (let i = 0; i < ITERATIONS + WARMUP_RUNS; i++) {
    cleanup();
    const time = runCommand(
      'node node_modules/@typescript/native-preview/bin/tsgo.js -p tsconfig.native.json'
    );
    if (i >= WARMUP_RUNS) {
      results.native.clean.push(time);
    }
    if ((i + 1) % 20 === 0)
      console.log(
        `  Completed ${i + 1 - WARMUP_RUNS}/${ITERATIONS} iterations`
      );
  }

  // Incremental builds
  console.log('Running native incremental builds...');
  cleanup();
  runCommand(
    'node node_modules/@typescript/native-preview/bin/tsgo.js -p tsconfig.native.json'
  ); // Initial build

  for (let i = 0; i < ITERATIONS + WARMUP_RUNS; i++) {
    const time = runCommand(
      'node node_modules/@typescript/native-preview/bin/tsgo.js -p tsconfig.native.json'
    );
    if (i >= WARMUP_RUNS) {
      results.native.incremental.push(time);
    }
    if ((i + 1) % 20 === 0)
      console.log(
        `  Completed ${i + 1 - WARMUP_RUNS}/${ITERATIONS} iterations`
      );
  }

  // Regular compiler benchmarks
  console.log('\n=== Regular TypeScript Compiler ===');

  // Clean builds
  console.log('Running regular clean builds...');
  for (let i = 0; i < ITERATIONS + WARMUP_RUNS; i++) {
    cleanup();
    const time = runCommand('npx tsc -p packages/commons/tsconfig.json');
    if (i >= WARMUP_RUNS) {
      results.regular.clean.push(time);
    }
    if ((i + 1) % 20 === 0)
      console.log(
        `  Completed ${i + 1 - WARMUP_RUNS}/${ITERATIONS} iterations`
      );
  }

  // Incremental builds
  console.log('Running regular incremental builds...');
  cleanup();
  runCommand('npx tsc -p packages/commons/tsconfig.json'); // Initial build

  for (let i = 0; i < ITERATIONS + WARMUP_RUNS; i++) {
    const time = runCommand('npx tsc -p packages/commons/tsconfig.json');
    if (i >= WARMUP_RUNS) {
      results.regular.incremental.push(time);
    }
    if ((i + 1) % 20 === 0)
      console.log(
        `  Completed ${i + 1 - WARMUP_RUNS}/${ITERATIONS} iterations`
      );
  }

  return results;
}

function generateReport(results) {
  const nativeCleanStats = calculateStats(results.native.clean);
  const nativeIncrementalStats = calculateStats(results.native.incremental);
  const regularCleanStats = calculateStats(results.regular.clean);
  const regularIncrementalStats = calculateStats(results.regular.incremental);

  const cleanSpeedup = regularCleanStats.mean / nativeCleanStats.mean;
  const incrementalSpeedup =
    regularIncrementalStats.mean / nativeIncrementalStats.mean;

  const report = {
    timestamp: new Date().toISOString(),
    iterations: ITERATIONS,
    warmupRuns: WARMUP_RUNS,
    results: {
      native: {
        clean: nativeCleanStats,
        incremental: nativeIncrementalStats,
      },
      regular: {
        clean: regularCleanStats,
        incremental: regularIncrementalStats,
      },
    },
    comparison: {
      cleanBuildSpeedup: cleanSpeedup,
      incrementalBuildSpeedup: incrementalSpeedup,
      cleanBuildImprovement: ((cleanSpeedup - 1) * 100).toFixed(1) + '%',
      incrementalBuildImprovement:
        ((incrementalSpeedup - 1) * 100).toFixed(1) + '%',
    },
  };

  console.log('\n' + '='.repeat(60));
  console.log('TYPESCRIPT COMPILER BENCHMARK RESULTS');
  console.log('='.repeat(60));

  console.log('\nCLEAN BUILDS:');
  console.log(
    `Native Compiler:   ${nativeCleanStats.mean.toFixed(0)}ms (±${nativeCleanStats.stdDev.toFixed(0)}ms)`
  );
  console.log(
    `Regular Compiler:  ${regularCleanStats.mean.toFixed(0)}ms (±${regularCleanStats.stdDev.toFixed(0)}ms)`
  );
  console.log(
    `Speedup:           ${cleanSpeedup.toFixed(2)}x (${report.comparison.cleanBuildImprovement})`
  );

  console.log('\nINCREMENTAL BUILDS:');
  console.log(
    `Native Compiler:   ${nativeIncrementalStats.mean.toFixed(0)}ms (±${nativeIncrementalStats.stdDev.toFixed(0)}ms)`
  );
  console.log(
    `Regular Compiler:  ${regularIncrementalStats.mean.toFixed(0)}ms (±${regularIncrementalStats.stdDev.toFixed(0)}ms)`
  );
  console.log(
    `Speedup:           ${incrementalSpeedup.toFixed(2)}x (${report.comparison.incrementalBuildImprovement})`
  );

  console.log('\nDETAILED STATISTICS:');
  console.log(
    'Native Clean    - Min:',
    nativeCleanStats.min.toFixed(0) + 'ms',
    'Max:',
    nativeCleanStats.max.toFixed(0) + 'ms',
    'P95:',
    nativeCleanStats.p95.toFixed(0) + 'ms'
  );
  console.log(
    'Regular Clean   - Min:',
    regularCleanStats.min.toFixed(0) + 'ms',
    'Max:',
    regularCleanStats.max.toFixed(0) + 'ms',
    'P95:',
    regularCleanStats.p95.toFixed(0) + 'ms'
  );
  console.log(
    'Native Incr     - Min:',
    nativeIncrementalStats.min.toFixed(0) + 'ms',
    'Max:',
    nativeIncrementalStats.max.toFixed(0) + 'ms',
    'P95:',
    nativeIncrementalStats.p95.toFixed(0) + 'ms'
  );
  console.log(
    'Regular Incr    - Min:',
    regularIncrementalStats.min.toFixed(0) + 'ms',
    'Max:',
    regularIncrementalStats.max.toFixed(0) + 'ms',
    'P95:',
    regularIncrementalStats.p95.toFixed(0) + 'ms'
  );

  // Save detailed results
  fs.writeFileSync('benchmark-results.json', JSON.stringify(report, null, 2));
  console.log('\nDetailed results saved to benchmark-results.json');

  return report;
}

// Run benchmark
try {
  const results = benchmark();
  generateReport(results);
  cleanup();
} catch (error) {
  console.error('Benchmark failed:', error.message);
  cleanup();
  process.exit(1);
}
