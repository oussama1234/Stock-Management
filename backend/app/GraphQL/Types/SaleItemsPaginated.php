<?php

declare(strict_types=1);

namespace App\GraphQL\Types;

use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Type as GraphQLType;

class SaleItemsPaginated extends GraphQLType
{
    protected $attributes = [
        'name' => 'SaleItemsPaginated',
        'description' => 'A paginated list of sale items with metadata',
    ];

    public function fields(): array
    {
        return [
            'data' => [
                'type' => Type::listOf(GraphQL::type('SaleItem')),
                'description' => 'The sale items data for the current page',
            ],
            'meta' => [
                'type' => GraphQL::type('PaginationMeta'),
                'description' => 'Pagination metadata',
            ],
        ];
    }
}