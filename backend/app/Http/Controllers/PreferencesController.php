<?php

namespace App\Http\Controllers;

use App\Models\Preferences;
use App\Models\User;
use App\Support\CacheHelper;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class PreferencesController extends Controller
{
    /**
     * Get user preferences with caching
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        
        $cacheKey = CacheHelper::key('user_preferences', $user->id);
        $ttl = CacheHelper::ttlSeconds('USER_PREFERENCES_TTL', 3600); // 1 hour
        
        $preferences = Cache::remember($cacheKey, now()->addSeconds($ttl), function () use ($user) {
            // Get preferences with user relationship loaded to avoid N+1
            return Preferences::where('user_id', $user->id)
                ->first() ?? $this->createDefaultPreferences($user);
        });
        
        return response()->json([
            'preferences' => $preferences,
            'meta' => [
                'cached' => Cache::has($cacheKey),
                'cache_key' => $cacheKey,
            ]
        ]);
    }
    
    /**
     * Update user preferences with validation and caching
     */
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // Comprehensive validation
        $validator = Validator::make($request->all(), [
            'dark_mode' => 'boolean',
            'theme_color' => ['string', 'max:50', Rule::in(['blue', 'green', 'purple', 'red', 'orange', 'pink'])],
            'notifications_enabled' => 'boolean',
            'email_notifications' => 'boolean',
            'push_notifications' => 'boolean',
            'low_stock_alerts' => 'boolean',
            'sales_notifications' => 'boolean',
            'purchase_notifications' => 'boolean',
            'dashboard_widgets' => 'array',
            'dashboard_widgets.*' => 'string|max:50',
            'default_date_range' => ['string', Rule::in(['7', '14', '30', '60', '90', '180', '365'])],
            'items_per_page' => 'integer|min:5|max:100',
            'language' => ['string', 'size:2', Rule::in(['en', 'es', 'fr', 'de', 'ar'])],
            'timezone' => 'string|max:50',
            'currency' => ['string', 'size:3', Rule::in(['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'])],
            'profile_public' => 'boolean',
            'show_online_status' => 'boolean',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }
        
        try {
            DB::beginTransaction();
            
            // Get or create preferences
            $preferences = Preferences::firstOrCreate(
                ['user_id' => $user->id],
                Preferences::getDefaults()
            );
            
            // Update only provided fields
            $preferences->fill($validator->validated());
            $preferences->save();
            
            // Clear cache for this user
            $this->clearUserPreferencesCache($user->id);
            
            DB::commit();
            
            return response()->json([
                'message' => 'Preferences updated successfully',
                'preferences' => $preferences->fresh(),
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'message' => 'Failed to update preferences',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Reset preferences to defaults
     */
    public function reset(Request $request): JsonResponse
    {
        $user = $request->user();
        
        try {
            DB::beginTransaction();
            
            $preferences = Preferences::where('user_id', $user->id)->first();
            
            if ($preferences) {
                $preferences->update(Preferences::getDefaults());
            } else {
                $preferences = $this->createDefaultPreferences($user);
            }
            
            $this->clearUserPreferencesCache($user->id);
            
            DB::commit();
            
            return response()->json([
                'message' => 'Preferences reset to defaults',
                'preferences' => $preferences->fresh(),
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'message' => 'Failed to reset preferences',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get preferences for multiple users (admin only)
     */
    public function index(Request $request): JsonResponse
    {
        // Simple authorization check - you might want to use policies
        if (!$request->user()->isAdmin ?? false) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        $validator = Validator::make($request->all(), [
            'user_ids' => 'array',
            'user_ids.*' => 'integer|exists:users,id',
            'per_page' => 'integer|min:1|max:100',
            'page' => 'integer|min:1',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }
        
        $query = Preferences::with('user:id,name,email');
        
        if ($request->has('user_ids')) {
            $query->whereIn('user_id', $request->user_ids);
        }
        
        $preferences = $query->paginate($request->get('per_page', 20));
        
        return response()->json($preferences);
    }
    
    /**
     * Get theme statistics (admin only)
     */
    public function themeStats(Request $request): JsonResponse
    {
        if (!$request->user()->isAdmin ?? false) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        $cacheKey = CacheHelper::key('preferences', 'theme_stats');
        $ttl = CacheHelper::ttlSeconds('THEME_STATS_TTL', 3600); // 1 hour
        
        $stats = Cache::remember($cacheKey, now()->addSeconds($ttl), function () {
            return [
                'dark_mode_usage' => [
                    'enabled' => Preferences::where('dark_mode', true)->count(),
                    'disabled' => Preferences::where('dark_mode', false)->count(),
                ],
                'theme_colors' => Preferences::select('theme_color', DB::raw('count(*) as count'))
                    ->groupBy('theme_color')
                    ->pluck('count', 'theme_color'),
                'notification_preferences' => [
                    'email_enabled' => Preferences::where('email_notifications', true)->count(),
                    'push_enabled' => Preferences::where('push_notifications', true)->count(),
                    'low_stock_alerts' => Preferences::where('low_stock_alerts', true)->count(),
                ],
                'dashboard_settings' => [
                    'avg_items_per_page' => Preferences::avg('items_per_page'),
                    'popular_date_range' => Preferences::select('default_date_range', DB::raw('count(*) as count'))
                        ->groupBy('default_date_range')
                        ->orderByDesc('count')
                        ->first()?->default_date_range,
                ],
            ];
        });
        
        return response()->json($stats);
    }
    
    /**
     * Create default preferences for a user
     */
    private function createDefaultPreferences(User $user): Preferences
    {
        return Preferences::createForUser($user);
    }
    
    /**
     * Clear user preferences cache
     */
    private function clearUserPreferencesCache(int $userId): void
    {
        $cacheKey = CacheHelper::key('user_preferences', $userId);
        Cache::forget($cacheKey);
        
        // Also clear theme stats cache since preferences changed
        Cache::forget(CacheHelper::key('preferences', 'theme_stats'));
    }
}
