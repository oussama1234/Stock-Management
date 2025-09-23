<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Product>
 */
class ProductFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        // Realistic products organized by category type
        $productsByCategory = [
            // Electronics
            1 => [
                ['name' => 'iPhone 15 Pro', 'description' => 'Latest Apple smartphone with advanced camera system and A17 Pro chip', 'price' => 999.99],
                ['name' => 'Samsung Galaxy S24', 'description' => 'Flagship Android smartphone with AI features and excellent display', 'price' => 849.99],
                ['name' => 'MacBook Air M3', 'description' => 'Ultra-thin laptop with Apple M3 chip, perfect for productivity', 'price' => 1299.99],
                ['name' => 'Dell XPS 13', 'description' => 'Premium Windows laptop with stunning InfinityEdge display', 'price' => 1199.99],
                ['name' => 'Sony WH-1000XM5', 'description' => 'Premium noise-canceling wireless headphones', 'price' => 399.99],
                ['name' => 'iPad Pro 12.9"', 'description' => 'Professional tablet with M4 chip and Liquid Retina XDR display', 'price' => 1099.99],
            ],
            // Home & Kitchen
            2 => [
                ['name' => 'KitchenAid Stand Mixer', 'description' => 'Professional-grade stand mixer for baking and cooking', 'price' => 329.99],
                ['name' => 'Instant Pot Duo 7-in-1', 'description' => 'Multi-functional pressure cooker, rice cooker, steamer', 'price' => 99.99],
                ['name' => 'Ninja Foodi Blender', 'description' => 'High-performance blender with crushing technology', 'price' => 179.99],
                ['name' => 'Cuisinart Coffee Maker', 'description' => '12-cup programmable drip coffee maker with thermal carafe', 'price' => 89.99],
                ['name' => 'All-Clad Cookware Set', 'description' => '10-piece stainless steel cookware set', 'price' => 599.99],
            ],
            // Office Supplies
            3 => [
                ['name' => 'Herman Miller Aeron Chair', 'description' => 'Ergonomic office chair with advanced PostureFit technology', 'price' => 1395.00],
                ['name' => 'HP LaserJet Pro Printer', 'description' => 'Fast monochrome laser printer for office use', 'price' => 199.99],
                ['name' => 'Moleskine Classic Notebook', 'description' => 'Hard cover ruled notebook, large size', 'price' => 24.99],
                ['name' => 'Stapler Heavy Duty', 'description' => 'Professional desktop stapler for high-volume use', 'price' => 45.99],
                ['name' => 'Paper Shredder Cross-Cut', 'description' => 'Security paper shredder with 12-sheet capacity', 'price' => 129.99],
            ],
            // Furniture
            4 => [
                ['name' => 'IKEA Malm Dresser', 'description' => '6-drawer dresser with smooth-running drawers', 'price' => 179.99],
                ['name' => 'West Elm Mid-Century Sofa', 'description' => 'Modern 3-seater sofa with velvet upholstery', 'price' => 1299.99],
                ['name' => 'Standing Desk Converter', 'description' => 'Adjustable height desk converter for ergonomic work', 'price' => 299.99],
                ['name' => 'Queen Size Platform Bed', 'description' => 'Minimalist platform bed frame with headboard', 'price' => 449.99],
                ['name' => 'Bookshelf 5-Tier', 'description' => 'Wooden bookshelf with 5 adjustable shelves', 'price' => 159.99],
            ],
            // Default for other categories
            'default' => [
                ['name' => 'Premium Product', 'description' => 'High-quality product with excellent features', 'price' => 99.99],
                ['name' => 'Standard Item', 'description' => 'Reliable everyday product for general use', 'price' => 49.99],
                ['name' => 'Budget Option', 'description' => 'Affordable solution without compromising quality', 'price' => 24.99],
            ]
        ];

        // Get category ID (will be set by seeder or default to random)
        $categoryId = $this->faker->numberBetween(1, 15);
        
        // Select appropriate products for the category
        $products = $productsByCategory[$categoryId] ?? $productsByCategory['default'];
        $selectedProduct = $this->faker->randomElement($products);
        
        return [
            'name' => $selectedProduct['name'],
            'description' => $selectedProduct['description'],
            'image' => null,
            'price' => $selectedProduct['price'],
            'stock' => $this->faker->numberBetween(10, 100), // Initial stock before purchases/sales
            'category_id' => $categoryId,
        ];
    }
    
    /**
     * Create a product for a specific category
     */
    public function forCategory($categoryId)
    {
        return $this->state(function (array $attributes) use ($categoryId) {
            // Realistic products organized by category
            $productsByCategory = [
                // Electronics
                1 => [
                    ['name' => 'iPhone 15 Pro', 'description' => 'Latest Apple smartphone with advanced camera system and A17 Pro chip', 'price' => 999.99],
                    ['name' => 'Samsung Galaxy S24', 'description' => 'Flagship Android smartphone with AI features and excellent display', 'price' => 849.99],
                    ['name' => 'MacBook Air M3', 'description' => 'Ultra-thin laptop with Apple M3 chip, perfect for productivity', 'price' => 1299.99],
                    ['name' => 'Dell XPS 13', 'description' => 'Premium Windows laptop with stunning InfinityEdge display', 'price' => 1199.99],
                    ['name' => 'Sony WH-1000XM5', 'description' => 'Premium noise-canceling wireless headphones', 'price' => 399.99],
                    ['name' => 'iPad Pro 12.9"', 'description' => 'Professional tablet with M4 chip and Liquid Retina XDR display', 'price' => 1099.99],
                    ['name' => '4K Smart TV 55"', 'description' => 'Ultra HD Smart TV with HDR and streaming apps', 'price' => 649.99],
                    ['name' => 'Gaming Console PS5', 'description' => 'Latest PlayStation 5 gaming console with ultra-fast SSD', 'price' => 499.99],
                ],
                // Home & Kitchen
                2 => [
                    ['name' => 'KitchenAid Stand Mixer', 'description' => 'Professional-grade stand mixer for baking and cooking', 'price' => 329.99],
                    ['name' => 'Instant Pot Duo 7-in-1', 'description' => 'Multi-functional pressure cooker, rice cooker, steamer', 'price' => 99.99],
                    ['name' => 'Ninja Foodi Blender', 'description' => 'High-performance blender with crushing technology', 'price' => 179.99],
                    ['name' => 'Cuisinart Coffee Maker', 'description' => '12-cup programmable drip coffee maker with thermal carafe', 'price' => 89.99],
                    ['name' => 'All-Clad Cookware Set', 'description' => '10-piece stainless steel cookware set', 'price' => 599.99],
                    ['name' => 'Dyson V15 Vacuum', 'description' => 'Cordless vacuum cleaner with laser dust detection', 'price' => 749.99],
                    ['name' => 'Air Fryer Deluxe', 'description' => '8-quart air fryer with multiple cooking functions', 'price' => 129.99],
                ],
                // Office Supplies
                3 => [
                    ['name' => 'Herman Miller Aeron Chair', 'description' => 'Ergonomic office chair with advanced PostureFit technology', 'price' => 1395.00],
                    ['name' => 'HP LaserJet Pro Printer', 'description' => 'Fast monochrome laser printer for office use', 'price' => 199.99],
                    ['name' => 'Moleskine Classic Notebook', 'description' => 'Hard cover ruled notebook, large size', 'price' => 24.99],
                    ['name' => 'Stapler Heavy Duty', 'description' => 'Professional desktop stapler for high-volume use', 'price' => 45.99],
                    ['name' => 'Paper Shredder Cross-Cut', 'description' => 'Security paper shredder with 12-sheet capacity', 'price' => 129.99],
                    ['name' => 'Wireless Keyboard & Mouse', 'description' => 'Ergonomic wireless keyboard and mouse combo', 'price' => 79.99],
                    ['name' => 'Monitor 27" 4K', 'description' => 'Ultra HD monitor perfect for professional work', 'price' => 349.99],
                ],
                // Furniture
                4 => [
                    ['name' => 'IKEA Malm Dresser', 'description' => '6-drawer dresser with smooth-running drawers', 'price' => 179.99],
                    ['name' => 'West Elm Mid-Century Sofa', 'description' => 'Modern 3-seater sofa with velvet upholstery', 'price' => 1299.99],
                    ['name' => 'Standing Desk Converter', 'description' => 'Adjustable height desk converter for ergonomic work', 'price' => 299.99],
                    ['name' => 'Queen Size Platform Bed', 'description' => 'Minimalist platform bed frame with headboard', 'price' => 449.99],
                    ['name' => 'Bookshelf 5-Tier', 'description' => 'Wooden bookshelf with 5 adjustable shelves', 'price' => 159.99],
                    ['name' => 'Dining Table Oak', 'description' => 'Solid oak dining table seats 6 people', 'price' => 799.99],
                    ['name' => 'Office Desk L-Shaped', 'description' => 'Spacious L-shaped desk with built-in storage', 'price' => 399.99],
                ],
                // Clothing & Apparel
                5 => [
                    ['name' => 'Levi\'s 501 Jeans', 'description' => 'Classic straight-leg denim jeans, original fit', 'price' => 89.99],
                    ['name' => 'Nike Air Max Sneakers', 'description' => 'Comfortable running shoes with air cushioning', 'price' => 129.99],
                    ['name' => 'Patagonia Fleece Jacket', 'description' => 'Warm and lightweight fleece jacket for outdoor activities', 'price' => 149.99],
                    ['name' => 'Cotton T-Shirt Pack', 'description' => 'Pack of 3 premium cotton t-shirts in assorted colors', 'price' => 39.99],
                    ['name' => 'Winter Wool Coat', 'description' => 'Elegant wool coat perfect for cold weather', 'price' => 259.99],
                ],
                // Default for other categories
                'default' => [
                    ['name' => 'Premium Product', 'description' => 'High-quality product with excellent features', 'price' => 99.99],
                    ['name' => 'Standard Item', 'description' => 'Reliable everyday product for general use', 'price' => 49.99],
                    ['name' => 'Budget Option', 'description' => 'Affordable solution without compromising quality', 'price' => 24.99],
                    ['name' => 'Professional Tool', 'description' => 'Professional-grade tool for expert use', 'price' => 199.99],
                    ['name' => 'Household Essential', 'description' => 'Essential item for daily household needs', 'price' => 29.99],
                ]
            ];
            
            // Select appropriate products for the category
            $products = $productsByCategory[$categoryId] ?? $productsByCategory['default'];
            $selectedProduct = $this->faker->randomElement($products);
            
            return [
                'name' => $selectedProduct['name'],
                'description' => $selectedProduct['description'],
                'price' => $selectedProduct['price'],
                'category_id' => $categoryId,
            ];
        });
    }
}
