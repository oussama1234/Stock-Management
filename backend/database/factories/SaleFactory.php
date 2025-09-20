<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Sale>
 */
class SaleFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            //
            // Define the default state for the Sale model here.

            'user_id' => \App\Models\User::factory(),
            'total_amount' => $this->faker->randomFloat(2, 10, 1000),
            'tax' => $this->faker->randomFloat(2, 0, 100),
            'discount' => $this->faker->randomFloat(2, 0, 100),
            'sale_date' => $this->faker->dateTimeBetween('-1 year', 'now'),
            'customer_name' => $this->faker->name(),

        ];
    }
}
