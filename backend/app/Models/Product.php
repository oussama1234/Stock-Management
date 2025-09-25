<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Storage;

class Product extends Model
{
    /** @use HasFactory<\Database\Factories\ProductFactory> */
    use HasFactory, Notifiable;

    protected $table = 'products';

    // define fillable fields

    protected $fillable = [
        'name',
        'description',
        'image',
        'price',
        'stock',
        'low_stock_threshold',
        'category_id',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

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

    public function uploadImage($file)
    {
       

        $this->productHasImage();

        if($file)
        {
            $path = $file->store('product_images', 'public');

            return asset('storage/' . $path);
        }
       
            
        
        
    }

    public function productHasImage()
    {
           if($this->image) {
           $relativePath = str_replace(asset('storage') . '/', '', $this->image);
           Storage::disk('public')->delete($relativePath); 
        }
    }
}
