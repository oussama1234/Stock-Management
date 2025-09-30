<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCategoryRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Authorization handled elsewhere
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $id = (int) ($this->route('id') ?? $this->route('category')?->id ?? 0);
        return [
            'name' => ['sometimes','required','string','max:150','unique:categories,name,'.$id],
            'description' => ['nullable','string','max:2000'],
        ];
    }
}
