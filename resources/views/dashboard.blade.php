
<x-app-layout>
    <x-slot name="header">
            <h2 class="font-semibold text-xl text-gray-800 leading-tight">
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

                    <div id= "device-status" class="flex flex-wrap gap-4 mt-4 text-sm">
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

    <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
<script>
    const socket = io("http://localhost:3000"); // ganti jika pakai IP LAN/VM

    socket.on("device-status", function(data) {
        console.log("Data realtime:", data);
        // TODO: update status device di halaman
    });
</script>



</x-app-layout>
