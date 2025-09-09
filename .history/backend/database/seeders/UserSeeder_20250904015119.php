<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
         // Create a specific admin
        User::factory()->create([
            'name' => 'Oussama Meqqadmi',
            'email' => 'admin@example.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
        ]);

        // Create additional users with various roles
        User::factory()->count(10)->create();

        // Optionally, create specific users for each role
        User::factory()->create([
            'name' => 'Manager User',
            'email' => 'manager@example.com',
            'password' => bcrypt('password'),
            'role' => 'manager',
        ]);

        User::factory()->create([
            'name' => 'Staff User',
            'email' => 'staff@example.com',
            'password' => bcrypt('password'),
            'role' => 'staff',
        ]);
    }
}
