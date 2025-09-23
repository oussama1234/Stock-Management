<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create realistic products for each category
        // Electronics (category_id: 1) - 8 products
        \App\Models\Product::factory(8)->forCategory(1)->create();
        
        // Home & Kitchen (category_id: 2) - 7 products
        \App\Models\Product::factory(7)->forCategory(2)->create();
        
        // Office Supplies (category_id: 3) - 7 products
        \App\Models\Product::factory(7)->forCategory(3)->create();
        
        // Furniture (category_id: 4) - 7 products
        \App\Models\Product::factory(7)->forCategory(4)->create();
        
        // Clothing & Apparel (category_id: 5) - 5 products
        \App\Models\Product::factory(5)->forCategory(5)->create();
        
        // Create additional products for remaining categories (6-15)
        for ($categoryId = 6; $categoryId <= 15; $categoryId++) {
            \App\Models\Product::factory(3)->forCategory($categoryId)->create();
        }
        
        // Total: 8 + 7 + 7 + 7 + 5 + (10 * 3) = 64 products
        echo "Created 64 realistic products across all categories\n";
    }
}
