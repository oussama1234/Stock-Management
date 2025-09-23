<?php

declare(strict_types=1);

namespace App\GraphQL\Types;

use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Type as GraphQLType;

class PaginationMeta extends GraphQLType
{
    protected $attributes = [
        'name' => 'PaginationMeta',
        'description' => 'Pagination metadata information',
    ];

    public function fields(): array
    {
        return [
            'current_page' => [
                'type' => Type::int(),
                'description' => 'The current page number',
            ],
            'per_page' => [
                'type' => Type::int(),
                'description' => 'The number of items per page',
            ],
            'last_page' => [
                'type' => Type::int(),
                'description' => 'The last page number',
            ],
            'total' => [
                'type' => Type::int(),
                'description' => 'The total number of items',
            ],
            'from' => [
                'type' => Type::int(),
                'description' => 'The starting item number for the current page',
            ],
            'to' => [
                'type' => Type::int(),
                'description' => 'The ending item number for the current page',
            ],
            'has_more_pages' => [
                'type' => Type::boolean(),
                'description' => 'Whether there are more pages available',
            ],
        ];
    }
}