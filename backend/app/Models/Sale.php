<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Sale extends Model
{
    /** @use HasFactory<\Database\Factories\SaleFactory> */
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

    


}
