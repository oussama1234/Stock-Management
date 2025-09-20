<?php

declare(strict_types=1);

namespace App\GraphQL\Unions;

use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\UnionType;

class SourceUnion extends UnionType
{
    protected $attributes = [
        'name' => 'SourceUnion',
        'description' => 'Can be purchaseItem or saleItem',
    ];

    public function types(): array
    {
        return [
            GraphQL::type('PurchaseItem'),
            GraphQL::type('SaleItem'),
        ];
    }

    public function resolveType($value)
    {
        if($value instanceof \App\Models\PurchaseItem) {
            return GraphQL::type('PurchaseItem');
        } elseif ($value instanceof \App\Models\SaleItem) {
            return GraphQL::type('SaleItem');
        }

        return null;
    }
}
