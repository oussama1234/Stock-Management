<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    private function indexExists(string $table, string $index): bool
    {
        $dbName = config('database.connections.mysql.database');
        $res = DB::select(
            'SELECT 1 FROM information_schema.statistics WHERE table_schema = ? AND table_name = ? AND index_name = ? LIMIT 1',
            [$dbName, $table, $index]
        );
        return !empty($res);
    }

    public function up(): void
    {
        // Products indexes
        if (!$this->indexExists('products', 'products_name_index')) {
            Schema::table('products', function (Blueprint $table) { $table->index('name', 'products_name_index'); });
        }
        if (Schema::hasColumn('products', 'description') && !$this->indexExists('products', 'products_description_index')) {
            // MySQL requires index length for TEXT; use prefix length 191 for utf8mb4 safety
            DB::statement('CREATE INDEX products_description_index ON products (description(191))');
        }

        // Suppliers indexes
        if (!$this->indexExists('suppliers', 'suppliers_name_index')) {
            Schema::table('suppliers', function (Blueprint $table) { $table->index('name', 'suppliers_name_index'); });
        }

        // Sales indexes
        if (Schema::hasColumn('sales', 'customer_name') && !$this->indexExists('sales', 'sales_customer_name_index')) {
            Schema::table('sales', function (Blueprint $table) { $table->index('customer_name', 'sales_customer_name_index'); });
        }

        // Stock movements indexes
        if (Schema::hasColumn('stock_movements', 'reason') && !$this->indexExists('stock_movements', 'stock_movements_reason_index')) {
            Schema::table('stock_movements', function (Blueprint $table) { $table->index('reason', 'stock_movements_reason_index'); });
        }
    }

    public function down(): void
    {
        try { Schema::table('products', function (Blueprint $t) { $t->dropIndex('products_name_index'); }); } catch (\Throwable $e) {}
        try { Schema::table('products', function (Blueprint $t) { $t->dropIndex('products_description_index'); }); } catch (\Throwable $e) {}
        try { Schema::table('suppliers', function (Blueprint $t) { $t->dropIndex('suppliers_name_index'); }); } catch (\Throwable $e) {}
        try { Schema::table('sales', function (Blueprint $t) { $t->dropIndex('sales_customer_name_index'); }); } catch (\Throwable $e) {}
        try { Schema::table('stock_movements', function (Blueprint $t) { $t->dropIndex('stock_movements_reason_index'); }); } catch (\Throwable $e) {}
    }
};
