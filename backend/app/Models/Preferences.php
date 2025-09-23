<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Preferences extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'dark_mode',
        'theme_color',
        'notifications_enabled',
        'email_notifications',
        'push_notifications',
        'low_stock_alerts',
        'sales_notifications',
        'purchase_notifications',
        'dashboard_widgets',
        'default_date_range',
        'items_per_page',
        'language',
        'timezone',
        'currency',
        'profile_public',
        'show_online_status',
    ];

    protected $casts = [
        'dark_mode' => 'boolean',
        'notifications_enabled' => 'boolean',
        'email_notifications' => 'boolean',
        'push_notifications' => 'boolean',
        'low_stock_alerts' => 'boolean',
        'sales_notifications' => 'boolean',
        'purchase_notifications' => 'boolean',
        'profile_public' => 'boolean',
        'show_online_status' => 'boolean',
        'dashboard_widgets' => 'array',
        'items_per_page' => 'integer',
    ];

    /**
     * Get the user that owns the preferences.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get default preferences for a new user
     */
    public static function getDefaults(): array
    {
        return [
            'dark_mode' => false,
            'theme_color' => 'blue',
            'notifications_enabled' => true,
            'email_notifications' => true,
            'push_notifications' => true,
            'low_stock_alerts' => true,
            'sales_notifications' => true,
            'purchase_notifications' => true,
            'dashboard_widgets' => [
                'sales_chart',
                'top_products',
                'low_stock',
                'recent_orders'
            ],
            'default_date_range' => '30',
            'items_per_page' => 20,
            'language' => 'en',
            'timezone' => 'UTC',
            'currency' => 'USD',
            'profile_public' => false,
            'show_online_status' => true,
        ];
    }

    /**
     * Create default preferences for a user
     */
    public static function createForUser(User $user): Preferences
    {
        return static::create(array_merge(
            static::getDefaults(),
            ['user_id' => $user->id]
        ));
    }
}
