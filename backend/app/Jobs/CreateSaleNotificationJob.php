<?php

namespace App\Jobs;

use App\Models\Sale;
use App\Services\NotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * CreateSaleNotificationJob
 * 
 * Background job to create notifications when a sale is created.
 * Decouples notification creation from the main sale creation process.
 */
class CreateSaleNotificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The sale instance
     */
    private Sale $sale;

    /**
     * Optional user ID to notify
     */
    private ?int $userId;

    /**
     * The number of times the job may be attempted.
     */
    public int $tries = 3;

    /**
     * The maximum number of seconds the job may run.
     */
    public int $timeout = 120; // 2 minutes

    /**
     * Create a new job instance.
     * 
     * @param Sale $sale
     * @param int|null $userId
     */
    public function __construct(Sale $sale, ?int $userId = null)
    {
        $this->sale = $sale;
        $this->userId = $userId;
        
        // Set queue priority for sale notifications
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
            Log::info('Creating sale notification', [
                'sale_id' => $this->sale->id,
                'user_id' => $this->userId
            ]);

            // Load necessary relationships to avoid N+1 queries
            $this->sale->load(['items.product', 'user']);
            
            $notification = $notificationService->createSaleNotification($this->sale, $this->userId);
            
            Log::info('Sale notification created successfully', [
                'notification_id' => $notification->id,
                'sale_id' => $this->sale->id
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to create sale notification', [
                'sale_id' => $this->sale->id,
                'user_id' => $this->userId,
                'error' => $e->getMessage()
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
        Log::error('Sale notification job failed permanently', [
            'sale_id' => $this->sale->id,
            'user_id' => $this->userId,
            'error' => $exception->getMessage(),
            'attempts' => $this->attempts()
        ]);
    }

    /**
     * Get the tags for the job (for monitoring).
     */
    public function tags(): array
    {
        return [
            'sale_notification',
            'sale:' . $this->sale->id,
            'user:' . ($this->userId ?? 'system')
        ];
    }
}