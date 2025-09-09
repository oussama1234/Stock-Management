<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockMovement extends Model
{
    /** @use HasFactory<\Database\Factories\StockMovementFactory> */
    use HasFactory;

    // determine the table name
    protected $table = 'stock_movements';

    // define fillable fields
    protected $fillable = [
        'product_id',
        'type',
        'quantity',
        'source_type',
        'source_id',
        'movement_date',
    ];

    // relationship with product
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    // polymorphic relationship to source (purchase or sale)
    public function source()
    {
        return $this->morphTo(null, 'source_type', 'source_id');
    }

    
}
