<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations\Products;

use App\Models\Product;
use Closure;
use GraphQL\Type\Definition\ResolveInfo;
use GraphQL\Type\Definition\Type;

use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Mutation;
use Rebing\GraphQL\Support\SelectFields;

class CreateProduct extends Mutation
{
    protected $attributes = [
        'name' => 'createProduct',
        'description' => 'A mutation for creating a new product',
    ];

    public function type(): Type
    {
        return GraphQL::type('Product');
    }

    public function args(): array
    {
        return [
            'product' => [
                'name' => 'product',
                'type' => GraphQL::type('productInput'),
            ],
        ];
    }
    
    // defining the rules of the input for validation
    public function rules(array $args = []): array
    {
        return [
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

        $product = Product::create([
            'name' => $productValues['name'],
            'description' => $productValues['description'],
            'price' => $productValues['price'],
            'stock' => $productValues['stock'],
            'category_id' => $productValues['category_id'],
        ]);

        if(isset($productValues['image'])) {
            
            $productFullImagePath = $product->uploadImage($productValues['image']);
            $product->image = $productFullImagePath;
            $product->save();
        }
            


        return $product;
    }
}
