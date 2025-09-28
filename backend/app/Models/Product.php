<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use App\Models\Notification;

class Product extends Model
{
    /** @use HasFactory<\\Database\\Factories\\ProductFactory> */
    use HasFactory, Notifiable;

    protected $table = 'products';

    // define fillable fields

    protected $fillable = [
        'name',
        'description',
        'image',
        'price',
'stock',
        'reserved_stock',
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

    /**
     * Custom relation to system notifications using our App\Models\Notification
     * (separate from Laravel's DatabaseNotification from the Notifiable trait)
     */
    public function systemNotifications()
    {
        return $this->morphMany(Notification::class, 'notifiable');
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

    /**
     * Calculate cumulative days in stock since product creation.
     *
     * Rules:
     * - Start counting from created_at.
     * - When stock reaches 0, pause counting until it is restocked.
     * - Use stock_movements (new_stock <= 0) to detect zero events, and purchase_items
     *   creation times as restock events.
     * - If still out of stock, stop counting at "now".
     * - Return null when not computable rather than placeholder values.
     */
    public function getDaysInStockAttribute()
    {
        // Ensure we have a creation timestamp
        $createdAt = $this->created_at ? new \Carbon\Carbon($this->created_at) : null;
        if (!$createdAt) {
            return null; // Unknown
        }

        $now = now();
        $totalSeconds = max(0, $createdAt->diffInSeconds($now));

        // Gather all zero-stock events (when stock reached <= 0) from stock movements
        // and all restock events from purchase items
        $zeroEvents = $this->stockMovements()
            ->whereNotNull('new_stock')
            ->where('new_stock', '<=', 0)
            ->orderBy('movement_date')
            ->orderBy('id')
            ->get(['movement_date', 'created_at']);

        $restockEvents = $this->purchaseItems()
            ->orderBy('created_at')
            ->orderBy('id')
            ->get(['created_at']);

        $downtimeSeconds = 0;
        $pIndex = 0;
        $restockCount = $restockEvents->count();

        foreach ($zeroEvents as $idx => $zero) {
            $zeroStart = $zero->movement_date
                ? new \Carbon\Carbon($zero->movement_date)
                : new \Carbon\Carbon($zero->created_at);

            // Clamp to product lifetime
            if ($zeroStart->lessThan($createdAt)) {
                $zeroStart = $createdAt->copy();
            }

            // Advance to the first purchase strictly after zero start
            while ($pIndex < $restockCount) {
                $candidate = new \Carbon\Carbon($restockEvents[$pIndex]->created_at);
                if ($candidate->greaterThan($zeroStart)) {
                    break;
                }
                $pIndex++;
            }

            $end = null;
            if ($pIndex < $restockCount) {
                $end = new \Carbon\Carbon($restockEvents[$pIndex]->created_at); // restocked
            } else {
                // If currently out of stock and this is the last zero event, extend to now
                if ((int) $this->stock <= 0 && $idx === ($zeroEvents->count() - 1)) {
                    $end = $now;
                } elseif ((int) $this->stock > 0 && $idx === ($zeroEvents->count() - 1) && $this->updated_at) {
                    // Fallback: if we have no purchase record but stock is positive and updated_at is after zero,
                    // assume the product was restocked at updated_at (e.g., manual adjustment)
                    $ua = new \Carbon\Carbon($this->updated_at);
                    if ($ua->greaterThan($zeroStart)) {
                        $end = $ua;
                    }
                }
            }

            if ($end && $end->greaterThan($zeroStart)) {
                $downtimeSeconds += $zeroStart->diffInSeconds($end);
            }
        }

        $inStockSeconds = max(0, $totalSeconds - $downtimeSeconds);

        // If we truly can't compute anything meaningful, return null (so UI can show N/A)
        if ($totalSeconds === 0 && $inStockSeconds === 0) {
            return null;
        }

        return (int) floor($inStockSeconds / 86400);
    }

    /**
     * Accessor: available stock = stock - reserved_stock
     */
    public function getAvailableStockAttribute()
    {
        $reserved = (int) ($this->reserved_stock ?? 0);
        return max(0, (int) $this->stock - $reserved);
    }

    /**
     * Scope: stock status
     */
    public function scopeStockStatus($query, string $status)
    {
        $thresholdExpr = DB::raw('COALESCE(low_stock_threshold, 10)');
        return match ($status) {
            'out' => $query->where('stock', '=', 0),
            'low' => $query->whereColumn('stock', '<=', 'low_stock_threshold'),
            'in' => $query->where('stock', '>', 0)->whereColumn('stock', '>', 'low_stock_threshold'),
            default => $query,
        };
    }

    /**
     * Scope: basic text search by name/description
     */
    public function scopeSearch($query, string $term)
    {
        $t = '%' . str_replace('%', '\\%', $term) . '%';
        return $query->where(function ($q) use ($t) {
            $q->where('name', 'like', $t)
              ->orWhere('description', 'like', $t);
        });
    }
}
