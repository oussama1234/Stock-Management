<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UserRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
 public function rules(): array
{
    return [
        'name'          => 'required|string|min:3|max:40',
        'email'         => 'required|email|string|max:255',
        'profileImage'  => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
        'avatar'        => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
        'password'      => 'nullable|string|min:6',
        'currentPassword' => 'nullable|string|min:6',
        'role'          => 'sometimes|string|in:admin,manager,user',
        'newPassword'   => 'nullable|string|min:6|confirmed',
        // Profile fields
        'phone'         => 'nullable|string|max:20',
        'bio'           => 'nullable|string|max:1000',
        'location'      => 'nullable|string|max:100',
        'website'       => 'nullable|url|max:255',
        'job_title'     => 'nullable|string|max:100',
        'two_factor_enabled' => 'nullable|boolean',
    ];
}

}
