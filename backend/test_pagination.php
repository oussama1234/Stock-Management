<?php
// Test pagination directly from Laravel backend

require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// Use the first user for testing
$user = App\Models\User::first();

if (!$user) {
    echo "No user found!\n";
    exit(1);
}

echo "Testing pagination for user: {$user->email}\n";
echo "Total notifications: " . App\Models\Notification::count() . "\n";

// Test pagination with 10 per page
$paginated = App\Models\Notification::orderBy('created_at', 'desc')->paginate(10);

echo "\nPagination test (10 per page):\n";
echo "Current page: " . $paginated->currentPage() . "\n";
echo "Last page: " . $paginated->lastPage() . "\n";
echo "Total items: " . $paginated->total() . "\n";
echo "Items on this page: " . $paginated->count() . "\n";
echo "Per page setting: " . $paginated->perPage() . "\n";
echo "Has more pages: " . ($paginated->hasMorePages() ? 'YES' : 'NO') . "\n";

// Test page 2
echo "\nTesting page 2:\n";
$page2 = App\Models\Notification::orderBy('created_at', 'desc')->paginate(10, ['*'], 'page', 2);
echo "Page 2 has " . $page2->count() . " items\n";
echo "Current page: " . $page2->currentPage() . "\n";

// Check notification types and user ownership
echo "\nAnalyzing all notifications:\n";
$user = App\Models\User::first();
$allNotifications = App\Models\Notification::orderBy('created_at', 'desc')->get();

echo "Breakdown by type:\n";
$typeBreakdown = $allNotifications->groupBy('type');
foreach ($typeBreakdown as $type => $notifications) {
    $userNotifications = $notifications->where('user_id', $user->id)->count();
    echo "- {$type}: {$notifications->count()} total, {$userNotifications} for user {$user->id}\n";
}

echo "\nBreakdown by read status for user {$user->id}:\n";
$userNotifications = App\Models\Notification::where('user_id', $user->id)->get();
$readCount = $userNotifications->where('is_read', true)->count();
$unreadCount = $userNotifications->where('is_read', false)->count();
echo "- Read: {$readCount}\n";
echo "- Unread: {$unreadCount}\n";
echo "- Total for this user: " . $userNotifications->count() . "\n";

echo "\nTesting admin behavior:\n";
echo "User {$user->id} is_admin: " . ($user->is_admin ? 'YES' : 'NO') . "\n";
echo "User role: {$user->role}\n";

// Test the service behavior
$service = new App\Services\NotificationService();
echo "\nService results for user {$user->id}:\n";
$notifications = $service->getUserNotifications($user->id, 1, 10);
echo "- Notifications returned: {$notifications->count()}\n";
echo "- Total in pagination: {$notifications->total()}\n";

$unreadCount = $service->getUnreadCount($user->id);
echo "- Unread count: {$unreadCount}\n";
