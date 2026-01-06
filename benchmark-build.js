#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import { performance } from 'perf_hooks';

const ITERATIONS = 20;
const WARMUP_ITERATIONS = 3;

function cleanBuild() {
  try {
    execSync('rm -rf packages/*/lib packages/*/.tsbuildinfo .tsbuildinfo', {
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
      timeout: 60000,
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

function runBenchmarks() {
  console.log('TypeScript Build Performance Benchmark');
  console.log('======================================');
  console.log(`Iterations per test: ${ITERATIONS}`);
  console.log(`Warmup iterations: ${WARMUP_ITERATIONS}`);

  const results = [];

  // Ensure we start with a clean build
  console.log('\nInitial setup...');
  cleanBuild();
  execSync('npm run build', { stdio: 'pipe' });

  console.log('\n=== INDIVIDUAL PACKAGE BUILDS ===');

  // Commons package (no dependencies)
  results.push(
    benchmarkBuild(
      'Commons ESM (Clean)',
      'npx tsc --build tsconfig.json',
      'packages/commons',
      true
    )
  );

  results.push(
    benchmarkBuild(
      'Commons ESM (Incremental)',
      'npx tsc --build tsconfig.json',
      'packages/commons',
      false
    )
  );

  results.push(
    benchmarkBuild(
      'Commons CJS (Clean)',
      'npx tsc --build tsconfig.cjs.json',
      'packages/commons',
      true
    )
  );

  results.push(
    benchmarkBuild(
      'Commons CJS (Incremental)',
      'npx tsc --build tsconfig.cjs.json',
      'packages/commons',
      false
    )
  );

  // Test npm build commands
  results.push(
    benchmarkBuild(
      'Commons NPM Build (Clean)',
      'npm run build',
      'packages/commons',
      true
    )
  );

  results.push(
    benchmarkBuild(
      'Commons NPM Build (Incremental)',
      'npm run build',
      'packages/commons',
      false
    )
  );

  console.log('\n=== LINT PERFORMANCE ===');

  results.push(
    benchmarkBuild('Commons Lint', 'npm run lint', 'packages/commons', false)
  );

  console.log('\n=== FULL MONOREPO BUILDS ===');

  results.push(
    benchmarkBuild('Full Build (Incremental)', 'npm run build', '.', false)
  );

  // Generate report
  console.log('\n\n' + '='.repeat(80));
  console.log('BENCHMARK RESULTS SUMMARY');
  console.log('='.repeat(80));

  // Summary table
  console.log(
    'Test Name'.padEnd(35) +
      'Mean'.padStart(8) +
      'StdDev'.padStart(8) +
      'Min'.padStart(8) +
      'Max'.padStart(8) +
      'P95'.padStart(8)
  );
  console.log('-'.repeat(75));

  results.forEach((result) => {
    const name =
      result.name.length > 34
        ? result.name.substring(0, 31) + '...'
        : result.name;
    console.log(
      name.padEnd(35) +
        `${result.stats.mean}ms`.padStart(8) +
        `${result.stats.stdDev}ms`.padStart(8) +
        `${result.stats.min}ms`.padStart(8) +
        `${result.stats.max}ms`.padStart(8) +
        `${result.stats.p95}ms`.padStart(8)
    );
  });

  // Save detailed results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `benchmark-results-${timestamp}.json`;

  const systemInfo = {
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    cpus: os.cpus().length,
    memory: Math.round(os.totalmem() / 1024 / 1024 / 1024) + 'GB',
    typescriptVersion: execSync('npx tsc --version', {
      encoding: 'utf8',
    }).trim(),
  };

  fs.writeFileSync(
    filename,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        iterations: ITERATIONS,
        warmupIterations: WARMUP_ITERATIONS,
        systemInfo,
        results: results.map((r) => ({
          name: r.name,
          command: r.command,
          workdir: r.workdir,
          stats: r.stats,
          rawTimes: r.times,
        })),
      },
      null,
      2
    )
  );

  console.log(`\nDetailed results saved to: ${filename}`);

  // Analysis
  console.log('\n' + '='.repeat(80));
  console.log('PERFORMANCE ANALYSIS');
  console.log('='.repeat(80));

  const cleanBuilds = results.filter((r) => r.name.includes('Clean'));
  const incrementalBuilds = results.filter((r) =>
    r.name.includes('Incremental')
  );

  if (cleanBuilds.length > 0 && incrementalBuilds.length > 0) {
    const avgClean =
      cleanBuilds.reduce((sum, r) => sum + r.stats.mean, 0) /
      cleanBuilds.length;
    const avgIncremental =
      incrementalBuilds.reduce((sum, r) => sum + r.stats.mean, 0) /
      incrementalBuilds.length;
    const speedup = avgClean / avgIncremental;

    console.log(`Average clean build time: ${Math.round(avgClean)}ms`);
    console.log(
      `Average incremental build time: ${Math.round(avgIncremental)}ms`
    );
    console.log(`Incremental build speedup: ${speedup.toFixed(1)}x faster`);
  }

  const esmBuilds = results.filter((r) => r.name.includes('ESM'));
  const cjsBuilds = results.filter((r) => r.name.includes('CJS'));

  if (esmBuilds.length > 0 && cjsBuilds.length > 0) {
    const avgESM =
      esmBuilds.reduce((sum, r) => sum + r.stats.mean, 0) / esmBuilds.length;
    const avgCJS =
      cjsBuilds.reduce((sum, r) => sum + r.stats.mean, 0) / cjsBuilds.length;

    console.log(`Average ESM build time: ${Math.round(avgESM)}ms`);
    console.log(`Average CJS build time: ${Math.round(avgCJS)}ms`);

    if (avgESM !== avgCJS) {
      const faster = avgESM < avgCJS ? 'ESM' : 'CJS';
      const ratio = Math.max(avgESM, avgCJS) / Math.min(avgESM, avgCJS);
      console.log(`${faster} builds are ${ratio.toFixed(1)}x faster`);
    }
  }

  console.log('\nSystem Information:');
  console.log(`  Node.js: ${systemInfo.nodeVersion}`);
  console.log(`  TypeScript: ${systemInfo.typescriptVersion}`);
  console.log(`  Platform: ${systemInfo.platform} ${systemInfo.arch}`);
  console.log(`  CPUs: ${systemInfo.cpus}`);
  console.log(`  Memory: ${systemInfo.memory}`);

  console.log('\n' + '='.repeat(80));
  console.log('BASELINE ESTABLISHED FOR TYPESCRIPT BUILD PERFORMANCE');
  console.log('='.repeat(80));
  console.log('Key findings:');

  // Find fastest and slowest builds
  const sortedByMean = [...results].sort((a, b) => a.stats.mean - b.stats.mean);
  console.log(
    `Fastest build: ${sortedByMean[0].name} (${sortedByMean[0].stats.mean}ms)`
  );
  console.log(
    `Slowest build: ${sortedByMean[sortedByMean.length - 1].name} (${sortedByMean[sortedByMean.length - 1].stats.mean}ms)`
  );

  console.log(
    '\nThis baseline can be used to compare against @typescript/native-preview'
  );
  console.log('performance improvements. Focus areas for comparison:');
  console.log('- Clean vs Incremental build performance');
  console.log('- ESM vs CJS compilation times');
  console.log('- Individual package vs monorepo build times');
  console.log('- Lint performance (if using TypeScript for linting)');
}

runBenchmarks();
