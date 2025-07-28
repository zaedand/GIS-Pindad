<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class RiwayatOff extends Model
{
    use HasFactory;

    protected $table = 'riwayat_off';

    protected $fillable = [
        'endpoint',
        'jam_off',
        'jam_on'
    ];

    protected $casts = [
        'jam_off' => 'datetime',
        'jam_on' => 'datetime'
    ];

    /**
     * Get duration in minutes between jam_off and jam_on
     */
    public function getDurationAttribute()
    {
        if (!$this->jam_on) {
            return null; // Still offline
        }

        return $this->jam_off->diffInMinutes($this->jam_on);
    }

    /**
     * Get formatted duration
     */
    public function getFormattedDurationAttribute()
    {
        $duration = $this->duration;
        if (!$duration) {
            return 'Masih offline';
        }

        if ($duration < 60) {
            return $duration . ' menit';
        }

        $hours = floor($duration / 60);
        $minutes = $duration % 60;

        if ($hours < 24) {
            return $minutes > 0 ? "{$hours}j {$minutes}m" : "{$hours} jam";
        }

        $days = floor($hours / 24);
        $remainingHours = $hours % 24;
        return $remainingHours > 0 ? "{$days}h {$remainingHours}j" : "{$days} hari";
    }

    /**
     * Scope to get records with null jam_on (still offline)
     */
    public function scopeStillOffline($query)
    {
        return $query->whereNull('jam_on');
    }

    /**
     * Scope to get records for specific endpoint
     */
    public function scopeForEndpoint($query, $endpoint)
    {
        return $query->where('endpoint', $endpoint);
    }

    /**
     * Get the latest offline record for an endpoint that hasn't come back online
     */
    public static function getLatestOfflineRecord($endpoint)
    {
        return self::where('endpoint', $endpoint)
                   ->whereNull('jam_on')
                   ->latest('jam_off')
                   ->first();
    }
}