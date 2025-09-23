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
        Schema::create('preferences', function (Blueprint $table) {
            $table->id();
            
            // User relationship
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            
            // Theme preferences
            $table->boolean('dark_mode')->default(false);
            $table->string('theme_color', 50)->default('blue'); // For future theme color customization
            
            // Notification preferences
            $table->boolean('notifications_enabled')->default(true);
            $table->boolean('email_notifications')->default(true);
            $table->boolean('push_notifications')->default(true);
            $table->boolean('low_stock_alerts')->default(true);
            $table->boolean('sales_notifications')->default(true);
            $table->boolean('purchase_notifications')->default(true);
            
            // Dashboard preferences
            $table->json('dashboard_widgets')->nullable(); // Which widgets to show
            $table->string('default_date_range', 20)->default('30'); // Default analytics period
            $table->integer('items_per_page')->default(20);
            
            // Language and locale
            $table->string('language', 10)->default('en');
            $table->string('timezone', 50)->default('UTC');
            $table->string('currency', 10)->default('USD');
            
            // Privacy settings
            $table->boolean('profile_public')->default(false);
            $table->boolean('show_online_status')->default(true);
            
            $table->timestamps();
            
            // Ensure one preference record per user
            $table->unique('user_id');
            $table->index(['user_id', 'dark_mode']); // For dark mode queries
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('preferences');
    }
};
