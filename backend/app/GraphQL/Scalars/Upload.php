<?php

declare(strict_types=1);

namespace App\GraphQL\Scalars;

use Exception;
use GraphQL\Error\Error;
use GraphQL\Language\AST\Node;
use GraphQL\Type\Definition\Type;
use GraphQL\Type\Definition\ScalarType;
use Illuminate\Http\UploadedFile;
use Rebing\GraphQL\Support\Contracts\TypeConvertible;

class Upload extends ScalarType implements TypeConvertible
{
    /**
     * @var string
     */
    public String $name = 'Upload';

    /**
     * @var null|string
     */
    public ?string $description = 'The upload scalar type that represents file uploads.';

    /**
     * Serializes an internal value to include in a response.
     *
     * @param mixed $value
     *
     * @return mixed
     *
     * @throws Error
     */
    public function serialize($value)
    {
        Throw new Error('Upload Serialization is not supported.');
    }

    /**
     * Parses an externally provided value (query variable) to use as an input.
     *
     * In the case of an invalid value this method must throw an Exception
     *
     * @param mixed $value
     *
     * @return mixed
     *
     * @throws Error
     */
    public function parseValue($value)
    {
        if($value instanceof UploadedFile) {
             return $value;
        }

        Throw new Error('Upload must be an instance of UploadedFile.');
    }

    /**
     * Parses an externally provided literal value (hardcoded in GraphQL query) to use as an input.
     *
     * In the case of an invalid node or value this method must throw an Exception
     *
     * @param Node $valueNode
     * @param mixed[]|null $variables
     *
     * @return mixed
     *
     * @throws Exception
     */
    public function parseLiteral($valueNode, ?array $variables = null)
    {
        Throw new Error('Upload literal is not supported, use a variable.');
    }

    public function toType(): Type
    {
        return new static();
    }
}
