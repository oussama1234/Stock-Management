<?php

declare(strict_types=1);

namespace App\GraphQL\Types;

use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Type as GraphQLType;

class PurchaseItemsPaginated extends GraphQLType
{
    protected $attributes = [
        'name' => 'PurchaseItemsPaginated',
        'description' => 'A paginated list of purchase items with metadata',
    ];

    public function fields(): array
    {
        return [
            'data' => [
                'type' => Type::listOf(GraphQL::type('PurchaseItem')),
                'description' => 'The purchase items data for the current page',
            ],
            'meta' => [
                'type' => GraphQL::type('PaginationMeta'),
                'description' => 'Pagination metadata',
            ],
        ];
    }
}