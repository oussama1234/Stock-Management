<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockMovement extends Model
{
    /** @use HasFactory<\\Database\\Factories\\StockMovementFactory> */
    use HasFactory;

    // determine the table name
    protected $table = 'stock_movements';

    // define fillable fields
    protected $fillable = [
        'product_id',
        'type',
        'quantity',
        'previous_stock', // stock before this movement
        'new_stock',      // stock after this movement
        'source_type',
        'source_id',
        'movement_date',
        'reason',         // manual adjustment reason
        'user_id',        // who made the adjustment
    ];

    // relationship with product
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    // relationship with user (who performed the movement)
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    // polymorphic relationship to source (purchase or sale)
    public function source()
    {
        return $this->morphTo(null, 'source_type', 'source_id');
    }

    /**
     * Scope: filter by [from, to] movement_date (inclusive)
     */
    public function scopeDateRange($query, $from, $to)
    {
        return $query->whereBetween('movement_date', [$from, $to]);
    }

    /**
     * Scope: filter by product
     */
    public function scopeForProduct($query, int $productId)
    {
        return $query->where('product_id', $productId);
    }

    /**
     * Scope: filter by movement type (in|out)
     */
    public function scopeOfType($query, string $type)
    {
        if (in_array($type, ['in','out'], true)) {
            return $query->where('type', $type);
        }
        return $query;
    }

    /**
     * Scope: text search by reason or product name
     */
    public function scopeSearch($query, string $term)
    {
        $t = '%' . str_replace('%', '\\%', $term) . '%';
        return $query->where(function ($q) use ($t) {
            $q->where('reason', 'like', $t)
              ->orWhereHas('product', function ($qq) use ($t) {
                  $qq->where('name', 'like', $t);
              });
        });
    }
}
