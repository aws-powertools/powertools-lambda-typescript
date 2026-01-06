#!/usr/bin/env python3
"""
GitHub Actions Build Performance Analysis Script
Analyzes TypeScript build performance from GitHub Actions workflow runs
"""

import json
import subprocess
import sys
from datetime import datetime
from statistics import mean, median, stdev
from collections import defaultdict
import re

def run_gh_command(cmd):
    """Run a GitHub CLI command and return parsed JSON result"""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, check=True)
        return json.loads(result.stdout)
    except subprocess.CalledProcessError as e:
        print(f"Error running command: {cmd}")
        print(f"Error: {e.stderr}")
        return None
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON from command: {cmd}")
        print(f"Error: {e}")
        return None

def get_workflow_runs(workflow_name, limit=100):
    """Get workflow runs for a specific workflow"""
    cmd = f'gh run list --workflow="{workflow_name}" --limit={limit} --json databaseId,status,conclusion,createdAt,updatedAt,workflowName'
    return run_gh_command(cmd)

def get_run_details(run_id):
    """Get detailed job information for a specific run"""
    cmd = f'gh run view {run_id} --json jobs'
    return run_gh_command(cmd)

def parse_timestamp(timestamp_str):
    """Parse GitHub timestamp to datetime object"""
    return datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))

def calculate_duration(start_time, end_time):
    """Calculate duration in seconds between two timestamps"""
    if not start_time or not end_time:
        return None
    start = parse_timestamp(start_time)
    end = parse_timestamp(end_time)
    return (end - start).total_seconds()

def extract_build_timings(run_data):
    """Extract build-related timing data from a workflow run"""
    if not run_data or 'jobs' not in run_data:
        return {}
    
    timings = {}
    
    for job in run_data['jobs']:
        job_name = job.get('name', '')
        job_start = job.get('startedAt')
        job_end = job.get('completedAt')
        
        if not job_start or not job_end:
            continue
            
        job_duration = calculate_duration(job_start, job_end)
        if job_duration is None:
            continue
            
        # Extract step timings
        steps = {}
        for step in job.get('steps', []):
            step_name = step.get('name', '')
            step_start = step.get('startedAt')
            step_end = step.get('completedAt')
            
            if step_start and step_end:
                step_duration = calculate_duration(step_start, step_end)
                if step_duration is not None:
                    steps[step_name] = step_duration
        
        timings[job_name] = {
            'total_duration': job_duration,
            'steps': steps
        }
    
    return timings

def analyze_build_performance():
    """Main analysis function"""
    print("🔍 Analyzing GitHub Actions Build Performance for aws-lambda-powertools-typescript")
    print("=" * 80)
    
    # Get workflow runs
    print("\n📊 Fetching workflow runs...")
    runs = get_workflow_runs("On PR code update", 100)
    
    if not runs:
        print("❌ Failed to fetch workflow runs")
        return
    
    # Filter successful runs only
    successful_runs = [run for run in runs if run.get('conclusion') == 'success']
    print(f"✅ Found {len(successful_runs)} successful runs out of {len(runs)} total runs")
    
    # Collect timing data
    print("\n⏱️  Extracting timing data from runs...")
    all_timings = []
    build_step_durations = defaultdict(list)
    job_durations = defaultdict(list)
    
    for i, run in enumerate(successful_runs[:50]):  # Analyze first 50 successful runs
        run_id = run['databaseId']
        print(f"Processing run {i+1}/50: {run_id}", end='\r')
        
        run_details = get_run_details(run_id)
        if not run_details:
            continue
            
        timings = extract_build_timings(run_details)
        if timings:
            all_timings.append({
                'run_id': run_id,
                'created_at': run['createdAt'],
                'timings': timings
            })
            
            # Collect job durations
            for job_name, job_data in timings.items():
                job_durations[job_name].append(job_data['total_duration'])
                
                # Collect step durations (focus on build-related steps)
                for step_name, step_duration in job_data['steps'].items():
                    if any(keyword in step_name.lower() for keyword in ['setup dependencies', 'linting', 'unit tests', 'setup']):
                        build_step_durations[f"{job_name} - {step_name}"].append(step_duration)
    
    print(f"\n✅ Processed {len(all_timings)} runs successfully")
    
    # Calculate statistics
    print("\n📈 Build Performance Statistics")
    print("=" * 50)
    
    # Job-level statistics
    print("\n🏗️  Job Duration Statistics (seconds):")
    for job_name, durations in sorted(job_durations.items()):
        if len(durations) >= 5:  # Only show jobs with enough data points
            stats = {
                'count': len(durations),
                'mean': mean(durations),
                'median': median(durations),
                'min': min(durations),
                'max': max(durations),
                'std_dev': stdev(durations) if len(durations) > 1 else 0
            }
            
            print(f"\n{job_name}:")
            print(f"  Count: {stats['count']}")
            print(f"  Mean: {stats['mean']:.1f}s")
            print(f"  Median: {stats['median']:.1f}s")
            print(f"  Min: {stats['min']:.1f}s")
            print(f"  Max: {stats['max']:.1f}s")
            print(f"  Std Dev: {stats['std_dev']:.1f}s")
    
    # Step-level statistics for build-related steps
    print("\n🔧 Build Step Duration Statistics (seconds):")
    for step_name, durations in sorted(build_step_durations.items()):
        if len(durations) >= 5 and 'setup dependencies' in step_name.lower():
            stats = {
                'count': len(durations),
                'mean': mean(durations),
                'median': median(durations),
                'min': min(durations),
                'max': max(durations),
                'std_dev': stdev(durations) if len(durations) > 1 else 0
            }
            
            print(f"\n{step_name}:")
            print(f"  Count: {stats['count']}")
            print(f"  Mean: {stats['mean']:.1f}s")
            print(f"  Median: {stats['median']:.1f}s")
            print(f"  Min: {stats['min']:.1f}s")
            print(f"  Max: {stats['max']:.1f}s")
            print(f"  Std Dev: {stats['std_dev']:.1f}s")
    
    # Overall workflow statistics
    print("\n🎯 Overall Workflow Performance:")
    if all_timings:
        total_durations = []
        for timing_data in all_timings:
            # Calculate total workflow duration (max job end time - min job start time)
            job_starts = []
            job_ends = []
            
            for job_name, job_data in timing_data['timings'].items():
                # We need to reconstruct start/end times from the duration
                # This is an approximation since we only have durations
                total_durations.append(job_data['total_duration'])
        
        if total_durations:
            # Use the longest job duration as a proxy for workflow duration
            workflow_durations = []
            for timing_data in all_timings:
                max_job_duration = max(job_data['total_duration'] for job_data in timing_data['timings'].values())
                workflow_durations.append(max_job_duration)
            
            print(f"  Analyzed Runs: {len(workflow_durations)}")
            print(f"  Mean Duration: {mean(workflow_durations):.1f}s ({mean(workflow_durations)/60:.1f}m)")
            print(f"  Median Duration: {median(workflow_durations):.1f}s ({median(workflow_durations)/60:.1f}m)")
            print(f"  Min Duration: {min(workflow_durations):.1f}s ({min(workflow_durations)/60:.1f}m)")
            print(f"  Max Duration: {max(workflow_durations):.1f}s ({max(workflow_durations)/60:.1f}m)")
            print(f"  Std Dev: {stdev(workflow_durations):.1f}s" if len(workflow_durations) > 1 else "  Std Dev: 0.0s")
    
    # Performance trends
    print("\n📊 Performance Trends:")
    if len(all_timings) >= 10:
        # Compare first 10 vs last 10 runs
        first_10 = all_timings[-10:]  # Most recent runs are at the end
        last_10 = all_timings[:10]   # Oldest runs are at the beginning
        
        first_10_durations = [max(job_data['total_duration'] for job_data in timing['timings'].values()) for timing in first_10]
        last_10_durations = [max(job_data['total_duration'] for job_data in timing['timings'].values()) for timing in last_10]
        
        first_10_avg = mean(first_10_durations)
        last_10_avg = mean(last_10_durations)
        
        trend = ((first_10_avg - last_10_avg) / last_10_avg) * 100
        
        print(f"  Recent 10 runs avg: {first_10_avg:.1f}s")
        print(f"  Oldest 10 runs avg: {last_10_avg:.1f}s")
        print(f"  Trend: {trend:+.1f}% ({'improvement' if trend < 0 else 'regression'})")
    
    # Key insights
    print("\n💡 Key Insights:")
    
    # Find the most time-consuming steps
    setup_deps_times = []
    for step_name, durations in build_step_durations.items():
        if 'setup dependencies' in step_name.lower() and durations:
            setup_deps_times.extend(durations)
    
    if setup_deps_times:
        avg_setup_time = mean(setup_deps_times)
        print(f"  • Average 'Setup dependencies' time: {avg_setup_time:.1f}s ({avg_setup_time/60:.1f}m)")
        print(f"    This includes npm install and TypeScript compilation")
    
    # Find jobs with highest variability
    high_variability_jobs = []
    for job_name, durations in job_durations.items():
        if len(durations) >= 5:
            cv = (stdev(durations) / mean(durations)) * 100  # Coefficient of variation
            if cv > 20:  # More than 20% variability
                high_variability_jobs.append((job_name, cv))
    
    if high_variability_jobs:
        print(f"  • Jobs with high timing variability (>20%):")
        for job_name, cv in sorted(high_variability_jobs, key=lambda x: x[1], reverse=True)[:3]:
            print(f"    - {job_name}: {cv:.1f}% variability")
    
    print(f"\n🎉 Analysis complete! Processed {len(all_timings)} successful workflow runs.")
    print("This data represents real-world CI build performance including TypeScript compilation.")

if __name__ == "__main__":
    analyze_build_performance()