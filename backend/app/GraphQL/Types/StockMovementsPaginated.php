<?php

declare(strict_types=1);

namespace App\GraphQL\Types;

use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Type as GraphQLType;

class StockMovementsPaginated extends GraphQLType
{
    protected $attributes = [
        'name' => 'StockMovementsPaginated',
        'description' => 'A paginated list of stock movements with metadata',
    ];

    public function fields(): array
    {
        return [
            'data' => [
                'type' => Type::listOf(GraphQL::type('StockMovement')),
                'description' => 'The stock movements data for the current page',
            ],
            'meta' => [
                'type' => GraphQL::type('PaginationMeta'),
                'description' => 'Pagination metadata',
            ],
        ];
    }
}