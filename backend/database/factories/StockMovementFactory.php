<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\StockMovement>
 */
class StockMovementFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */



    public function definition(): array
    {
        // Simple stock movement - will be created by advanced seeders
        return [
            'product_id' => 1, // Will be set by seeder
            'type' => $this->faker->randomElement(['in', 'out']),
            'quantity' => $this->faker->numberBetween(1, 100),
            'previous_stock' => 0, // Will be set by seeder
            'new_stock' => 0, // Will be set by seeder
            'source_type' => null, // Will be set by seeder
            'source_id' => null, // Will be set by seeder
            'movement_date' => $this->faker->dateTimeBetween('-1 year', 'now'),
        ];
    }
}




   

    

