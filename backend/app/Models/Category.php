<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class Category extends Model
{
    /** @use HasFactory<\\Database\\Factories\\CategoryFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
    ];

    public function products()
    {
        return $this->hasMany(Product::class);
    }

    /**
     * Scope: simple search by name/description
     */
    public function scopeSearch(Builder $q, string $term): Builder
    {
        $t = trim($term);
        if ($t === '') return $q;
        return $q->where(function ($qq) use ($t) {
            $qq->where('name', 'like', "%$t%")
               ->orWhere('description', 'like', "%$t%");
        });
    }

    /**
     * Scope: stock status summarization on related products
     * - out: categories having at least one out-of-stock product
     * - low: categories having at least one low-stock product
     * - in: categories with products mostly in stock (default)
     */
    public function scopeStockStatus(Builder $q, string $status): Builder
    {
        $status = strtolower($status);
        return match ($status) {
            'out' => $q->whereHas('products', function ($p) {
                $p->where('stock', '=', 0);
            }),
            'low' => $q->whereHas('products', function ($p) {
                $p->where('stock', '>', 0)->whereColumn('stock', '<=', 'low_stock_threshold');
            }),
            default => $q->whereHas('products', function ($p) {
                $p->where('stock', '>', 0);
            }),
        };
    }
}
