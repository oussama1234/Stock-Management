<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

try {
    $schema = app('graphql')->schema();
    $mutation = $schema->getMutationType();
    $createSaleField = $mutation->getField('createSale');
    $args = $createSaleField->args;
    
    echo "CreateSale mutation arguments:" . PHP_EOL;
    foreach ($args as $arg) {
        echo "Arg: " . $arg->name . " Type: " . $arg->getType() . PHP_EOL;
    }
    
    echo PHP_EOL . "SaleItemInput type info:" . PHP_EOL;
    $saleItemInput = $schema->getType('SaleItemInput');
    if ($saleItemInput) {
        echo "Found SaleItemInput: " . $saleItemInput->name . PHP_EOL;
        echo "Description: " . $saleItemInput->description . PHP_EOL;
        $fields = $saleItemInput->getFields();
        foreach ($fields as $field) {
            echo "Field: " . $field->name . " Type: " . $field->getType() . PHP_EOL;
        }
    } else {
        echo "SaleItemInput not found!" . PHP_EOL;
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . PHP_EOL;
    echo "Trace: " . $e->getTraceAsString() . PHP_EOL;
}