<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class DeviceHistory extends Model
{
    use HasFactory;

    protected $table = 'device_history'; // Sesuaikan dengan nama tabel Anda

    protected $fillable = [
        'endpoint',
        'node_name',
        'previous_status',
        'current_status',
        'timestamp',
        'description',
        'duration'
    ];

    protected $casts = [
        'timestamp' => 'datetime',
        'duration' => 'integer'
    ];

    protected $dates = [
        'timestamp',
        'created_at',
        'updated_at'
    ];

    // Scopes
    public function scopeOffline($query)
    {
        return $query->where('current_status', 'offline');
    }

    public function scopeOnline($query)
    {
        return $query->where('current_status', 'online');
    }

    public function scopeForEndpoint($query, $endpoint)
    {
        return $query->where('endpoint', $endpoint);
    }

    public function scopeRecent($query, $limit = 50)
    {
        return $query->orderBy('timestamp', 'desc')
                    ->orderBy('created_at', 'desc')
                    ->limit($limit);
    }

    // Accessors
    public function getFormattedTimestampAttribute()
    {
        return $this->timestamp ? $this->timestamp->format('Y-m-d H:i:s') : null;
    }

    public function getFormattedDurationAttribute()
    {
        if (!$this->duration) return null;
        
        $minutes = $this->duration;
        if ($minutes < 60) return $minutes . ' menit';
        
        $hours = floor($minutes / 60);
        $remainingMinutes = $minutes % 60;
        
        if ($hours < 24) {
            return $remainingMinutes > 0 ? 
                "{$hours} jam {$remainingMinutes} menit" : 
                "{$hours} jam";
        }
        
        $days = floor($hours / 24);
        $remainingHours = $hours % 24;
        
        return $remainingHours > 0 ? 
            "{$days} hari {$remainingHours} jam" : 
            "{$days} hari";
    }
}