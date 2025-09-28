<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

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
        Schema::table('products', function (Blueprint $table) {
            if (!Schema::hasColumn('products', 'reserved_stock')) {
                $table->integer('reserved_stock')->default(0)->after('stock');
            }
        });
        // Add indexes if not exist (explicit names)
        if (!$this->indexExists('products', 'products_stock_index')) {
            Schema::table('products', function (Blueprint $table) { $table->index('stock', 'products_stock_index'); });
        }
        if (!$this->indexExists('products', 'products_reserved_stock_index')) {
            Schema::table('products', function (Blueprint $table) { $table->index('reserved_stock', 'products_reserved_stock_index'); });
        }

        Schema::table('stock_movements', function (Blueprint $table) {
            if (!Schema::hasColumn('stock_movements', 'reason')) {
                $table->string('reason', 50)->nullable()->after('movement_date');
            }
            if (!Schema::hasColumn('stock_movements', 'user_id')) {
                $table->unsignedBigInteger('user_id')->nullable()->after('reason');
            }
        });
        if (!$this->indexExists('stock_movements', 'stock_movements_product_id_index')) {
            Schema::table('stock_movements', function (Blueprint $table) { $table->index('product_id'); });
        }
        if (!$this->indexExists('stock_movements', 'stock_movements_movement_date_index')) {
            Schema::table('stock_movements', function (Blueprint $table) { $table->index('movement_date'); });
        }
        if (!$this->indexExists('stock_movements', 'stock_movements_reason_index')) {
            Schema::table('stock_movements', function (Blueprint $table) { $table->index('reason'); });
        }
        if (!$this->indexExists('stock_movements', 'stock_movements_user_id_index')) {
            Schema::table('stock_movements', function (Blueprint $table) { $table->index('user_id'); });
        }
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (Schema::hasColumn('products', 'reserved_stock')) {
                $table->dropColumn('reserved_stock');
            }
            try { $table->dropIndex('products_stock_index'); } catch (\Throwable $e) {}
            try { $table->dropIndex('products_reserved_stock_index'); } catch (\Throwable $e) {}
        });

        Schema::table('stock_movements', function (Blueprint $table) {
            if (Schema::hasColumn('stock_movements', 'reason')) {
                $table->dropColumn('reason');
            }
            if (Schema::hasColumn('stock_movements', 'user_id')) {
                $table->dropColumn('user_id');
            }
            try { $table->dropIndex('stock_movements_product_id_index'); } catch (\Throwable $e) {}
            try { $table->dropIndex('stock_movements_movement_date_index'); } catch (\Throwable $e) {}
            try { $table->dropIndex('stock_movements_reason_index'); } catch (\Throwable $e) {}
            try { $table->dropIndex('stock_movements_user_id_index'); } catch (\Throwable $e) {}
        });
    }
};
