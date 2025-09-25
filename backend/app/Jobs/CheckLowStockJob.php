<?php

namespace App\Jobs;

use App\Services\NotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * CheckLowStockJob
 * 
 * Background job to check for products with low stock and create notifications.
 * Runs periodically to ensure timely alerts without blocking user requests.
 */
class CheckLowStockJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of times the job may be attempted.
     */
    public int $tries = 3;

    /**
     * The maximum number of seconds the job may run.
     */
    public int $timeout = 300; // 5 minutes

    /**
     * Create a new job instance.
     */
    public function __construct()
    {
        // Set queue priority for low stock checks
        $this->onQueue('notifications');
    }

    /**
     * Execute the job.
     * 
     * @param NotificationService $notificationService
     */
    public function handle(NotificationService $notificationService): void
    {
        try {
            Log::info('Starting low stock check job');
            
            $notificationsCreated = $notificationService->checkAndCreateLowStockAlerts();
            
            Log::info('Low stock check job completed', [
                'notifications_created' => $notificationsCreated
            ]);
        } catch (\Exception $e) {
            Log::error('Low stock check job failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            // Re-throw to trigger retry mechanism
            throw $e;
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('Low stock check job failed permanently', [
            'error' => $exception->getMessage(),
            'attempts' => $this->attempts()
        ]);
    }
}