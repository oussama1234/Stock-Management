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
        if (!$this->indexExists('users', 'users_name_index')) {
            Schema::table('users', function (Blueprint $table) { $table->index('name', 'users_name_index'); });
        }
        if (!$this->indexExists('users', 'users_email_index')) {
            Schema::table('users', function (Blueprint $table) { $table->index('email', 'users_email_index'); });
        }
        if (Schema::hasColumn('users', 'role') && !$this->indexExists('users', 'users_role_index')) {
            Schema::table('users', function (Blueprint $table) { $table->index('role', 'users_role_index'); });
        }
    }

    public function down(): void
    {
        try { Schema::table('users', function (Blueprint $t) { $t->dropIndex('users_name_index'); }); } catch (\Throwable $e) {}
        try { Schema::table('users', function (Blueprint $t) { $t->dropIndex('users_email_index'); }); } catch (\Throwable $e) {}
        try { Schema::table('users', function (Blueprint $t) { $t->dropIndex('users_role_index'); }); } catch (\Throwable $e) {}
    }
};
