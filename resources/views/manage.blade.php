
<x-app-layout>

    <x-slot name="header">
        <h2 class="font-bold text-xl text-gray-800 leading-tight">
            Phone Monitoring System - Selamat datang {{ Auth::user()->name }}
        </h2>
    </x-slot>

    <!-- Stats Overview -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 mt-7 mr-2 ml-2">
        <div class="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-gray-600">Total Telepon</p>
                    <p class="text-3xl font-bold text-gray-900" id="total-phones">0</p>
                </div>
                <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <i class="fas fa-phone text-white"></i>
                </div>
            </div>
        </div>

        <div class="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-gray-600">Online</p>
                    <p class="text-3xl font-bold text-green-600" id="online-phones">0</p>
                </div>
                <div class="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                    <i class="fas fa-check-circle text-white"></i>
                </div>
            </div>
        </div>

        <div class="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-gray-600">Offline</p>
                    <p class="text-3xl font-bold text-red-600 animate-blink " id="offline-phones">0</p>
                </div>
                <div class="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center">
                    <i class="fas fa-exclamation-triangle text-white"></i>
                </div>
            </div>
        </div>

        <div class="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-gray-600">In Use</p>
                    <p class="text-3xl font-bold text-yellow-600" id="in-use-phones">0</p>
                </div>
                <div class="w-12 h-12 bg-gradient-to-br from-yellow-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <i class="fas fa-clock text-white"></i>
                </div>
            </div>
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

                <div class="mb-4 flex items-center gap-2">
                    <input type="text" id="deviceSearch" placeholder="Cari perangkat..."
                        class="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                    <button onclick="filterDevices()"
                            class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
                        Search
                    </button>
                </div>

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
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Update</th>
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
<script>
    function filterDevices() {
        const input = document.getElementById("deviceSearch");
        const filter = input.value.toLowerCase();
        const tableBody = document.getElementById("nodes-table-body");
        const rows = tableBody.getElementsByTagName("tr");

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(filter) ? "" : "none";
        }
    }
</script>
<script>
    @auth
        window.userToken = @json(auth()->user()->createToken('map-token')->plainTextToken);
    @else
        window.userToken = null;
        window.location.href = '/login';
    @endauth
</script>
<script>
    window.userToken = "{{ $apiKey }}";
</script>
@push('scripts')
    @vite('resources/js/maps.js')
@endpush

</x-app-layout>
