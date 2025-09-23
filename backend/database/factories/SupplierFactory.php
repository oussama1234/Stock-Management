<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\supplier>
 */
class SupplierFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        // Realistic supplier companies with appropriate contact details
        $suppliers = [
            [
                'name' => 'TechWorld Electronics Inc.',
                'email' => 'orders@techworld-electronics.com',
                'phone' => '+1-555-0101',
                'address' => '123 Silicon Valley Blvd, San Jose, CA 95110'
            ],
            [
                'name' => 'Global Kitchen Solutions',
                'email' => 'procurement@globalkitchen.com',
                'phone' => '+1-555-0202',
                'address' => '456 Industrial Park Dr, Chicago, IL 60601'
            ],
            [
                'name' => 'Office Pro Supplies Ltd.',
                'email' => 'sales@officepro.com',
                'phone' => '+1-555-0303',
                'address' => '789 Business Center Way, New York, NY 10001'
            ],
            [
                'name' => 'Furniture Direct Manufacturing',
                'email' => 'wholesale@furnituredirect.com',
                'phone' => '+1-555-0404',
                'address' => '321 Oak Street, Grand Rapids, MI 49503'
            ],
            [
                'name' => 'Fashion Forward Distributors',
                'email' => 'orders@fashionforward.com',
                'phone' => '+1-555-0505',
                'address' => '654 Garment District Ave, Los Angeles, CA 90015'
            ],
            [
                'name' => 'SportGear International',
                'email' => 'b2b@sportgear.com',
                'phone' => '+1-555-0606',
                'address' => '987 Athletic Way, Portland, OR 97201'
            ],
            [
                'name' => 'Beauty Essentials Wholesale',
                'email' => 'wholesale@beautyessentials.com',
                'phone' => '+1-555-0707',
                'address' => '147 Cosmetics Blvd, Miami, FL 33101'
            ],
            [
                'name' => 'Home & Garden Supply Co.',
                'email' => 'orders@homegarden.com',
                'phone' => '+1-555-0808',
                'address' => '258 Green Thumb Lane, Denver, CO 80202'
            ],
            [
                'name' => 'Automotive Parts Plus',
                'email' => 'sales@autopartsplus.com',
                'phone' => '+1-555-0909',
                'address' => '369 Motor City Dr, Detroit, MI 48201'
            ],
            [
                'name' => 'Educational Toys & Books Ltd.',
                'email' => 'bulk@edutoys.com',
                'phone' => '+1-555-1010',
                'address' => '741 Learning Lane, Boston, MA 02101'
            ]
        ];
        
        $supplier = $this->faker->randomElement($suppliers);
        
        return [
            'name' => $supplier['name'],
            'email' => $supplier['email'],
            'phone' => $supplier['phone'],
            'address' => $supplier['address'],
        ];
    }
}
