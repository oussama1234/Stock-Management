<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class InventoryHistoryRequestInputs extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'date_range' => 'sometimes|string|in:last_7_days,last_14_days,last_30_days,last_60_days,last_90_days,last_6_months,last_year,custom',
            'from_date' => 'required_if:date_range,custom|date',
            'to_date' => 'required_if:date_range,custom|date|after_or_equal:from_date',
            'page' => 'sometimes|integer|min:1',
            'per_page' => 'sometimes|integer|min:1|max:200',
            'product_id' => 'sometimes|integer|exists:products,id',
            'type' => 'sometimes|string|in:in,out',
            'reason' => 'sometimes|string|in:damage,lost,correction,initial,audit,other',
            'user_id' => 'sometimes|integer|exists:users,id',
            'sort_order' => 'sometimes|string|in:asc,desc',
            'format' => 'sometimes|string|in:csv,pdf',
        ];
    }

    public function sanitized(): array
    {
        $v = $this->validated();
        return [
            'date_range' => $v['date_range'] ?? 'last_30_days',
            'from_date' => $v['from_date'] ?? null,
            'to_date' => $v['to_date'] ?? null,
            'page' => (int) ($v['page'] ?? 1),
            'per_page' => (int) ($v['per_page'] ?? 50),
            'product_id' => $v['product_id'] ?? null,
            'type' => $v['type'] ?? null,
            'reason' => $v['reason'] ?? null,
            'user_id' => $v['user_id'] ?? null,
            'sort_order' => $v['sort_order'] ?? 'desc',
            'format' => $v['format'] ?? 'csv',
        ];
    }
}