
<x-app-layout>
    <x-slot name="header">
            <h2 class="font-semibold text-xl text-gray-800 leading-tight">
                {{ __('') }}
            Phone Monitoring System - Selamat datang {{ Auth::user()->name }}
        </h2>
    </x-slot>

    <div class="py-8">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            <!-- Statistics Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div class="bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div class="flex justify-between items-center mb-4">
                        <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white">
                            <i class="fas fa-phone text-xl"></i>
                        </div>
                    </div>
                    <div class="text-4xl font-bold text-gray-800 mb-2" id="total-phones">{{ $totalPhones ?? 24 }}</div>
                    <div class="text-gray-600 text-sm uppercase tracking-wide">Total Telepon</div>
                </div>

                <div class="bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div class="flex justify-between items-center mb-4">
                        <div class="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center text-white">
                            <i class="fas fa-check-circle text-xl"></i>
                        </div>
                    </div>
                    <div class="text-4xl font-bold text-gray-800 mb-2" id="online-phones">{{ $onlinePhones ?? 21 }}</div>
                    <div class="text-gray-600 text-sm uppercase tracking-wide">Online</div>
                </div>

                <div class="bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div class="flex justify-between items-center mb-4">
                        <div class="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center text-white">
                            <i class="fas fa-exclamation-triangle text-xl"></i>
                        </div>
                    </div>
                    <div class="text-4xl font-bold text-gray-800 mb-2 animate-pulse" id="offline-phones">{{ $offlinePhones ?? 3 }}</div>
                    <div class="text-gray-600 text-sm uppercase tracking-wide">Offline</div>
                </div>

                <div class="bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div class="flex justify-between items-center mb-4">
                        <div class="w-12 h-12 bg-gradient-to-br from-yellow-500 to-pink-500 rounded-xl flex items-center justify-center text-white">
                            <i class="fas fa-clock text-xl"></i>
                        </div>
                    </div>
                    <div class="text-4xl font-bold text-gray-800 mb-2" id="avg-response">{{ $avgResponse ?? '45ms' }}</div>
                    <div class="text-gray-600 text-sm uppercase tracking-wide">Avg Response</div>
                </div>
            </div>

            <!-- Main Content -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                <!-- Map Section -->
                <div class="lg:col-span-2 bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-lg">
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="text-xl font-semibold text-gray-800 flex items-center gap-2">
                            <i class="fas fa-map-marker-alt text-indigo-500"></i>
                            Peta Gedung & Status Telepon
                        </h2>
                        <button onclick="refreshMap()" class="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-300 hover:-translate-y-1 text-sm">
                            <i class="fas fa-sync-alt mr-2"></i>
                            Refresh
                        </button>
                    </div>

                    <div id="map" class="h-96 rounded-xl overflow-hidden shadow-inner"></div>

                    <div class="flex flex-wrap gap-4 mt-4 text-sm">
                        <div class="flex items-center gap-2">
                            <div class="w-3 h-3 bg-green-500 rounded-full shadow-lg"></div>
                            <span class="text-gray-700 font-medium">Online</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <div class="w-3 h-3 bg-red-500 rounded-full shadow-lg"></div>
                            <span class="text-gray-700 font-medium">Offline</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <div class="w-3 h-3 bg-yellow-500 rounded-full shadow-lg"></div>
                            <span class="text-gray-700 font-medium">Partial</span>
                        </div>
                    </div>
                </div>

                <!-- Phone Status List -->
                <div class="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-lg">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <i class="fas fa-list text-indigo-500"></i>
                        Status Real-time
                    </h3>

                    <div class="space-y-2 max-h-96 overflow-y-auto" id="phone-status-list">
                        <!-- Phone status items will be populated here -->
                        <div class="flex items-center gap-4 p-3 rounded-xl hover:bg-indigo-50 transition-all duration-300 cursor-pointer">
                            <div class="w-3 h-3 bg-green-500 rounded-full shadow-lg animate-pulse"></div>
                            <div class="flex-1">
                                <div class="font-semibold text-gray-800">Gedung A</div>
                                <div class="text-sm text-gray-600">192.168.1.101</div>
                                <div class="text-xs text-gray-500">Last ping: 2s ago</div>
                            </div>
                            <div class="text-right text-xs text-gray-500">
                                <div class="font-medium">42ms</div>
                                <div>99.8%</div>
                            </div>
                        </div>

                        <div class="flex items-center gap-4 p-3 rounded-xl hover:bg-indigo-50 transition-all duration-300 cursor-pointer">
                            <div class="w-3 h-3 bg-red-500 rounded-full shadow-lg animate-blink"></div>
                            <div class="flex-1">
                                <div class="font-semibold text-gray-800">Gedung B</div>
                                <div class="text-sm text-gray-600">192.168.1.102</div>
                                <div class="text-xs text-gray-500">Last ping: 5m ago</div>
                            </div>
                            <div class="text-right text-xs text-gray-500">
                                <div class="font-medium text-red-500">Timeout</div>
                                <div>85.2%</div>
                            </div>
                        </div>

                        <div class="flex items-center gap-4 p-3 rounded-xl hover:bg-indigo-50 transition-all duration-300 cursor-pointer">
                            <div class="w-3 h-3 bg-green-500 rounded-full shadow-lg animate-pulse"></div>
                            <div class="flex-1">
                                <div class="font-semibold text-gray-800">Gedung C</div>
                                <div class="text-sm text-gray-600">192.168.1.103</div>
                                <div class="text-xs text-gray-500">Last ping: 1s ago</div>
                            </div>
                            <div class="text-right text-xs text-gray-500">
                                <div class="font-medium">38ms</div>
                                <div>99.9%</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Activity Log -->
            <div class="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-lg">
                <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <i class="fas fa-history text-indigo-500"></i>
                    Log Aktivitas Terbaru
                </h3>

                <div class="space-y-4" id="activity-log">
                    <div class="flex gap-4 p-4 border-b border-gray-100 last:border-b-0">
                        <div class="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white flex-shrink-0">
                            <i class="fas fa-exclamation-triangle text-sm"></i>
                        </div>
                        <div class="flex-1">
                            <div class="font-semibold text-gray-800">Gedung B Offline</div>
                            <div class="text-sm text-gray-600 mt-1">Telepon gedung B tidak merespons ping.</div>
                            <div class="text-xs text-gray-500 mt-1">{{ now()->diffForHumans() }}</div>
                        </div>
                    </div>

                    <div class="flex gap-4 p-4 border-b border-gray-100 last:border-b-0">
                        <div class="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white flex-shrink-0">
                            <i class="fas fa-check-circle text-sm"></i>
                        </div>
                        <div class="flex-1">
                            <div class="font-semibold text-gray-800">Sistem Monitoring Aktif</div>
                            <div class="text-sm text-gray-600 mt-1">Monitoring telepon berjalan normal.</div>
                            <div class="text-xs text-gray-500 mt-1">{{ now()->subMinutes(5)->diffForHumans() }}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    @push('scripts')
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.css"/>

    <script>
        document.addEventListener('DOMContentLoaded', function () {
            // Initialize map
            // Initialize map
            var map = L.map('map').setView([-8.173358, 112.684885], 17);

            // Tile Layer
            L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}&key=YOUR_API_KEY', {
                maxZoom: 20,
                attribution: 'Map data © Google'
            }).addTo(map);


            // Phone nodes data
            const nodes = [
                {
                    name: 'Gedung A',
                    coords: [-8.173500, 112.684700],
                    status: 'online',
                    ip: '192.168.1.101',
                    lastPing: '2s ago',
                    uptime: '99.8%'
                },
                {
                    name: 'Gedung B',
                    coords: [-8.173100, 112.684200],
                    status: 'offline',
                    ip: '192.168.1.102',
                    lastPing: '5m ago',
                    uptime: '85.2%'
                },
                {
                    name: 'Gedung C',
                    coords: [-8.172800, 112.685000],
                    status: 'online',
                    ip: '192.168.1.103',
                    lastPing: '1s ago',
                    uptime: '99.9%'
                },
            ];

            // Add markers to map
            nodes.forEach(function(node) {
                const color = node.status === 'online' ? '#10b981' : '#ef4444';
                const pulseClass = node.status === 'online' ? 'animate-pulse' : 'animate-blink';

                const marker = L.circleMarker(node.coords, {
                    radius: 12,
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.8,
                    weight: 3
                }).addTo(map);

                const popupContent = `
                    <div class="font-sans p-2">
                        <h4 class="text-lg font-semibold text-gray-800 mb-2">${node.name}</h4>
                        <div class="space-y-1 text-sm">
                            <div class="flex justify-between">
                                <span>Status:</span>
                                <span class="font-medium ${node.status === 'online' ? 'text-green-600' : 'text-red-600'}">${node.status}</span>
                            </div>
                            <div class="flex justify-between">
                                <span>IP:</span>
                                <span class="font-mono">${node.ip}</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Last Ping:</span>
                                <span>${node.lastPing}</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Uptime:</span>
                                <span class="font-medium">${node.uptime}</span>
                            </div>
                        </div>
                    </div>
                `;

                marker.bindPopup(popupContent);
            });

            // Drawing controls
            var drawnItems = new L.FeatureGroup();
            map.addLayer(drawnItems);

            var drawControl = new L.Control.Draw({
                edit: {
                    featureGroup: drawnItems
                },
                draw: {
                    polygon: true,
                    polyline: true,
                    rectangle: true,
                    circle: false,
                    marker: true
                }
            });
            map.addControl(drawControl);

            map.on('draw:created', function (e) {
                var layer = e.layer;
                drawnItems.addLayer(layer);

                var geojson = layer.toGeoJSON();
                console.log('GeoJSON hasil gambar:', JSON.stringify(geojson));
            });

            // Auto refresh functionality
            function refreshMap() {
                location.reload();
            }

            // Make refresh function global
            window.refreshMap = refreshMap;

            // Auto update every 30 seconds
            setInterval(function() {
                // Update timestamps and status
                updatePhoneStatus();
            }, 30000);

            function updatePhoneStatus() {
                // This would typically make an AJAX call to get real-time data
                console.log('Updating phone status...');
            }
        });
    </script>
    @endpush
</x-app-layout>
