<?php

namespace Database\Seeders;

use App\Models\Node;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class NodeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $nodes = [
            [
                'name' => 'Gedung A',
                'ip_address' => '192.168.1.101',
                'status' => 'online',
                'latitude' => -8.173358,
                'longitude' => 112.684885,
                'description' => 'Gedung Utama - Kantor Pusat',
                'uptime_percentage' => 99.8,
                'response_time' => 42,
                'last_ping' => now()->subSeconds(2),
            ],
            [
                'name' => 'Gedung B',
                'ip_address' => '192.168.1.102',
                'status' => 'offline',
                'latitude' => -8.173400,
                'longitude' => 112.684950,
                'description' => 'Gedung Annex - Ruang Rapat',
                'uptime_percentage' => 85.2,
                'response_time' => null,
                'last_ping' => now()->subMinutes(5),
            ],
            [
                'name' => 'Gedung C',
                'ip_address' => '192.168.1.103',
                'status' => 'online',
                'latitude' => -8.173320,
                'longitude' => 112.684820,
                'description' => 'Gedung Pelayanan - Customer Service',
                'uptime_percentage' => 99.9,
                'response_time' => 38,
                'last_ping' => now()->subSecond(),
            ],
            [
                'name' => 'Gedung D',
                'ip_address' => '192.168.1.104',
                'status' => 'partial',
                'latitude' => -8.173280,
                'longitude' => 112.684750,
                'description' => 'Gedung Teknik - Server Room',
                'uptime_percentage' => 92.5,
                'response_time' => 150,
                'last_ping' => now()->subMinutes(2),
            ],
            [
                'name' => 'Gedung E',
                'ip_address' => '192.168.1.105',
                'status' => 'online',
                'latitude' => -8.173450,
                'longitude' => 112.684900,
                'description' => 'Gedung Keamanan - Security Center',
                'uptime_percentage' => 98.7,
                'response_time' => 35,
                'last_ping' => now()->subSeconds(3),
            ],
        ];

        foreach ($nodes as $node) {
            Node::create($node);
        }
    }
}
