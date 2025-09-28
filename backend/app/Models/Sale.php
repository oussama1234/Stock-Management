<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Sale extends Model
{
    /** @use HasFactory<\\Database\\Factories\\SaleFactory> */
    use HasFactory;

    // Define the table name if it's not the plural of the model name
    protected $table = 'sales';

    protected $fillable = [
        'user_id',
        'total_amount',
        'tax',
        'discount',
        'sale_date',
        'customer_name',
    ];

    /**
     * The attributes that should be cast to native types.
     */
    protected $casts = [
        'sale_date' => 'datetime',
        'total_amount' => 'decimal:2',
        'tax' => 'decimal:2',
        'discount' => 'decimal:2',
    ];

    // relationship with users
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // relationship with sale items
    public function saleItems()
    {
        return $this->hasMany(SaleItem::class);
    }

    // alias for saleItems to match controller usage
    public function items()
    {
        return $this->hasMany(SaleItem::class);
    }

    /**
     * Scope: filter by [from, to] date range on sale_date (inclusive)
     */
    public function scopeDateRange($query, $from, $to)
    {
        return $query->whereBetween('sale_date', [$from, $to]);
    }

    /**
     * Scope: filter sales that include a specific product via items
     */
    public function scopeForProduct($query, int $productId)
    {
        return $query->whereHas('items', function ($q) use ($productId) {
            $q->where('product_id', $productId);
        });
    }

    /**
     * Scope: text search by customer name or product name
     */
    public function scopeSearch($query, string $term)
    {
        $t = '%' . str_replace('%', '\\%', $term) . '%';
        return $query->where(function ($q) use ($t) {
            $q->where('customer_name', 'like', $t)
              ->orWhere('id', 'like', $t)
              ->orWhereHas('items.product', function ($qq) use ($t) {
                  $qq->where('name', 'like', $t);
              });
        });
    }
}
