<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    /** @use HasFactory<\Database\Factories\SupplierFactory> */
    use HasFactory;

    // define the table name
    protected $table = 'suppliers';

    protected $fillable = [
        'name',
        'email',
        'phone',
        'address',
    ];

    // relationship with purchases
    public function purchases()
    {
        return $this->hasMany(Purchase::class);
    }

    
}
