<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Purchase extends Model
{
    /** @use HasFactory<\Database\Factories\PurchaseFactory> */
    use HasFactory;

    protected $table = 'purchases';

    protected $fillable = [
        'user_id',
        'supplier_id',
        'total_amount',
        'tax',
        'discount',
        'purchase_date',
    ];

    /**
     * The attributes that should be cast to native types.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'purchase_date' => 'datetime',
        'total_amount' => 'decimal:2',
        'tax' => 'decimal:2',
        'discount' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relationship with suppliers
     * Each purchase belongs to one supplier
     */
    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    /**
     * Relationship with users
     * Each purchase belongs to one user (purchaser)
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relationship with purchase items
     * Each purchase can have multiple line items
     */
    public function purchaseItems()
    {
        return $this->hasMany(PurchaseItem::class);
    }

    /**
     * Alternative accessor for items (to match the API response structure)
     * This makes the relationship more consistent with the Sales model
     */
    public function items()
    {
        return $this->hasMany(PurchaseItem::class);
    }

    /**
     * Accessor for formatted purchase date
     */
    public function getFormattedDateAttribute()
    {
        return $this->purchase_date ? $this->purchase_date->format('Y-m-d H:i:s') : null;
    }

    /**
     * Scope for filtering by date range
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('purchase_date', [$startDate, $endDate]);
    }

    /**
     * Scope for filtering by supplier
     */
    public function scopeForSupplier($query, $supplierId)
    {
        return $query->where('supplier_id', $supplierId);
    }

    /**
     * Scope for filtering by user/purchaser
     */
    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope: text search by supplier name or id
     */
    public function scopeSearch($query, string $term)
    {
        $t = '%' . str_replace('%', '\\%', $term) . '%';
        return $query->where(function ($q) use ($t) {
            $q->where('id', 'like', $t)
              ->orWhereHas('supplier', function ($qq) use ($t) {
                  $qq->where('name', 'like', $t);
              });
        });
    }
}
