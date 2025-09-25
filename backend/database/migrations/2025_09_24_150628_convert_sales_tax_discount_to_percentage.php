<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use App\Models\Sale;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Convert existing tax and discount values to percentage format
     * and add constraints for percentage values (0-100)
     */
    public function up(): void
    {
        // First, let's analyze existing data and convert absolute values to percentages
        // For safety, we'll assume any value > 100 is an absolute amount that needs conversion
        
        DB::transaction(function () {
            // Get all sales with their items to calculate conversion
            $sales = Sale::with('saleItems')->get();
            
            foreach ($sales as $sale) {
                $subtotal = $sale->saleItems->sum(function($item) {
                    return $item->quantity * $item->price;
                });
                
                if ($subtotal > 0) {
                    // Convert tax: if current tax > 100, assume it's absolute and convert to percentage
                    if ($sale->tax > 100) {
                        $taxPercentage = min(100, ($sale->tax / $subtotal) * 100);
                        $sale->tax = round($taxPercentage, 2);
                    }
                    
                    // Convert discount: if current discount > 100, assume it's absolute and convert to percentage
                    if ($sale->discount > 100) {
                        $discountPercentage = min(100, ($sale->discount / $subtotal) * 100);
                        $sale->discount = round($discountPercentage, 2);
                    }
                    
                    // For values already <= 100, we assume they're already percentages
                    $sale->save();
                }
            }
        });
        
        Schema::table('sales', function (Blueprint $table) {
            // Update field comments to clarify percentage format
            $table->decimal('tax', 5, 2)->default(0)->comment('Tax percentage (0-100)')->change();
            $table->decimal('discount', 5, 2)->default(0)->comment('Discount percentage (0-100)')->change();
        });
        
        // Add check constraints to ensure valid percentage values
        DB::statement('ALTER TABLE sales ADD CONSTRAINT chk_tax_percentage CHECK (tax >= 0 AND tax <= 100)');
        DB::statement('ALTER TABLE sales ADD CONSTRAINT chk_discount_percentage CHECK (discount >= 0 AND discount <= 100)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop check constraints
        DB::statement('ALTER TABLE sales DROP CONSTRAINT IF EXISTS chk_tax_percentage');
        DB::statement('ALTER TABLE sales DROP CONSTRAINT IF EXISTS chk_discount_percentage');
        
        Schema::table('sales', function (Blueprint $table) {
            // Remove comments (revert to original)
            $table->decimal('tax', 5, 2)->default(0)->change();
            $table->decimal('discount', 10, 2)->default(0)->change();
        });
        
        // Note: We don't convert the data back as that would be lossy
        // Manual data restoration would be needed if rollback is required
    }
};
