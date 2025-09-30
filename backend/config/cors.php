<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie', 'graphql'],

    'allowed_methods' => ['*'],

    'allowed_origins' => function() {
        $origins = [env('FRONTEND_URL', 'http://localhost:5173')];
        
        if (env('VERCEL_URL')) {
            $origins[] = 'https://' . env('VERCEL_URL');
        }
        
        if (env('CORS_ALLOWED_ORIGINS')) {
            $origins = array_merge($origins, explode(',', env('CORS_ALLOWED_ORIGINS')));
        }
        
        return array_unique(array_filter($origins));
    }(),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
