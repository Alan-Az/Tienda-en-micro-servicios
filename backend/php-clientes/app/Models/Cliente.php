<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Tymon\JWTAuth\Contracts\JWTSubject;

class Cliente extends Authenticatable implements JWTSubject
{
    use HasFactory;

    protected $table = 'clientes';

    protected $fillable = [
        'nombre',
        'email',
        'password',
        'puntos_lealtad',
    ];

    protected $hidden = [
        'password',
    ];

    protected $casts = [
        'puntos_lealtad' => 'integer',
    ];

    /**
     * Get the identifier that will be stored in the subject claim of the JWT.
     */
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    /**
     * Return a key value array, containing any custom claims to be added to the JWT.
     */
    public function getJWTCustomClaims(): array
    {
        return [
            'nombre' => $this->nombre,
            'email' => $this->email,
            'puntos_lealtad' => $this->puntos_lealtad,
        ];
    }
}
