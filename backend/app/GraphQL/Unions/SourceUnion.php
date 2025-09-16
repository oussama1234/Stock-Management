<?php

declare(strict_types=1);

namespace App\GraphQL\Unions;

use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\UnionType;

class SourceUnion extends UnionType
{
    protected $attributes = [
        'name' => 'SourceUnion',
        'description' => 'Can be purchase or sale',
    ];

    public function types(): array
    {
        return [
            GraphQL::type('Purchase'),
            GraphQL::type('Sale'),
        ];
    }

    public function resolveType($value)
    {
        if($value instanceof \App\Models\Purchase) {
            return GraphQL::type('Purchase');
        } elseif ($value instanceof \App\Models\Sale) {
            return GraphQL::type('Sale');
        }

        return null;
    }
}
