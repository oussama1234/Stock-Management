<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Category>
 */
class CategoryFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        // Predefined realistic categories
        $categories = [
            ['name' => 'Electronics', 'description' => 'Devices and gadgets such as phones, laptops, TVs, and home appliances.'],
            ['name' => 'Home & Kitchen', 'description' => 'Cookware, utensils, storage solutions, and essentials for every home.'],
            ['name' => 'Office Supplies', 'description' => 'Stationery, printers, paper, and tools to keep your office running smoothly.'],
            ['name' => 'Furniture', 'description' => 'Chairs, desks, sofas, beds, and other furnishings for home and workplace.'],
            ['name' => 'Clothing & Apparel', 'description' => 'Men\'s, women\'s, and children\'s fashion for all seasons and occasions.'],
            ['name' => 'Shoes & Accessories', 'description' => 'Footwear, bags, belts, and fashion accessories for everyday wear.'],
            ['name' => 'Health & Beauty', 'description' => 'Cosmetics, skincare, personal care, and wellness products.'],
            ['name' => 'Sports & Outdoors', 'description' => 'Equipment, clothing, and gear for fitness, sports, and outdoor adventures.'],
            ['name' => 'Toys & Games', 'description' => 'Educational toys, board games, puzzles, and entertainment for all ages.'],
            ['name' => 'Books & Stationery', 'description' => 'Novels, educational books, notebooks, pens, and school supplies.'],
            ['name' => 'Food & Beverages', 'description' => 'Packaged foods, snacks, drinks, and everyday grocery items.'],
            ['name' => 'Cleaning & Household Essentials', 'description' => 'Detergents, cleaning tools, and daily household necessities.'],
            ['name' => 'Automotive & Tools', 'description' => 'Car accessories, repair tools, and maintenance essentials.'],
            ['name' => 'Garden & Outdoor', 'description' => 'Plants, garden tools, outdoor furniture, and decor for open spaces.'],
            ['name' => 'Pet Supplies', 'description' => 'Food, toys, grooming, and care products for pets of all kinds.'],
        ];
        
        $category = fake()->randomElement($categories);
        return $category;
    }
}
