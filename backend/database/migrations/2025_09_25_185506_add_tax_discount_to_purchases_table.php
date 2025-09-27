<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('purchases', function (Blueprint $table) {
            $table->decimal('tax', 5, 2)->default(0)->after('total_amount')->comment('Tax percentage (0-100)');
            $table->decimal('discount', 5, 2)->default(0)->after('tax')->comment('Discount percentage (0-100)');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('purchases', function (Blueprint $table) {
            $table->dropColumn(['tax', 'discount']);
        });
    }
};
