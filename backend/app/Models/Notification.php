<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\Builder;
use Carbon\Carbon;

/**
 * Notification Model
 * 
 * Handles system notifications for users including low stock alerts,
 * purchase notifications, and sale notifications with efficient querying.
 */
class Notification extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'type',
        'title',
        'message',
        'data',
        'user_id',
        'is_read',
        'read_at',
        'priority',
        'category',
        'notifiable_type',
        'notifiable_id',
    ];

    /**
     * The attributes that should be cast to native types.
     */
    protected $casts = [
        'data' => 'array',
        'is_read' => 'boolean',
        'read_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Notification types constants for consistency
     */
    const TYPE_LOW_STOCK = 'low_stock';
    const TYPE_SALE_CREATED = 'sale_created';
    const TYPE_PURCHASE_CREATED = 'purchase_created';
    const TYPE_STOCK_UPDATED = 'stock_updated';

    /**
     * Priority levels
     */
    const PRIORITY_LOW = 'low';
    const PRIORITY_MEDIUM = 'medium';
    const PRIORITY_HIGH = 'high';
    const PRIORITY_URGENT = 'urgent';

    /**
     * Categories
     */
    const CATEGORY_INVENTORY = 'inventory';
    const CATEGORY_SALES = 'sales';
    const CATEGORY_PURCHASES = 'purchases';
    const CATEGORY_SYSTEM = 'system';

    /**
     * Relationship: Notification belongs to User
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Polymorphic relationship: Get the owning notifiable model
     */
    public function notifiable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Scope: Get unread notifications
     */
    public function scopeUnread(Builder $query): Builder
    {
        return $query->where('is_read', false);
    }

    /**
     * Scope: Get read notifications
     */
    public function scopeRead(Builder $query): Builder
    {
        return $query->where('is_read', true);
    }

    /**
     * Scope: Filter by type
     */
    public function scopeOfType(Builder $query, string $type): Builder
    {
        return $query->where('type', $type);
    }

    /**
     * Scope: Filter by category
     */
    public function scopeOfCategory(Builder $query, string $category): Builder
    {
        return $query->where('category', $category);
    }

    /**
     * Scope: Filter by priority
     */
    public function scopeOfPriority(Builder $query, string $priority): Builder
    {
        return $query->where('priority', $priority);
    }

    /**
     * Scope: For specific user
     */
    public function scopeForUser(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope: Recent notifications (last 30 days by default)
     */
    public function scopeRecent(Builder $query, int $days = 30): Builder
    {
        return $query->where('created_at', '>=', Carbon::now()->subDays($days));
    }

    /**
     * Scope: High priority notifications
     */
    public function scopeHighPriority(Builder $query): Builder
    {
        return $query->whereIn('priority', [self::PRIORITY_HIGH, self::PRIORITY_URGENT]);
    }

    /**
     * Mark notification as read
     */
    public function markAsRead(): bool
    {
        return $this->update([
            'is_read' => true,
            'read_at' => Carbon::now(),
        ]);
    }

    /**
     * Mark notification as unread
     */
    public function markAsUnread(): bool
    {
        return $this->update([
            'is_read' => false,
            'read_at' => null,
        ]);
    }

    /**
     * Check if notification is urgent
     */
    public function isUrgent(): bool
    {
        return $this->priority === self::PRIORITY_URGENT;
    }

    /**
     * Check if notification is high priority
     */
    public function isHighPriority(): bool
    {
        return in_array($this->priority, [self::PRIORITY_HIGH, self::PRIORITY_URGENT]);
    }

    /**
     * Get formatted time ago for API responses
     */
    public function getTimeAgoAttribute(): string
    {
        return $this->created_at->diffForHumans();
    }
}