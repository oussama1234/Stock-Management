<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SaleItem extends Model
{
    /** @use HasFactory<\\Database\\Factories\\SaleItemFactory> */
    use HasFactory;
    // determine the table name
    protected $table = 'sale_items';

    protected $fillable = [
        'sale_id',
        'product_id',
        'quantity',
        'price',
    ];

    // relationship with sale
    public function sale()
    {
        return $this->belongsTo(Sale::class);
    }
    // relationship with product
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Scope: filter by product id
     */
    public function scopeForProduct($query, int $productId)
    {
        return $query->where('product_id', $productId);
    }

    /**
     * Scope: filter by parent Sale's sale_date in [from, to]
     */
    public function scopeWithinSaleDateRange($query, $from, $to)
    {
        return $query->whereHas('sale', function ($q) use ($from, $to) {
            $q->whereBetween('sale_date', [$from, $to]);
        });
    }
}
