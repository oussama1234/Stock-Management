<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations\Products;

use App\Models\Product;
use App\Support\CacheHelper; // Invalidate caches on writes
use Closure;
use GraphQL\Type\Definition\ResolveInfo;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Mutation;
use Rebing\GraphQL\Support\SelectFields;

class UpdateProduct extends Mutation
{
    protected $attributes = [
        'name' => 'updateProduct',
        'description' => 'A mutation to update a product'
    ];

    public function type(): Type
    {
        return GraphQL::type('Product');
    }

    public function args(): array
    {
        return [
            'id' => [
                'name' => 'id',
                'type' => Type::nonNull(Type::int()),
            ],
            'product' => [
                'name' => 'product',
                'type' => GraphQL::type('productInput'),
            ],
        ];
    }

    public function rules(array $args = []): array
    {
        return [
            'id' => ['required', 'integer', 'exists:products,id'],
            'product' => ['required', 'array'],
            'product.name' => ['required', 'string', 'max:255'],
            'product.description' => ['required', 'string', 'max:255'],
            'product.price' => ['required', 'numeric'],
            'product.stock' => ['required', 'integer'],
            'product.category_id' => ['required', 'integer'],
            'product.image' => ['nullable','mimes:jpeg,png,jpg,gif,svg','max:2048'],
        ];
    }

    public function resolve($root, array $args, $context, ResolveInfo $resolveInfo, Closure $getSelectFields)
    {
        $fields = $getSelectFields();
        $select = $fields->getSelect();
        $with = $fields->getRelations();

        $productValues = $args['product'];
        $id = $args['id'];

        $product = Product::find($id);
        $product->name = $productValues['name'];
        $product->description = $productValues['description'];
        $product->price = $productValues['price'];
        $product->stock = $productValues['stock'];
        $product->category_id = $productValues['category_id'];

        if(isset($productValues['image'])) {
        
            $productFullImagePath = $product->uploadImage($productValues['image']);
            $product->image = $productFullImagePath;
        }

        $product->save();

        // Invalidate related caches so reads see fresh data
        CacheHelper::bump('products');
        CacheHelper::bump('dashboard_metrics');

        return $product;
        
    }
}
