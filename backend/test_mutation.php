<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// Create a test user for authentication
use Illuminate\Support\Facades\Auth;
use App\Models\User;

try {
    // Find or create a test user
    $user = User::first();
    if (!$user) {
        echo "No users found in database. Please create a user first." . PHP_EOL;
        exit(1);
    }
    
    // Login as this user
    Auth::login($user);
    echo "Logged in as user: " . $user->name . PHP_EOL;
    
    // Test GraphQL mutation
    $query = '
        mutation CreateSale($customer_name: String, $tax: Float, $discount: Float, $sale_date: String, $items: [SaleItemInput!]!) {
            createSale(customer_name: $customer_name, tax: $tax, discount: $discount, sale_date: $sale_date, items: $items) {
                id
                customer_name
                total_amount
                tax
                discount
                sale_date
                items {
                    id
                    product_id
                    quantity
                    price
                }
            }
        }
    ';
    
    $variables = [
        'customer_name' => 'Test Customer',
        'tax' => 10.0,
        'discount' => 5.0,
        'sale_date' => now()->toISOString(),
        'items' => [
            [
                'product_id' => 1,
                'quantity' => 2,
                'price' => 25.99
            ]
        ]
    ];
    
    echo "Executing GraphQL mutation..." . PHP_EOL;
    $result = app('graphql')->query($query, $variables);
    
    if (isset($result['errors'])) {
        echo "Errors:" . PHP_EOL;
        foreach ($result['errors'] as $error) {
            echo "- " . $error['message'] . PHP_EOL;
            if (isset($error['trace'])) {
                echo "Trace: " . PHP_EOL . $error['trace'] . PHP_EOL;
            }
        }
    } else {
        echo "Success!" . PHP_EOL;
        echo "Result: " . json_encode($result, JSON_PRETTY_PRINT) . PHP_EOL;
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . PHP_EOL;
    echo "Trace: " . $e->getTraceAsString() . PHP_EOL;
}