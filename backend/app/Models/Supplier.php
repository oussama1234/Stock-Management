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

    
    /**
     * Scope: text search by supplier fields
     */
    public function scopeSearch($query, string $term)
    {
        $t = '%' . str_replace('%', '\\%', $term) . '%';
        return $query->where(function ($q) use ($t) {
            $q->where('name', 'like', $t)
              ->orWhere('email', 'like', $t)
              ->orWhere('phone', 'like', $t);
        });
    }
}
