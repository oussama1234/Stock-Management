<?php

declare(strict_types=1);

namespace App\GraphQL\Types\Response;

use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Type as GraphQLType;

class Response extends GraphQLType
{
    protected $attributes = [
        'name' => 'Response',
        'description' => 'A type for response',
    ];

    public function fields(): array
    {
        return [
            'success' => [
                'type' => Type::boolean(),
                'nullable' => true,
                'description' => 'Indicates whether the operation was successful.',
            ],
            'message' => [
                'type' => Type::string(),
                'nullable' => true,
                'description' => 'A message indicating the result of the operation.',
            ],
        ];
    }
}
