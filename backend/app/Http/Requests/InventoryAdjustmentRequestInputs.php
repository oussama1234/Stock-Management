<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class InventoryAdjustmentRequestInputs extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'product_id' => 'required|integer|exists:products,id',
            'new_quantity' => 'required|integer|min:0',
            'reason' => 'required|string|in:damage,lost,correction,initial,audit,other',
        ];
    }

    public function sanitized(): array
    {
        $v = $this->validated();
        return [
            'product_id' => (int) $v['product_id'],
            'new_quantity' => (int) $v['new_quantity'],
            'reason' => (string) $v['reason'],
        ];
    }
}