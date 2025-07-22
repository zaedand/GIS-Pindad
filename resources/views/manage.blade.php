
<x-app-layout>

    <x-slot name="header">
        <h2 class="font-bold text-xl text-gray-800 leading-tight">
            Phone Monitoring System - Selamat datang {{ Auth::user()->name }}
        </h2>
    </x-slot>

    <!-- Statistics Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div class="bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div class="flex justify-between items-center mb-4">
                        <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white">
                            <i class="fas fa-phone text-xl"></i>
                        </div>
                    </div>
                    <div class="text-4xl font-bold text-gray-800 mb-2" id="total-phones">0</div>
                    <div class="text-gray-600 text-sm uppercase tracking-wide">Total Telepon</div>
                </div>

                <div class="bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div class="flex justify-between items-center mb-4">
                        <div class="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center text-white">
                            <i class="fas fa-check-circle text-xl"></i>
                        </div>
                    </div>
                    <div class="text-4xl font-bold text-gray-800 mb-2" id="online-phones">0</div>
                    <div class="text-gray-600 text-sm uppercase tracking-wide">Online</div>
                </div>

                <div class="bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div class="flex justify-between items-center mb-4">
                        <div class="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center text-white">
                            <i class="fas fa-exclamation-triangle text-xl"></i>
                        </div>
                    </div>
                    <div class="text-4xl font-bold text-gray-800 mb-2 animate-pulse" id="offline-phones">0</div>
                    <div class="text-gray-600 text-sm uppercase tracking-wide">Offline</div>
                </div>

                <div class="bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div class="flex justify-between items-center mb-4">
                        <div class="w-12 h-12 bg-gradient-to-br from-yellow-500 to-pink-500 rounded-xl flex items-center justify-center text-white">
                            <i class="fas fa-clock text-xl"></i>
                        </div>
                    </div>
                    <div class="text-4xl font-bold text-gray-800 mb-2" id="in-use-phones">0</div>
                    <div class="text-gray-600 text-sm uppercase tracking-wide">In Use</div>
                </div>
            </div>
        <!-- Main Content -->
        <main class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">


            <!-- Grid Layout -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <!-- Map Section -->
                <div class="lg:col-span-2 bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-lg">
                    <div class="flex justify-between mb-6">
                        <h2 class="text-xl font-semibold text-gray-800 flex items-center gap-2">
                            <i class="fas fa-map-marker-alt text-indigo-500"></i>
                            Peta Gedung & Status Telepon
                        </h2>
                        <button class="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-300 hover:-translate-y-1 text-sm" onclick="openAddModal()">
                            <i class="fas fa-plus"></i>
                            Tambah Device
                        </button>
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
                            <span class="text-gray-700 font-medium">In Use</span>
                        </div>
                    </div>
                </div>

                <!-- Draw action    4 -->
                <div class="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-lg">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <i class="fas fa-list text-indigo-500"></i>
                        Tambahkan Lokasi
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


            <!-- Device Management Table -->
            <div class="bg-white rounded-xl shadow-sm p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <i class="fas fa-table text-blue-600 mr-2"></i>
                    Manajemen Device
                </h3>
                <div class="mt-4">


                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Gedung</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Endpoint</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device(koordinat)</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Keterangan</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uptime</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody id="nodes-table-body" class="bg-white divide-y divide-gray-200">
                            <!-- Table rows will be populated here -->
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    </div>

    <!-- Modal -->
    <div id="nodeModal" class="fixed inset-0 bg-black bg-opacity-50 z-50 hidden">
    <div class="flex items-center justify-center min-h-screen p-4">
        <div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div class="flex items-center justify-between mb-6">
                <h3 id="modal-title" class="text-lg font-semibold text-gray-900">Tambah Device Baru</h3>
                <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <form id="nodeForm">
                <div class="space-y-4">

                    <div>
                        <label for="nodeName" class="block text-sm font-medium text-gray-700 mb-1">Nama Gedung</label>
                        <input type="text" id="nodeName" name="name" required
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    </div>

                    <div>
                        <label for="nodeIP" class="block text-sm font-medium text-gray-700 mb-1">IP Address</label>
                        <input type="text" id="nodeIP" name="ip" required pattern="^(\d{1,3}\.){3}\d{1,3}$"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    </div>

                    <div>
                        <label for="nodeEndpoint" class="block text-sm font-medium text-gray-700 mb-1">Endpoint</label>
                        <input type="text" id="nodeEndpoint" name="endpoint" required
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    </div>

                    <div>
                    <div>
                        <label for="nodeStatus" class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select id="nodeStatus" name="status_display" disabled
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600">
                            <option value="offline" selected>Offline</option>
                        </select>
                        <input type="hidden" name="status" value="offline">
                    </div>


                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label for="nodeLatitude" class="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                            <input type="number" id="nodeLatitude" name="latitude" step="any" required
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        </div>
                        <div>
                            <label for="nodeLongitude" class="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                            <input type="number" id="nodeLongitude" name="longitude" step="any" required
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        </div>
                    </div>

                    <div>
                        <label for="nodeDescription" class="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
                        <textarea id="nodeDescription" name="description" rows="3"
                                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"></textarea>
                    </div>

                </div>

                <div class="flex justify-end space-x-3 mt-6">
                    <button type="button" onclick="closeModal()"
                            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                        Batal
                    </button>
                    <button type="submit"
                            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700">
                        Simpan
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

@push('scripts')
    @vite('resources/js/maps.js')
@endpush

@push('scripts')
    @vite('resources/js/maps.js')
@endpush
</x-app-layout>
