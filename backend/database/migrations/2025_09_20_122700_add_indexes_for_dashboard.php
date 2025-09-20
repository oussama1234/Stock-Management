<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->index('sale_date', 'sales_sale_date_index');
        });

        Schema::table('purchases', function (Blueprint $table) {
            $table->index('purchase_date', 'purchases_purchase_date_index');
        });

        Schema::table('stock_movements', function (Blueprint $table) {
            $table->index('movement_date', 'stock_movements_movement_date_index');
            $table->index('product_id', 'stock_movements_product_id_index');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->index('stock', 'products_stock_index');
            $table->index('category_id', 'products_category_id_index');
        });

        Schema::table('sale_items', function (Blueprint $table) {
            $table->index('product_id', 'sale_items_product_id_index');
            $table->index('sale_id', 'sale_items_sale_id_index');
        });

        Schema::table('purchase_items', function (Blueprint $table) {
            $table->index('product_id', 'purchase_items_product_id_index');
            $table->index('purchase_id', 'purchase_items_purchase_id_index');
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropIndex('sales_sale_date_index');
        });
        Schema::table('purchases', function (Blueprint $table) {
            $table->dropIndex('purchases_purchase_date_index');
        });
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->dropIndex('stock_movements_movement_date_index');
            $table->dropIndex('stock_movements_product_id_index');
        });
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex('products_stock_index');
            $table->dropIndex('products_category_id_index');
        });
        Schema::table('sale_items', function (Blueprint $table) {
            $table->dropIndex('sale_items_product_id_index');
            $table->dropIndex('sale_items_sale_id_index');
        });
        Schema::table('purchase_items', function (Blueprint $table) {
            $table->dropIndex('purchase_items_product_id_index');
            $table->dropIndex('purchase_items_purchase_id_index');
        });
    }
};
