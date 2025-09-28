<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class InventoryListRequestInputs extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'page' => 'sometimes|integer|min:1',
            'per_page' => 'sometimes|integer|min:1|max:100',
            'search' => 'sometimes|string|max:255',
            'category_id' => 'sometimes|integer|exists:categories,id',
            'supplier_id' => 'sometimes|integer|exists:suppliers,id',
            'stock_status' => 'sometimes|string|in:low,out,in',
            'sort_by' => 'sometimes|string|in:name,stock,reserved_stock,updated_at,created_at',
            'sort_order' => 'sometimes|string|in:asc,desc',
        ];
    }

    public function sanitized(): array
    {
        $v = $this->validated();
        return [
            'page' => (int) ($v['page'] ?? 1),
            'per_page' => (int) ($v['per_page'] ?? 20),
            'search' => $v['search'] ?? '',
            'category_id' => $v['category_id'] ?? null,
            'supplier_id' => $v['supplier_id'] ?? null,
            'stock_status' => $v['stock_status'] ?? null,
            'sort_by' => $v['sort_by'] ?? 'updated_at',
            'sort_order' => $v['sort_order'] ?? 'desc',
        ];
    }
}