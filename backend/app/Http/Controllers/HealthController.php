<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class HealthController extends Controller
{
    /**
     * Health check endpoint for deployment monitoring
     */
    public function check(): JsonResponse
    {
        try {
            // Check database connection
            DB::connection()->getPdo();
            
            return response()->json([
                'status' => 'healthy',
                'timestamp' => now()->toISOString(),
                'database' => 'connected',
                'version' => config('app.version', '1.0.0')
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'unhealthy',
                'timestamp' => now()->toISOString(),
                'error' => 'Database connection failed',
                'database' => 'disconnected'
            ], 503);
        }
    }
}