<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Node extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'ip_address',
        'endpoint',
        'status',
        'latitude',
        'longitude',
        'last_ping',
        'uptime_percentage',
        'response_time',
        'description',
        'is_active',
    ];

    protected $casts = [
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'uptime_percentage' => 'decimal:2',
        'is_active' => 'boolean',
        'last_ping' => 'datetime',
        'response_time' => 'integer',
    ];

    /**
     * Scope for only active nodes
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to filter by status
     */
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Get coordinate array
     */
    public function getCoordsAttribute()
    {
        return [$this->latitude, $this->longitude];
    }

    /**
     * Human-readable ping time
     */
    public function getFormattedLastPingAttribute()
    {
        if (!$this->last_ping) return 'Never';

        $diff = Carbon::now()->diffInSeconds($this->last_ping);

        if ($diff < 60) return $diff . 's ago';
        if ($diff < 3600) return floor($diff / 60) . 'm ago';
        if ($diff < 86400) return floor($diff / 3600) . 'h ago';

        return floor($diff / 86400) . 'd ago';
    }

    /**
     * Human-readable response time
     */
    public function getFormattedResponseTimeAttribute()
    {
        if (!$this->response_time) return 'N/A';
        if ($this->status === 'offline') return 'Timeout';

        return $this->response_time . 'ms';
    }

    /**
     * Human-readable uptime
     */
    public function getFormattedUptimeAttribute()
    {
        return $this->uptime_percentage . '%';
    }

    /**
     * Update ping information (for status check)
     */
    public function updatePing($responseTime, $success = true)
    {
        $this->last_ping = now();
        $this->response_time = $responseTime;
        $this->status = $success ? 'online' : 'offline';

        // Basic uptime tracking (dummy algorithm)
        if ($success) {
            $this->uptime_percentage = min(100, $this->uptime_percentage + 0.1);
        } else {
            $this->uptime_percentage = max(0, $this->uptime_percentage - 0.5);
        }

        $this->save();
    }
}
