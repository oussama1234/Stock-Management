<?php

namespace App\Jobs;

use App\Models\Purchase;
use App\Services\NotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * CreatePurchaseNotificationJob
 * 
 * Background job to create notifications when a purchase is created.
 * Decouples notification creation from the main purchase creation process.
 */
class CreatePurchaseNotificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The purchase instance
     */
    private Purchase $purchase;

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
     * @param Purchase $purchase
     * @param int|null $userId
     */
    public function __construct(Purchase $purchase, ?int $userId = null)
    {
        $this->purchase = $purchase;
        $this->userId = $userId;
        
        // Set queue priority for purchase notifications
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
            Log::info('Creating purchase notification', [
                'purchase_id' => $this->purchase->id,
                'user_id' => $this->userId
            ]);

            // Load necessary relationships to avoid N+1 queries
            $this->purchase->load(['items.product', 'supplier', 'user']);
            
            $notification = $notificationService->createPurchaseNotification($this->purchase, $this->userId);
            
            Log::info('Purchase notification created successfully', [
                'notification_id' => $notification->id,
                'purchase_id' => $this->purchase->id
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to create purchase notification', [
                'purchase_id' => $this->purchase->id,
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
        Log::error('Purchase notification job failed permanently', [
            'purchase_id' => $this->purchase->id,
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
            'purchase_notification',
            'purchase:' . $this->purchase->id,
            'user:' . ($this->userId ?? 'system')
        ];
    }
}