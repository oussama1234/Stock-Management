<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Purchase>
 */
class PurchaseFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            //define the factory fields for Purchase model
            'user_id' => \App\Models\User::factory(),
            'supplier_id' => \App\Models\Supplier::factory(),
            'total_amount' => $this->faker->randomFloat(2, 10,
            1000),
            'purchase_date' => $this->faker->dateTimeBetween('-1 year', 'now')->format('Y-m-d'),
        ];
    }
}
