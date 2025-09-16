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

class DeleteProduct extends Mutation
{
    protected $attributes = [
        'name' => 'deleteProduct',
        'description' => 'A mutation to delete a product',
    ];

    public function type(): Type
    {
        return GraphQL::type('Response');
    }

    public function args(): array
    {
        return [
            'id' => [
                'name' => 'id',
                'type' => Type::nonNull(Type::int()),
            ],
        ];
    }

    /**
     * Resolves the delete product mutation.
     *
     * This function takes the root value, arguments, context, resolve info and
     * a closure to get the select fields and returns an array with a success
     * message after deleting the product.
     *
     * @param mixed $root The root value of the query.
     * @param array $args The arguments passed to the mutation.
     * @param mixed $context The context of the query.
     * @param ResolveInfo $resolveInfo The resolve info of the query.
     * @param Closure $getSelectFields A closure to get the select fields.
     *
     * @return array
     */
    public function resolve($root, array $args, $context, ResolveInfo $resolveInfo, Closure $getSelectFields)
    {
        $fields = $getSelectFields();
        $select = $fields->getSelect();
        $with = $fields->getRelations();
        // get the id from the request, GraphQL argument Delete Mutation
        $RequestId = $args['id'];

        $product = Product::find($RequestId);
        // check if the product has an image, then it should be deleted
        $product->productHasImage();
        $product->delete();

        return [
            'success' => true,
            'message' => 'Product deleted successfully!',
        ];
    }
}
