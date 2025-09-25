<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    /**
     * Run the migrations.
     * 
     * Creates notifications table with optimized structure for performance
     * and flexibility. Includes proper indexing for fast queries.
     */
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            
            // Notification type and content
            $table->string('type', 50); // 'low_stock', 'sale_created', 'purchase_created'
            $table->string('title', 255);
            $table->text('message');
            $table->json('data')->nullable(); // Additional structured data
            
            // User and status
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('cascade');
            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();
            
            // Priority and category
            $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium');
            $table->string('category', 50)->default('general'); // 'inventory', 'sales', 'purchases', 'system'
            
            // Reference to related entities
            $table->morphs('notifiable'); // polymorphic relationship
            
            $table->timestamps();
            
            // Indexes for performance optimization
            $table->index(['user_id', 'is_read', 'created_at'], 'user_notifications_idx');
            $table->index(['type', 'created_at'], 'type_notifications_idx');
            $table->index(['category', 'priority'], 'category_priority_idx');
            $table->index(['notifiable_type', 'notifiable_id'], 'notifiable_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
