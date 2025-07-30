<x-app-layout>
    <x-slot name="header">
        <h2 class="font-bold text-xl text-gray-800 leading-tight">
            Phone Monitoring System - Selamat datang {{ Auth::user()->name }}
        </h2>
    </x-slot>

    <!-- Phone Status Grid -->
    <div class="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/30 mb-8">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <h3 class="text-xl font-bold text-gray-800 flex items-center gap-3">
                <i class="fas fa-network-wired text-indigo-500"></i>
                Status Telepon
            </h3>

            <div class="flex items-center gap-4">
                <!-- Enhanced Filter Buttons -->
                <div class="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
                    <button onclick="filterPhones('all')" id="filter-all" class="filter-btn px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 bg-indigo-500 text-white shadow-md">
                        <i class="fas fa-list mr-2"></i>Semua
                    </button>
                    <button onclick="filterPhones('online')" id="filter-online" class="filter-btn px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 text-gray-600 hover:bg-green-100 hover:text-green-700">
                        <i class="fas fa-check-circle mr-2"></i>Online
                    </button>
                    <button onclick="filterPhones('offline')" id="filter-offline" class="filter-btn px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 text-gray-600 hover:bg-red-100 hover:text-red-700">
                        <i class="fas fa-exclamation-triangle mr-2"></i>Offline
                    </button>
                    <button onclick="filterPhones('partial')" id="filter-partial" class="filter-btn px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 text-gray-600 hover:bg-yellow-100 hover:text-yellow-700">
                        <i class="fas fa-users mr-2"></i>In Use
                    </button>
                </div>

                <div class="flex items-center gap-2 text-sm text-gray-600">
                    <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    Live Update
                </div>
            </div>
        </div>

        <!-- Enhanced Filter Info -->
        <div class="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200" id="filter-info">
            <div class="flex items-center gap-2 text-sm">
                <i class="fas fa-info-circle text-blue-500"></i>
                <span class="text-blue-700 font-medium">Menampilkan: <span id="filter-status">Semua telepon</span></span>
                <span class="text-blue-600">(<span id="filterPhones">0</span> dari <span id="total-phones-filter">0</span> telepon)</span>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" id="phone-grid">
            <!-- Phone cards will be generated here by JavaScript -->
        </div>

        <!-- No Results Message -->
        <div id="no-results" class="hidden text-center py-12">
            <div class="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-search text-gray-400 text-2xl"></i>
            </div>
            <h4 class="text-lg font-semibold text-gray-600 mb-2">Tidak ada telepon ditemukan</h4>
            <p class="text-gray-500">Tidak ada telepon dengan status yang dipilih.</p>
        </div>
    </div>

    <!-- Enhanced Search Container - This will be populated by JavaScript -->
    <div id="search-container">
        <!-- JavaScript will populate this with advanced search functionality -->
    </div>

    <!-- Activity Log -->
    <div class="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/30">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <h3 class="text-xl font-bold text-gray-800 flex items-center gap-3">
                <i class="fas fa-history text-indigo-500"></i>
                Log Aktivitas
            </h3>

            <!-- Enhanced Activity Filter -->
            <div class="flex items-center gap-3">
                <select id="activity-filter" onchange="filterActivities()" class="px-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white">
                    <option value="all">Semua Aktivitas</option>
                    <option value="offline">Hanya Offline</option>
                    <option value="online">Hanya Online</option>
                    <option value="partial">Hanya In Use</option>
                </select>
            </div>
        </div>

        <!-- Activity Log Container -->
        <div class="space-y-3" id="activity-log">
            <!-- Activity items will be generated here by JavaScript -->
            <div class="text-center text-gray-500 text-sm p-8">
                <i class="fas fa-spinner fa-spin text-3xl mb-3"></i>
                <p>Memuat log aktivitas...</p>
            </div>
            
        </div>

        <!-- Pagination Controls Container - Will be populated by JavaScript -->
        <div id="pagination-controls" class="mt-6">
            <!-- JavaScript will populate this with pagination controls -->
        </div>
    </div>

@push('scripts')
    @vite('resources/js/logs.js')
@endpush
</x-app-layout>