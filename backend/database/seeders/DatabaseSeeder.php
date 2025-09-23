<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed in proper order to maintain foreign key relationships
        $this->call([
            // 1. Base entities first (no foreign keys)
            UserSeeder::class,
            CategorySeeder::class,
            SupplierSeeder::class,
            
            // 2. Products (depends on categories)
            ProductSeeder::class,
            
            // 3. Purchases and purchase items with stock management
            AdvancedPurchaseSeeder::class,
            
            // 4. Sales and sale items with stock management  
            AdvancedSaleSeeder::class,
        ]);
        
        echo "\n=== Database seeding completed successfully! ===\n";
        echo "Created realistic data with proper relationships and accurate stock management.\n";
    }
}
