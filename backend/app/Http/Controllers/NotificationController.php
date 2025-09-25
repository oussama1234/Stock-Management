<?php

namespace App\Http\Controllers;

use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

/**
 * NotificationController
 * 
 * Handles HTTP requests for notifications with minimal business logic.
 * All business logic is delegated to NotificationService for clean separation.
 */
class NotificationController extends Controller
{
    /**
     * Notification service instance
     */
    private NotificationService $notificationService;

    /**
     * Constructor - Inject NotificationService
     */
    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Get user notifications with pagination
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $userId = Auth::id();
            $user = Auth::user();
            $page = (int) $request->get('page', 1);
            
            // Get per_page from user preference or request, default to 10
            $requestedPerPage = (int) $request->get('per_page', 0);
            $userPreferencePerPage = $user && $user->preferences ? ($user->preferences['items_per_page'] ?? 10) : 10;
            $perPage = $requestedPerPage > 0 ? $requestedPerPage : $userPreferencePerPage;

            // Validate pagination params
            if ($page < 1) $page = 1;
            if ($perPage < 1 || $perPage > 100) $perPage = 10;

            $notifications = $this->notificationService->getUserNotifications($userId, $page, $perPage);

            return response()->json([
                'success' => true,
                'data' => $notifications->items(),
                'meta' => [
                    'current_page' => $notifications->currentPage(),
                    'last_page' => $notifications->lastPage(),
                    'per_page' => $notifications->perPage(),
                    'total' => $notifications->total(),
                    'from' => $notifications->firstItem(),
                    'to' => $notifications->lastItem(),
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch notifications',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Get unread notifications count
     * 
     * @return JsonResponse
     */
    public function unreadCount(): JsonResponse
    {
        try {
            $userId = Auth::id();
            $count = $this->notificationService->getUnreadCount($userId);

            return response()->json([
                'success' => true,
                'count' => $count
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch unread count',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Get low stock notifications
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function lowStock(Request $request): JsonResponse
    {
        try {
            $limit = (int) $request->get('limit', 10);
            if ($limit < 1 || $limit > 50) $limit = 10;

            $notifications = $this->notificationService->getLowStockNotifications($limit);

            return response()->json([
                'success' => true,
                'data' => $notifications,
                'count' => $notifications->count()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch low stock notifications',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Create a notification (admin only)
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        try {
            // Validate request data
            $validator = Validator::make($request->all(), [
                'type' => 'required|string|in:low_stock,sale_created,purchase_created,stock_updated',
                'title' => 'required|string|max:255',
                'message' => 'required|string',
                'user_id' => 'nullable|integer|exists:users,id',
                'priority' => 'nullable|string|in:low,medium,high,urgent',
                'category' => 'nullable|string|in:general,inventory,sales,purchases,system',
                'data' => 'nullable|array',
                'notifiable_type' => 'nullable|string',
                'notifiable_id' => 'nullable|integer',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $data = $validator->validated();
            $notification = $this->notificationService->createNotification($data);

            return response()->json([
                'success' => true,
                'message' => 'Notification created successfully',
                'data' => $notification
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create notification',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Show a specific notification
     * 
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        try {
            $userId = Auth::id();
            $notification = \App\Models\Notification::forUser($userId)
                ->with(['notifiable'])
                ->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $notification
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Notification not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch notification',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Mark notification as read
     * 
     * @param int $id
     * @return JsonResponse
     */
    public function markAsRead(int $id): JsonResponse
    {
        try {
            $userId = Auth::id();
            $success = $this->notificationService->markAsRead($id, $userId);

            if ($success) {
                return response()->json([
                    'success' => true,
                    'message' => 'Notification marked as read'
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to mark notification as read'
                ], 400);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update notification',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Mark all notifications as read
     * 
     * @return JsonResponse
     */
    public function markAllAsRead(): JsonResponse
    {
        try {
            $userId = Auth::id();
            $count = $this->notificationService->markAllAsRead($userId);

            return response()->json([
                'success' => true,
                'message' => "Marked {$count} notifications as read",
                'count' => $count
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark notifications as read',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Delete a notification
     * 
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $userId = Auth::id();
            $success = $this->notificationService->deleteNotification($id, $userId);

            if ($success) {
                return response()->json([
                    'success' => true,
                    'message' => 'Notification deleted successfully'
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to delete notification'
                ], 400);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete notification',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Get notification statistics (admin only)
     * 
     * @return JsonResponse
     */
    public function stats(): JsonResponse
    {
        try {
            // Get statistics using raw queries for performance
            $stats = [
                'total_notifications' => \App\Models\Notification::count(),
                'unread_notifications' => \App\Models\Notification::unread()->count(),
                'notifications_by_type' => \App\Models\Notification::selectRaw('type, COUNT(*) as count')
                    ->groupBy('type')
                    ->pluck('count', 'type'),
                'notifications_by_priority' => \App\Models\Notification::selectRaw('priority, COUNT(*) as count')
                    ->groupBy('priority')
                    ->pluck('count', 'priority'),
                'recent_notifications_count' => \App\Models\Notification::recent(7)->count(),
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch notification statistics',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }
}