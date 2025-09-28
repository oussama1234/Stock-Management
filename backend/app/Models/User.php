<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;

use App\Http\Requests\UserRequest;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Request;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    //added HasApiTokens for Sanctum integration

    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'profileImage',
        // New profile fields
        'phone',
        'bio',
        'location',
        'website',
        'job_title',
        'description',
        'two_factor_enabled',
        'avatar',
        'profile_updated_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_secret', // Hide 2FA secret
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_enabled' => 'boolean',
            'profile_updated_at' => 'datetime',
        ];
    }

    // add relationship with purchases and sales
    public function purchases()
    {
        return $this->hasMany(Purchase::class);
    }

    public function sales()
    {
        return $this->hasMany(Sale::class);
    }

    public function preferences()
    {
        return $this->hasOne(Preferences::class);
    }

    /**
     * Get user preferences with default fallback
     */
    public function getPreferences()
    {
        return $this->preferences ?: Preferences::createForUser($this);
    }

    /**
     * Check if user is admin (you can customize this logic)
     */
    public function getIsAdminAttribute()
    {
        return $this->role === 'admin' || $this->role === 'super_admin';
    }

    public function uploadProfileImage(UserRequest $request)
    {
          //Handle profile image
    if ($request->hasFile('profileImage')) {
        // Optional: delete old image if exists
       $this->removeProfileImage();

        $path = $request->file('profileImage')->store('profile_images', 'public');

        return asset('storage/' . $path);
    }
    }

    public function removeProfileImage()
    {
        if ($this->profileImage) {
            $relativePath = str_replace(asset('storage') . '/', '', $this->profileImage);
            Storage::disk('public')->delete($relativePath);
        }
    }

    
    /**
     * Scope: text search by user fields
     */
    public function scopeSearch($query, string $term)
    {
        $t = '%' . str_replace('%', '\\%', $term) . '%';
        return $query->where(function ($q) use ($t) {
            $q->where('name', 'like', $t)
              ->orWhere('email', 'like', $t)
              ->orWhere('role', 'like', $t);
        });
    }
}
