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
        Schema::table('users', function (Blueprint $table) {
            // Personal Information
            $table->string('phone')->nullable()->after('email');
            $table->text('bio')->nullable()->after('phone');
            $table->string('location')->nullable()->after('bio');
            $table->string('website')->nullable()->after('location');
            
            // Professional Information
            $table->string('job_title')->nullable()->after('website'); // e.g., "Stock Manager", "Inventory Specialist"
            $table->text('description')->nullable()->after('job_title'); // Professional description
            
            // Security
            $table->boolean('two_factor_enabled')->default(false)->after('description');
            $table->string('two_factor_secret')->nullable()->after('two_factor_enabled');
            
            // Profile Image
            $table->string('avatar')->nullable()->after('two_factor_secret');
            
            // Timestamps for profile updates
            $table->timestamp('profile_updated_at')->nullable()->after('avatar');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'phone',
                'bio',
                'location',
                'website',
                'job_title',
                'description',
                'two_factor_enabled',
                'two_factor_secret',
                'avatar',
                'profile_updated_at'
            ]);
        });
    }
};
