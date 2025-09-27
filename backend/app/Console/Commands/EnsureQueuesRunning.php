<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class EnsureQueuesRunning extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'queue:ensure-running 
                          {--check : Just check if queues are running}
                          {--restart : Restart queue workers if needed}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Ensure queue workers are running and healthy';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🔍 Checking queue worker status...');

        // Check if there are any pending jobs
        $pendingJobs = $this->checkPendingJobs();
        
        if ($pendingJobs > 0) {
            $this->warn("⚠️  Found {$pendingJobs} pending job(s) in queue");
        } else {
            $this->info('✅ No pending jobs in queue');
        }

        // Check if we're in a containerized environment
        if ($this->isContainerized()) {
            $this->info('🐳 Running in containerized environment - supervisor manages workers');
            return $this->checkSupervisorStatus();
        }

        // For non-containerized environments
        if ($this->option('restart')) {
            $this->info('🔄 Restarting queue workers...');
            Artisan::call('queue:restart');
            $this->info('✅ Queue restart signal sent');
        }

        if ($this->option('check')) {
            return $this->performHealthCheck();
        }

        $this->info('✅ Queue monitoring completed');
        return Command::SUCCESS;
    }

    private function checkPendingJobs(): int
    {
        try {
            return DB::table('jobs')->count();
        } catch (\Exception $e) {
            $this->error('❌ Could not check pending jobs: ' . $e->getMessage());
            return 0;
        }
    }

    private function isContainerized(): bool
    {
        return env('CONTAINER_ROLE') !== null || file_exists('/.dockerenv');
    }

    private function checkSupervisorStatus(): int
    {
        if (env('CONTAINER_ROLE') === 'queue') {
            $this->info('✅ Running in queue container - supervisor should be managing workers');
            
            // Check if supervisor processes are running
            $processes = shell_exec('ps aux | grep -v grep | grep "queue:work" | wc -l');
            $processCount = intval(trim($processes));
            
            if ($processCount > 0) {
                $this->info("✅ Found {$processCount} queue worker process(es)");
                return Command::SUCCESS;
            } else {
                $this->error('❌ No queue worker processes found!');
                return Command::FAILURE;
            }
        }

        return Command::SUCCESS;
    }

    private function performHealthCheck(): int
    {
        $this->info('🏥 Performing queue health check...');

        // Check database connectivity
        try {
            DB::connection()->getPdo();
            $this->info('✅ Database connection OK');
        } catch (\Exception $e) {
            $this->error('❌ Database connection failed: ' . $e->getMessage());
            return Command::FAILURE;
        }

        // Check jobs table exists
        try {
            DB::table('jobs')->take(1)->get();
            $this->info('✅ Jobs table accessible');
        } catch (\Exception $e) {
            $this->error('❌ Jobs table not accessible: ' . $e->getMessage());
            return Command::FAILURE;
        }

        // Check failed jobs
        try {
            $failedJobs = DB::table('failed_jobs')->count();
            if ($failedJobs > 0) {
                $this->warn("⚠️  Found {$failedJobs} failed job(s)");
            } else {
                $this->info('✅ No failed jobs');
            }
        } catch (\Exception $e) {
            $this->warn('⚠️  Could not check failed jobs: ' . $e->getMessage());
        }

        $this->info('✅ Health check completed');
        return Command::SUCCESS;
    }
}