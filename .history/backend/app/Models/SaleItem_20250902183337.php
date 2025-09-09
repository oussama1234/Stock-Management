<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SaleItem extends Model
{
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

}
