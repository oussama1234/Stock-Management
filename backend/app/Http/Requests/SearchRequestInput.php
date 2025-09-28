<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SearchRequestInput extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'q' => 'required|string|min:1|max:255',
            'page' => 'sometimes|integer|min:1',
            'per_page' => 'sometimes|integer|min:1|max:100',
            // Optional filters
            'category_id' => 'sometimes|integer|exists:categories,id',
            'status' => 'sometimes|string|in:ok,low,critical,lost,damaged',
            'from_date' => 'sometimes|date',
            'to_date' => 'sometimes|date',
        ];
    }

    public function sanitized(): array
    {
        $v = $this->validated();
        $q = trim((string) ($v['q'] ?? ''));
        $per = (int) ($v['per_page'] ?? 5);
        $page = (int) ($v['page'] ?? 1);

        return [
            'q' => $q,
            'page' => max(1, $page),
            'per_page' => max(1, min(100, $per)),
            'filters' => [
                'category_id' => $v['category_id'] ?? null,
                'status' => $v['status'] ?? null,
                'from_date' => $v['from_date'] ?? null,
                'to_date' => $v['to_date'] ?? null,
            ],
        ];
    }
}
