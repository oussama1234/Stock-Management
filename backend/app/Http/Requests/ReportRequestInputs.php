<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * ReportRequestInputs
 *
 * Validates and normalizes inputs for all /reports/* endpoints. Controllers
 * should not contain business logic — they pass sanitized inputs to services.
 */
class ReportRequestInputs extends FormRequest
{
    public function authorize(): bool
    {
        // Routes are already protected by auth:sanctum in api.php
        return true;
    }

    public function rules(): array
    {
        return [
            'date_range' => 'sometimes|string|in:last_7_days,last_14_days,last_30_days,last_60_days,last_90_days,last_6_months,last_year,custom',
            'from_date' => 'required_if:date_range,custom|date',
            'to_date' => 'required_if:date_range,custom|date|after_or_equal:from_date',

            'group_by' => 'sometimes|string|in:day,week,month',
            'product_id' => 'sometimes|integer|exists:products,id',
            'supplier_id' => 'sometimes|integer|exists:suppliers,id',
            'user_id' => 'sometimes|integer|exists:users,id',
            'category_id' => 'sometimes|integer|exists:categories,id',

            'limit' => 'sometimes|integer|min:1|max:100',
            'movement_type' => 'sometimes|string|in:in,out,all',
            'threshold' => 'sometimes|integer|min:0|max:100000',
        ];
    }

    /**
     * Normalize and expose sanitized inputs to controllers/services.
     */
    public function sanitized(): array
    {
        $data = $this->validated();

        return [
            'date_range' => $data['date_range'] ?? 'last_30_days',
            'from_date' => $data['from_date'] ?? null,
            'to_date' => $data['to_date'] ?? null,
            'group_by' => $data['group_by'] ?? 'day',

            'product_id' => $data['product_id'] ?? null,
            'supplier_id' => $data['supplier_id'] ?? null,
            'user_id' => $data['user_id'] ?? null,
            'category_id' => $data['category_id'] ?? null,

            'limit' => isset($data['limit']) ? (int) $data['limit'] : null,
            'movement_type' => $data['movement_type'] ?? 'all',
            'threshold' => isset($data['threshold']) ? (int) $data['threshold'] : 10,
        ];
    }
}