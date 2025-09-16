<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // seed new data with factory method

// create an array with name and description values
      $categories = [
    'Electronics' => 'Devices and gadgets such as phones, laptops, TVs, and home appliances.',
    'Home & Kitchen' => 'Cookware, utensils, storage solutions, and essentials for every home.',
    'Office Supplies' => 'Stationery, printers, paper, and tools to keep your office running smoothly.',
    'Furniture' => 'Chairs, desks, sofas, beds, and other furnishings for home and workplace.',
    'Clothing & Apparel' => 'Men’s, women’s, and children’s fashion for all seasons and occasions.',
    'Shoes & Accessories' => 'Footwear, bags, belts, and fashion accessories for everyday wear.',
    'Health & Beauty' => 'Cosmetics, skincare, personal care, and wellness products.',
    'Sports & Outdoors' => 'Equipment, clothing, and gear for fitness, sports, and outdoor adventures.',
    'Toys & Games' => 'Educational toys, board games, puzzles, and entertainment for all ages.',
    'Books & Stationery' => 'Novels, educational books, notebooks, pens, and school supplies.',
    'Food & Beverages' => 'Packaged foods, snacks, drinks, and everyday grocery items.',
    'Cleaning & Household Essentials' => 'Detergents, cleaning tools, and daily household necessities.',
    'Automotive & Tools' => 'Car accessories, repair tools, and maintenance essentials.',
    'Garden & Outdoor' => 'Plants, garden tools, outdoor furniture, and decor for open spaces.',
    'Pet Supplies' => 'Food, toys, grooming, and care products for pets of all kinds.',
    'Jewelry & Watches' => 'Elegant jewelry, luxury watches, and fashion accessories.',
    'Art & Collectibles' => 'Paintings, crafts, collectibles, and creative hobby materials.',
    'Gifts' => 'Unique gift items for birthdays, holidays, and special occasions.',
];


        foreach($categories as $name => $description) {
            Category::factory()->create([
                'name' => $name,
                'description' => $description,
            ]);
        }






    }
}
