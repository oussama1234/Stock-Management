<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    /** @use HasFactory<\Database\Factories\ProductFactory> */
    use HasFactory;

    protected $table = 'products';

    // define fillable fields

    protected $fillable = [
        'name',
        'description',
        'image',
        'price',
        'stock',
    ];

    public function stockMovements()
    {
        return $this->hasMany(StockMovement::class);
    }

    // adding relationships of purchase items and sale items with products

    public function purchaseItems()
    {
        return $this->hasMany(PurchaseItem::class);
    }

    public function saleItems()
    {
        return $this->hasMany(SaleItem::class);
    }


}
