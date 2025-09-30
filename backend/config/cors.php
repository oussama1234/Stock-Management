<?php

$origins = [env('FRONTEND_URL', 'http://localhost:5173')];

if (env('VERCEL_URL')) {
    $origins[] = 'https://' . env('VERCEL_URL');
}

if (env('CORS_ALLOWED_ORIGINS')) {
    $origins = array_merge($origins, explode(',', env('CORS_ALLOWED_ORIGINS')));
}

$origins = array_unique(array_filter($origins));

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'graphql'],
    'allowed_methods' => ['*'],
    'allowed_origins' => $origins,
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
