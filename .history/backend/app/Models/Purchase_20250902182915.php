<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Purchase extends Model
{
    /** @use HasFactory<\Database\Factories\PurchaseFactory> */
    use HasFactory;

    protected $table = 'purchases';

    protected $fillable = [
        'user_id',
        'supplier_id',
        'total_amount',
        'purchase_date',
    ];

    // relationship with suppliers

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    // relationship with users

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // relationship with purchase items

    public function purchaseItems()
    {
        return $this->hasMany(PurchaseItem::class);
    }
}
