<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
class PurchaseItem extends Model
{
    use hasFactory;
    // determine the table name
    protected $table = 'purchase_items';

    protected $fillable = [
        'purchase_id',
        'product_id',
        'quantity',
        'price',
    ];

    // relationship with purchase
    public function purchase()
    {
        return $this->belongsTo(Purchase::class);

    
    }

    // relationship with product
    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
