<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class PurchaseItem extends Model
{
    use HasFactory;
    
    // Determine the table name
    protected $table = 'purchase_items';

    protected $fillable = [
        'purchase_id',
        'product_id',
        'quantity',
        'price',
    ];

    /**
     * The attributes that should be cast to native types.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'quantity' => 'integer',
        'price' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relationship with purchase
     * Each purchase item belongs to one purchase
     */
    public function purchase()
    {
        return $this->belongsTo(Purchase::class);
    }

    /**
     * Relationship with product
     * Each purchase item belongs to one product
     */
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Calculate the total amount for this line item
     * 
     * @return float
     */
    public function getLineTotalAttribute()
    {
        return $this->quantity * $this->price;
    }

    /**
     * Scope for filtering by product
     */
    public function scopeForProduct($query, $productId)
    {
        return $query->where('product_id', $productId);
    }

    /**
     * Scope for filtering by purchase
     */
    public function scopeForPurchase($query, $purchaseId)
    {
        return $query->where('purchase_id', $purchaseId);
    }
}
