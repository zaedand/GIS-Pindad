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
        'is_active'
    ];

    protected $casts = [
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'uptime_percentage' => 'decimal:2',
        'is_active' => 'boolean',
        'last_ping' => 'datetime',
        'response_time' => 'integer'
    ];

    /**
     * Get the formatted last ping time
     */
    public function getFormattedLastPingAttribute()
    {
        if (!$this->last_ping) {
            return 'Never';
        }

        $diff = Carbon::now()->diffInSeconds($this->last_ping);

        if ($diff < 60) {
            return $diff . 's ago';
        } elseif ($diff < 3600) {
            return floor($diff / 60) . 'm ago';
        } elseif ($diff < 86400) {
            return floor($diff / 3600) . 'h ago';
        } else {
            return floor($diff / 86400) . 'd ago';
        }
    }

    /**
     * Get the coordinates as array
     */
    public function getCoordsAttribute()
    {
        return [$this->latitude, $this->longitude];
    }

    /**
     * Get the response time formatted
     */
    public function getFormattedResponseTimeAttribute()
    {
        if (!$this->response_time) {
            return 'N/A';
        }

        if ($this->status === 'offline') {
            return 'Timeout';
        }

        return $this->response_time . 'ms';
    }

    /**
     * Get the uptime formatted
     */
    public function getFormattedUptimeAttribute()
    {
        return $this->uptime_percentage . '%';
    }

    /**
     * Update node ping status
     */
    public function updatePing($responseTime, $success = true)
    {
        $this->last_ping = now();
        $this->response_time = $responseTime;
        $this->status = $success ? 'online' : 'offline';

        // Update uptime percentage (simplified calculation)
        if ($success) {
            $this->uptime_percentage = min(100, $this->uptime_percentage + 0.1);
        } else {
            $this->uptime_percentage = max(0, $this->uptime_percentage - 0.5);
        }

        $this->save();
    }

    /**
     * Scope for active nodes
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope for specific status
     */
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }
}
