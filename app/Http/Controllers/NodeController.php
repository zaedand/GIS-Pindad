<?php

namespace App\Http\Controllers;

use App\Models\Node;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class NodeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $nodes = Node::active()->get()->map(function ($node) {
            return [
                'id' => $node->id,
                'name' => $node->name,
                'ip' => $node->ip_address,
                'status' => $node->status,
                'coords' => $node->coords,
                'lastPing' => $node->formatted_last_ping,
                'uptime' => $node->formatted_uptime,
                'responseTime' => $node->formatted_response_time,
                'description' => $node->description,
                'last_ping_raw' => $node->last_ping,
                'uptime_percentage' => $node->uptime_percentage,
                'response_time_raw' => $node->response_time
            ];
        });

        return response()->json($nodes);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'ip' => 'required|ip|unique:nodes,ip_address',
            'status' => 'required|in:online,offline,partial',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'description' => 'nullable|string'
        ]);

        $node = Node::create([
            'name' => $validated['name'],
            'ip_address' => $validated['ip'],
            'status' => $validated['status'],
            'latitude' => $validated['latitude'],
            'longitude' => $validated['longitude'],
            'description' => $validated['description'] ?? null,
            'uptime_percentage' => $validated['status'] === 'online' ? 99.9 : 85.2,
            'response_time' => $validated['status'] === 'online' ? rand(20, 50) : null,
            'last_ping' => $validated['status'] === 'online' ? now() : null
        ]);

        return response()->json([
            'id' => $node->id,
            'name' => $node->name,
            'ip' => $node->ip_address,
            'status' => $node->status,
            'coords' => $node->coords,
            'lastPing' => $node->formatted_last_ping,
            'uptime' => $node->formatted_uptime,
            'responseTime' => $node->formatted_response_time,
            'description' => $node->description
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Node $node)
    {
        return response()->json([
            'id' => $node->id,
            'name' => $node->name,
            'ip' => $node->ip_address,
            'status' => $node->status,
            'coords' => $node->coords,
            'lastPing' => $node->formatted_last_ping,
            'uptime' => $node->formatted_uptime,
            'responseTime' => $node->formatted_response_time,
            'description' => $node->description,
            'last_ping_raw' => $node->last_ping,
            'uptime_percentage' => $node->uptime_percentage,
            'response_time_raw' => $node->response_time
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Node $node)
{
    $validated = $request->validate([
        'name' => 'required|string|max:255',
        'ip' => ['required', 'ip', Rule::unique('nodes', 'ip_address')->ignore($node->id)],
        'status' => 'required|in:online,offline,partial',
        'latitude' => 'required|numeric|between:-90,90',
        'longitude' => 'required|numeric|between:-180,180',
        'description' => 'nullable|string'
    ]);

    $node->update([
        'name' => $validated['name'],
        'ip_address' => $validated['ip'],
        'status' => $validated['status'],
        'latitude' => $validated['latitude'],
        'longitude' => $validated['longitude'],
        'description' => $validated['description'] ?? null,
    ]);

    // ✅ Tambahkan ini
    $node = $node->fresh();

    return response()->json([
        'id' => $node->id,
        'name' => $node->name,
        'ip' => $node->ip_address,
        'status' => $node->status,
        'coords' => $node->coords,
        'lastPing' => $node->formatted_last_ping,
        'uptime' => $node->formatted_uptime,
        'responseTime' => $node->formatted_response_time,
        'description' => $node->description
    ]);
}


    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Node $node)
    {
        $node->delete();
        return response()->json(['message' => 'Node deleted successfully']);
    }

    /**
     * Update node status (for monitoring)
     */
    public function updateStatus(Request $request, Node $node)
    {
        $validated = $request->validate([
            'status' => 'required|in:online,offline,partial',
            'response_time' => 'nullable|integer|min:0'
        ]);

        $node->updatePing(
            $validated['response_time'] ?? null,
            $validated['status'] === 'online'
        );

        return response()->json([
            'id' => $node->id,
            'status' => $node->status,
            'lastPing' => $node->formatted_last_ping,
            'uptime' => $node->formatted_uptime,
            'responseTime' => $node->formatted_response_time
        ]);
    }

    /**
     * Get monitoring stats
     */
    public function getStats()
    {
        $stats = [
            'total' => Node::active()->count(),
            'online' => Node::active()->byStatus('online')->count(),
            'offline' => Node::active()->byStatus('offline')->count(),
            'partial' => Node::active()->byStatus('partial')->count(),
            'average_uptime' => Node::active()->avg('uptime_percentage'),
            'average_response_time' => Node::active()->where('status', 'online')->avg('response_time')
        ];

        return response()->json($stats);
    }
}
