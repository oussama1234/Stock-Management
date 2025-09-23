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
        $subtotal = $this->faker->randomFloat(2, 50, 2000);
        $tax = $subtotal * 0.08; // 8% tax
        $discount = $this->faker->randomFloat(2, 0, $subtotal * 0.1); // Up to 10% discount
        $totalAmount = $subtotal + $tax - $discount;

        return [
            'user_id' => $this->faker->numberBetween(1, 10), // Reference existing users
            'total_amount' => 0, // Will be calculated based on sale items
            'tax' => $tax,
            'discount' => $discount,
            'sale_date' => $this->faker->dateTimeBetween('-3 months', 'now'),
            'customer_name' => $this->faker->name(),
        ];
    }
}
