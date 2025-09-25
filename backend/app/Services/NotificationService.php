<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Purchase;
use App\Support\CacheHelper;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

/**
 * NotificationService
 * 
 * Centralized service for handling all notification operations with
 * performance optimizations, caching, and clean separation of concerns.
 */
class NotificationService
{
    /**
     * Cache TTL in seconds (1 minute)
     */
    private const CACHE_TTL = 60;

    /**
     * Cache key prefixes
     */
    private const CACHE_KEY_USER_NOTIFICATIONS = 'user_notifications';
    private const CACHE_KEY_UNREAD_COUNT = 'unread_notifications_count';
    private const CACHE_KEY_LOW_STOCK = 'low_stock_notifications';

    /**
     * Create a new notification
     * 
     * @param array $data Notification data
     * @return Notification
     */
    public function createNotification(array $data): Notification
    {
        try {
            // Validate required fields
            $this->validateNotificationData($data);

            // Ensure polymorphic fields have defaults if not provided
            if (!isset($data['notifiable_type'])) {
                $data['notifiable_type'] = '';
            }
            if (!isset($data['notifiable_id'])) {
                $data['notifiable_id'] = 0;
            }

            // Create notification
            $notification = Notification::create($data);

            // Clear relevant caches
            $this->clearUserNotificationCache($data['user_id'] ?? null);

            Log::info('Notification created', [
                'id' => $notification->id,
                'type' => $notification->type,
                'user_id' => $notification->user_id
            ]);

            return $notification;
        } catch (\Exception $e) {
            Log::error('Failed to create notification', [
                'error' => $e->getMessage(),
                'data' => $data
            ]);
            throw $e;
        }
    }

    /**
     * Create low stock alert notification
     * 
     * @param Product $product
     * @param int|null $userId
     * @return Notification
     */
    public function createLowStockAlert(Product $product, ?int $userId = null): Notification
    {
        // Get threshold for this product (default: 10)
        $threshold = $product->low_stock_threshold ?? 10;
        
        $data = [
            'type' => Notification::TYPE_LOW_STOCK,
            'title' => 'Low Stock Alert',
            'message' => "Product '{$product->name}' is running low on stock. Only {$product->stock} units remaining.",
            'data' => [
                'product_id' => $product->id,
                'product_name' => $product->name,
                'current_stock' => $product->stock,
                'threshold' => $threshold,
                'category' => $product->category?->name,
            ],
            'user_id' => $userId,
            'priority' => $product->stock <= 5 ? Notification::PRIORITY_URGENT : Notification::PRIORITY_HIGH,
            'category' => Notification::CATEGORY_INVENTORY,
            'notifiable_type' => Product::class,
            'notifiable_id' => $product->id,
        ];

        return $this->createNotification($data);
    }

    /**
     * Create sale notification
     * 
     * @param Sale $sale
     * @param int|null $userId
     * @return Notification
     */
    public function createSaleNotification(Sale $sale, ?int $userId = null): Notification
    {
        $totalAmount = $sale->items->sum(fn($item) => $item->quantity * $item->price);
        
        $data = [
            'type' => Notification::TYPE_SALE_CREATED,
            'title' => 'Sale Created',
            'message' => "Sale order #{$sale->id} has been created successfully.",
            'data' => [
                'sale_id' => $sale->id,
                'customer_name' => $sale->customer_name,
                'total_amount' => $totalAmount,
                'items_count' => $sale->items->count(),
                'sale_date' => $sale->sale_date->toISOString(),
            ],
            'user_id' => $userId ?? $sale->user_id,
            'priority' => Notification::PRIORITY_MEDIUM,
            'category' => Notification::CATEGORY_SALES,
            'notifiable_type' => Sale::class,
            'notifiable_id' => $sale->id,
        ];

        return $this->createNotification($data);
    }

    /**
     * Create purchase notification
     * 
     * @param Purchase $purchase
     * @param int|null $userId
     * @return Notification
     */
    public function createPurchaseNotification(Purchase $purchase, ?int $userId = null): Notification
    {
        $totalAmount = $purchase->items->sum(fn($item) => $item->quantity * $item->price);
        
        $data = [
            'type' => Notification::TYPE_PURCHASE_CREATED,
            'title' => 'Purchase Created',
            'message' => "Purchase order #{$purchase->id} has been created successfully.",
            'data' => [
                'purchase_id' => $purchase->id,
                'supplier_name' => $purchase->supplier?->name ?? 'Unknown Supplier',
                'total_amount' => $totalAmount,
                'items_count' => $purchase->items->count(),
                'purchase_date' => $purchase->purchase_date->toISOString(),
            ],
            'user_id' => $userId ?? $purchase->user_id,
            'priority' => Notification::PRIORITY_MEDIUM,
            'category' => Notification::CATEGORY_PURCHASES,
            'notifiable_type' => Purchase::class,
            'notifiable_id' => $purchase->id,
        ];

        return $this->createNotification($data);
    }

    /**
     * Get user notifications with caching
     * Admins see all system notifications, regular users see only their own
     * 
     * @param int $userId
     * @param int $page
     * @param int $perPage
     * @return LengthAwarePaginator
     */
    public function getUserNotifications(int $userId, int $page = 1, int $perPage = 15): LengthAwarePaginator
    {
        $user = User::find($userId);
        $isAdmin = $user && $user->is_admin;
        
        $cacheKey = $this->getUserNotificationsCacheKey($userId, $page, $perPage) . ($isAdmin ? '_admin' : '_user');

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($userId, $page, $perPage, $isAdmin) {
            $query = Notification::with(['notifiable', 'user'])
                ->orderBy('created_at', 'desc');
                
            // If not admin, filter by user
            if (!$isAdmin) {
                $query->forUser($userId);
            }
            
            return $query->paginate($perPage, ['*'], 'page', $page);
        });
    }

    /**
     * Get unread notifications count for user
     * Admins see count for all system notifications, regular users see only their own
     * 
     * @param int $userId
     * @return int
     */
    public function getUnreadCount(int $userId): int
    {
        $user = User::find($userId);
        $isAdmin = $user && $user->is_admin;
        
        $cacheKey = $this->getUnreadCountCacheKey($userId) . ($isAdmin ? '_admin' : '_user');

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($userId, $isAdmin) {
            $query = Notification::unread();
            
            // If not admin, filter by user
            if (!$isAdmin) {
                $query->forUser($userId);
            }
            
            return $query->count();
        });
    }

    /**
     * Get recent low stock notifications
     * 
     * @param int $limit
     * @return Collection
     */
    public function getLowStockNotifications(int $limit = 10): Collection
    {
        $cacheKey = self::CACHE_KEY_LOW_STOCK . ":{$limit}";

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($limit) {
            return Notification::ofType(Notification::TYPE_LOW_STOCK)
                ->with(['notifiable'])
                ->recent(7) // Last 7 days
                ->orderBy('priority', 'desc')
                ->orderBy('created_at', 'desc')
                ->limit($limit)
                ->get();
        });
    }

    /**
     * Mark notification as read
     * Admins can mark any notification as read, regular users only their own
     * 
     * @param int $notificationId
     * @param int $userId
     * @return bool
     */
    public function markAsRead(int $notificationId, int $userId): bool
    {
        try {
            $user = User::find($userId);
            $isAdmin = $user && $user->is_admin;
            
            // Admins can mark any notification as read, regular users only their own
            if ($isAdmin) {
                $notification = Notification::findOrFail($notificationId);
            } else {
                $notification = Notification::forUser($userId)->findOrFail($notificationId);
            }
            
            $result = $notification->markAsRead();

            // Clear caches for both the acting user and the notification owner
            $this->clearUserNotificationCache($userId);
            if ($isAdmin && $notification->user_id !== $userId) {
                $this->clearUserNotificationCache($notification->user_id);
            }

            return $result;
        } catch (\Exception $e) {
            Log::error('Failed to mark notification as read', [
                'notification_id' => $notificationId,
                'user_id' => $userId,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Mark all notifications as read for user
     * Admins mark all system notifications as read, regular users only their own
     * 
     * @param int $userId
     * @return int Number of updated notifications
     */
    public function markAllAsRead(int $userId): int
    {
        try {
            $user = User::find($userId);
            $isAdmin = $user && $user->is_admin;
            
            $query = Notification::unread();
            
            // If not admin, filter by user
            if (!$isAdmin) {
                $query->forUser($userId);
            }
            
            $count = $query->update([
                'is_read' => true,
                'read_at' => Carbon::now(),
            ]);

            // Clear caches - if admin, clear all user caches
            if ($isAdmin) {
                // Clear cache for all users (simplified approach)
                Cache::flush();
            } else {
                $this->clearUserNotificationCache($userId);
            }

            Log::info('Marked all notifications as read', [
                'user_id' => $userId,
                'is_admin' => $isAdmin,
                'count' => $count
            ]);

            return $count;
        } catch (\Exception $e) {
            Log::error('Failed to mark all notifications as read', [
                'user_id' => $userId,
                'error' => $e->getMessage()
            ]);
            return 0;
        }
    }

    /**
     * Delete notification
     * Admins can delete any notification, regular users only their own
     * 
     * @param int $notificationId
     * @param int $userId
     * @return bool
     */
    public function deleteNotification(int $notificationId, int $userId): bool
    {
        try {
            $user = User::find($userId);
            $isAdmin = $user && $user->is_admin;
            
            // Admins can delete any notification, regular users only their own
            if ($isAdmin) {
                $notification = Notification::findOrFail($notificationId);
            } else {
                $notification = Notification::forUser($userId)->findOrFail($notificationId);
            }
            
            $result = $notification->delete();

            // Clear caches for both the acting user and the notification owner
            $this->clearUserNotificationCache($userId);
            if ($isAdmin && $notification->user_id !== $userId) {
                $this->clearUserNotificationCache($notification->user_id);
            }

            return $result;
        } catch (\Exception $e) {
            Log::error('Failed to delete notification', [
                'notification_id' => $notificationId,
                'user_id' => $userId,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Clean up old notifications (older than 30 days)
     * 
     * @return int Number of deleted notifications
     */
    public function cleanupOldNotifications(): int
    {
        try {
            $count = Notification::where('created_at', '<', Carbon::now()->subDays(30))
                ->delete();

            // Clear relevant caches (flush all cache since we can't use tags)
            Cache::flush();

            Log::info('Cleaned up old notifications', ['count' => $count]);

            return $count;
        } catch (\Exception $e) {
            Log::error('Failed to cleanup old notifications', [
                'error' => $e->getMessage()
            ]);
            return 0;
        }
    }

    /**
     * Check for low stock products and create notifications
     * 
     * @return int Number of notifications created
     */
    public function checkAndCreateLowStockAlerts(): int
    {
        try {
            $createdCount = 0;
            
            // Get products with low stock (avoiding N+1 queries)
            $lowStockProducts = Product::with(['category'])
                ->whereRaw('stock <= COALESCE(low_stock_threshold, 10)')
                ->whereDoesntHave('notifications', function ($query) {
                    $query->where('type', Notification::TYPE_LOW_STOCK)
                        ->where('created_at', '>=', Carbon::now()->subHours(24)); // Don't spam daily
                })
                ->get();

            // Get all admin users to notify
            $adminUsers = User::whereIn('role', ['admin', 'super_admin'])->get();

            foreach ($lowStockProducts as $product) {
                foreach ($adminUsers as $user) {
                    $this->createLowStockAlert($product, $user->id);
                    $createdCount++;
                }
            }

            Log::info('Low stock alerts created', [
                'products_count' => $lowStockProducts->count(),
                'notifications_created' => $createdCount
            ]);

            return $createdCount;
        } catch (\Exception $e) {
            Log::error('Failed to check low stock alerts', [
                'error' => $e->getMessage()
            ]);
            return 0;
        }
    }

    /**
     * Validate notification data
     * 
     * @param array $data
     * @throws \InvalidArgumentException
     */
    private function validateNotificationData(array $data): void
    {
        $required = ['type', 'title', 'message'];
        
        foreach ($required as $field) {
            if (empty($data[$field])) {
                throw new \InvalidArgumentException("Field '{$field}' is required");
            }
        }

        // Validate type
        $validTypes = [
            Notification::TYPE_LOW_STOCK,
            Notification::TYPE_SALE_CREATED,
            Notification::TYPE_PURCHASE_CREATED,
            Notification::TYPE_STOCK_UPDATED,
        ];

        if (!in_array($data['type'], $validTypes)) {
            throw new \InvalidArgumentException("Invalid notification type: {$data['type']}");
        }
    }

    /**
     * Clear user notification cache
     * 
     * @param int|null $userId
     */
    private function clearUserNotificationCache(?int $userId): void
    {
        // If no specific user, clear all notification caches
        if (!$userId) {
            // Clear all notification-related cache patterns
            Cache::flush(); // More aggressive for system-wide notifications
            return;
        }

        // Clear unread count cache for specific user
        Cache::forget($this->getUnreadCountCacheKey($userId));
        
        // Clear paginated notifications cache (try multiple page keys and per_page values)
        for ($page = 1; $page <= 20; $page++) {
            foreach ([10, 15, 20, 25, 50, 100] as $perPage) {
                Cache::forget($this->getUserNotificationsCacheKey($userId, $page, $perPage));
                Cache::forget($this->getUserNotificationsCacheKey($userId, $page, $perPage) . '_admin');
                Cache::forget($this->getUserNotificationsCacheKey($userId, $page, $perPage) . '_user');
            }
        }
        
        // Clear low stock cache (multiple limits)
        foreach ([10, 20, 50] as $limit) {
            Cache::forget(self::CACHE_KEY_LOW_STOCK . ":{$limit}");
        }
        
        // Use CacheHelper to bump notifications namespace as well
        CacheHelper::bump('notifications');
    }

    /**
     * Generate cache key for user notifications
     * 
     * @param int $userId
     * @param int $page
     * @param int $perPage
     * @return string
     */
    private function getUserNotificationsCacheKey(int $userId, int $page, int $perPage): string
    {
        return self::CACHE_KEY_USER_NOTIFICATIONS . ":{$userId}:{$page}:{$perPage}";
    }

    /**
     * Generate cache key for unread count
     * 
     * @param int $userId
     * @return string
     */
    private function getUnreadCountCacheKey(int $userId): string
    {
        return self::CACHE_KEY_UNREAD_COUNT . ":{$userId}";
    }
}