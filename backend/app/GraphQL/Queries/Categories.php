<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Models\Category;
use App\Support\CacheHelper; // Namespaced cache helper
use Closure;
use GraphQL\Type\Definition\Type;
use GraphQL\Type\Definition\ResolveInfo;
use Illuminate\Support\Facades\Cache; // Laravel cache
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\SelectFields;
use Rebing\GraphQL\Support\Query;

class Categories extends Query
{
    protected $attributes = [
        'name' => 'categories',
        'description' => 'A query for categories'
    ];

    public function type(): Type
    {
        return Type::listOf(GraphQL::type('Category'));
    }

    public function args(): array
    {
        return [

        ];
    }

    public function resolve($root, array $args, $context, ResolveInfo $resolveInfo, Closure $getSelectFields)
    {
        /** @var SelectFields $fields */
        $fields = $getSelectFields();
        $select = $fields->getSelect();
        $with = $fields->getRelations();

        // Cache the full categories list since it changes infrequently
        $key = CacheHelper::key('categories', 'all', [
            'select' => $select,
            'with' => array_keys($with),
        ]);
        $ttl = CacheHelper::ttlSeconds('GRAPHQL_CATEGORIES_TTL', 300);

        return Cache::remember($key, now()->addSeconds($ttl), function () use ($with, $select) {
            return Category::with($with)->select($select)->get();
        });
    }
}
