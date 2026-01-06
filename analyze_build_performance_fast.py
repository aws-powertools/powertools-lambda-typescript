#!/usr/bin/env python3
"""
GitHub Actions Build Performance Analysis Script - Optimized Version
"""

import json
import subprocess
import sys
from datetime import datetime
from statistics import mean, median, stdev
from collections import defaultdict

def run_gh_command(cmd):
    """Run a GitHub CLI command and return parsed JSON result"""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, check=True)
        return json.loads(result.stdout)
    except Exception as e:
        print(f"Error with command: {cmd[:50]}...")
        return None

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

def main():
    print("🔍 GitHub Actions Build Performance Analysis")
    print("=" * 60)
    
    # Get recent successful runs
    print("📊 Fetching recent workflow runs...")
    cmd = 'gh run list --workflow="On PR code update" --limit=30 --json databaseId,status,conclusion,createdAt,updatedAt'
    runs = run_gh_command(cmd)
    
    if not runs:
        print("❌ Failed to fetch runs")
        return
    
    successful_runs = [r for r in runs if r.get('conclusion') == 'success'][:20]
    print(f"✅ Analyzing {len(successful_runs)} successful runs")
    
    # Collect timing data
    all_job_durations = defaultdict(list)
    setup_durations = []
    total_workflow_durations = []
    
    for i, run in enumerate(successful_runs):
        print(f"Processing run {i+1}/{len(successful_runs)}: {run['databaseId']}")
        
        # Get run details
        cmd = f"gh run view {run['databaseId']} --json jobs"
        run_data = run_gh_command(cmd)
        
        if not run_data or 'jobs' not in run_data:
            continue
        
        job_durations = []
        
        for job in run_data['jobs']:
            job_name = job.get('name', '')
            job_start = job.get('startedAt')
            job_end = job.get('completedAt')
            
            if job_start and job_end:
                duration = calculate_duration(job_start, job_end)
                if duration:
                    all_job_durations[job_name].append(duration)
                    job_durations.append(duration)
                    
                    # Look for setup dependencies step
                    for step in job.get('steps', []):
                        step_name = step.get('name', '').lower()
                        if 'setup dependencies' in step_name:
                            step_start = step.get('startedAt')
                            step_end = step.get('completedAt')
                            if step_start and step_end:
                                setup_duration = calculate_duration(step_start, step_end)
                                if setup_duration:
                                    setup_durations.append(setup_duration)
        
        # Workflow duration is the maximum job duration (since jobs run in parallel)
        if job_durations:
            total_workflow_durations.append(max(job_durations))
    
    # Calculate and display statistics
    print("\n📈 Build Performance Results")
    print("=" * 40)
    
    # Overall workflow performance
    if total_workflow_durations:
        print(f"\n🎯 Overall Workflow Performance:")
        print(f"  Runs analyzed: {len(total_workflow_durations)}")
        print(f"  Mean duration: {mean(total_workflow_durations):.1f}s ({mean(total_workflow_durations)/60:.1f}m)")
        print(f"  Median duration: {median(total_workflow_durations):.1f}s ({median(total_workflow_durations)/60:.1f}m)")
        print(f"  Min duration: {min(total_workflow_durations):.1f}s ({min(total_workflow_durations)/60:.1f}m)")
        print(f"  Max duration: {max(total_workflow_durations):.1f}s ({max(total_workflow_durations)/60:.1f}m)")
        if len(total_workflow_durations) > 1:
            print(f"  Std deviation: {stdev(total_workflow_durations):.1f}s")
    
    # Setup dependencies performance (includes TypeScript compilation)
    if setup_durations:
        print(f"\n🔧 'Setup Dependencies' Step Performance (includes TS compilation):")
        print(f"  Samples: {len(setup_durations)}")
        print(f"  Mean duration: {mean(setup_durations):.1f}s ({mean(setup_durations)/60:.1f}m)")
        print(f"  Median duration: {median(setup_durations):.1f}s ({median(setup_durations)/60:.1f}m)")
        print(f"  Min duration: {min(setup_durations):.1f}s")
        print(f"  Max duration: {max(setup_durations):.1f}s")
        if len(setup_durations) > 1:
            print(f"  Std deviation: {stdev(setup_durations):.1f}s")
    
    # Top job types by duration
    print(f"\n🏗️  Top Job Types by Average Duration:")
    job_stats = []
    for job_name, durations in all_job_durations.items():
        if len(durations) >= 3:  # Only jobs with enough samples
            avg_duration = mean(durations)
            job_stats.append((job_name, avg_duration, len(durations)))
    
    # Sort by average duration and show top 5
    for job_name, avg_duration, count in sorted(job_stats, key=lambda x: x[1], reverse=True)[:5]:
        print(f"  {job_name}: {avg_duration:.1f}s (avg from {count} runs)")
    
    # Performance insights
    print(f"\n💡 Key Insights:")
    
    if setup_durations:
        avg_setup = mean(setup_durations)
        if total_workflow_durations:
            avg_total = mean(total_workflow_durations)
            setup_percentage = (avg_setup / avg_total) * 100
            print(f"  • Setup Dependencies accounts for ~{setup_percentage:.1f}% of total build time")
        
        print(f"  • TypeScript compilation + npm install averages {avg_setup:.1f}s ({avg_setup/60:.1f}m)")
    
    # Variability analysis
    if total_workflow_durations and len(total_workflow_durations) > 1:
        cv = (stdev(total_workflow_durations) / mean(total_workflow_durations)) * 100
        print(f"  • Build time variability: {cv:.1f}% (coefficient of variation)")
        
        if cv > 20:
            print(f"    ⚠️  High variability suggests inconsistent performance")
        elif cv < 10:
            print(f"    ✅ Low variability indicates consistent performance")
    
    # Performance trend (if we have enough data)
    if len(total_workflow_durations) >= 10:
        recent_5 = total_workflow_durations[:5]  # Most recent
        older_5 = total_workflow_durations[-5:]  # Oldest in our sample
        
        recent_avg = mean(recent_5)
        older_avg = mean(older_5)
        trend = ((recent_avg - older_avg) / older_avg) * 100
        
        print(f"  • Recent trend: {trend:+.1f}% vs older runs")
        if abs(trend) < 5:
            print(f"    → Stable performance")
        elif trend > 0:
            print(f"    → Performance regression detected")
        else:
            print(f"    → Performance improvement detected")
    
    print(f"\n🎉 Analysis complete!")
    print(f"This represents real CI build performance including TypeScript compilation.")

if __name__ == "__main__":
    main()