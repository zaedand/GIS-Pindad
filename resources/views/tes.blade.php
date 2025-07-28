<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Phone Monitoring System</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</head>
<body class="bg-gradient-to-br from-indigo-50 via-white to-purple-50 min-h-screen">
    <!-- Header -->
    <div class="bg-white/95 backdrop-blur-md shadow-lg border-b border-white/30 mb-8">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <h2 class="font-bold text-xl text-gray-800 leading-tight">
                Phone Monitoring System - Dashboard
            </h2>
        </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Statistics Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div class="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/30">
                <div class="flex items-center">
                    <div class="p-3 rounded-full bg-blue-100 text-blue-600">
                        <i class="fas fa-phone text-xl"></i>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-gray-600">Total Telepon</p>
                        <p class="text-2xl font-semibold text-gray-900" id="total-phones">0</p>
                    </div>
                </div>
            </div>

            <div class="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/30">
                <div class="flex items-center">
                    <div class="p-3 rounded-full bg-green-100 text-green-600">
                        <i class="fas fa-check-circle text-xl"></i>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-gray-600">Online</p>
                        <p class="text-2xl font-semibold text-green-600" id="online-phones">0</p>
                    </div>
                </div>
            </div>

            <div class="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/30">
                <div class="flex items-center">
                    <div class="p-3 rounded-full bg-red-100 text-red-600">
                        <i class="fas fa-exclamation-triangle text-xl"></i>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-gray-600">Offline</p>
                        <p class="text-2xl font-semibold text-red-600" id="offline-phones">0</p>
                    </div>
                </div>
            </div>

            <div class="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/30">
                <div class="flex items-center">
                    <div class="p-3 rounded-full bg-yellow-100 text-yellow-600">
                        <i class="fas fa-clock text-xl"></i>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-gray-600">In Use</p>
                        <p class="text-2xl font-semibold text-yellow-600" id="in-use-phones">0</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Phone Status Grid -->
        <div class="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/30 mb-8">
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <h3 class="text-xl font-bold text-gray-800 flex items-center gap-3">
                    <i class="fas fa-network-wired text-indigo-500"></i>
                    Status Telepon
                </h3>

                <div class="flex items-center gap-4">
                    <!-- Filter Buttons -->
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
                    </div>

                    <div class="flex items-center gap-2 text-sm text-gray-600">
                        <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        Live Update
                    </div>
                </div>
            </div>

            <!-- Filter Info -->
            <div class="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200" id="filter-info">
                <div class="flex items-center gap-2 text-sm">
                    <i class="fas fa-info-circle text-blue-500"></i>
                    <span class="text-blue-700 font-medium">Menampilkan: <span id="filter-status">Semua telepon</span></span>
                    <span class="text-blue-600">(<span id="filterPhones">0</span> dari <span id="total-phones-filter">0</span> telepon)</span>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" id="phone-grid">
                <!-- Phone cards will be generated here -->
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

        <!-- Search Container - This will be populated by JavaScript -->
        <div id="search-container"></div>

        <!-- Activity Log -->
        <div class="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/30 mb-8">
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <h3 class="text-xl font-bold text-gray-800 flex items-center gap-3">
                    <i class="fas fa-history text-indigo-500"></i>
                    Log Aktivitas
                </h3>

                <!-- Activity Filter -->
                <div class="flex items-center gap-2">
                    <select id="activity-filter" onchange="filterActivities()" class="px-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white">
                        <option value="all">Semua Aktivitas</option>
                        <option value="offline">Hanya Offline</option>
                        <option value="online">Hanya Online</option>
                    </select>
                </div>
            </div>

            <!-- Activity Results Info -->
            <div class="mb-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                <span id="search-results-count">Loading activity logs...</span>
            </div>

            <div class="space-y-3 max-h-96 overflow-y-auto" id="activity-log">
                <!-- Activity items will be generated here -->
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-spinner fa-spin text-2xl mb-3"></i>
                    <p>Loading activity logs...</p>
                </div>
            </div>
        </div>

        <!-- Offline Devices Quick Access -->
        <div class="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/30 mb-8">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <i class="fas fa-exclamation-circle text-red-500"></i>
                    Perangkat Offline Saat Ini
                </h3>
                <button onclick="refreshOfflineDevices()" class="text-gray-600 hover:text-gray-800 p-2">
                    <i class="fas fa-refresh"></i>
                </button>
            </div>
            
            <div id="offline-devices-list" class="space-y-2">
                <!-- Will be populated by JavaScript -->
                <div class="text-center py-4 text-gray-500">
                    <i class="fas fa-spinner fa-spin"></i>
                    <span class="ml-2">Memuat perangkat offline...</span>
                </div>
            </div>
        </div>
    </div>

    <!-- Scripts -->
    <script type="module">
        // Import and initialize the logs.js functionality
        // This would be replaced with your actual module import
        console.log('Phone Monitoring System initialized');
        
        // Placeholder functions until the actual module is loaded
        window.filterPhones = function(status) {
            console.log('Filter phones:', status);
        };
        
        window.filterActivities = function() {
            console.log('Filter activities');
        };
        
        window.showEndpointHistory = function(endpoint) {
            console.log('Show history for:', endpoint);
        };
        
        window.refreshOfflineDevices = async function() {
            const container = document.getElementById('offline-devices-list');
            container.innerHTML = '<div class="text-center py-4 text-gray-500"><i class="fas fa-spinner fa-spin"></i><span class="ml-2">Memuat perangkat offline...</span></div>';
            
            try {
                const response = await fetch('/api/offline-devices');
                const data = await response.json();
                
                if (data.devices && data.devices.length > 0) {
                    container.innerHTML = data.devices.map(device => `
                        <div class="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div class="flex items-center gap-3">
                                <div class="w-3 h-3 bg-red-500 rounded-full"></div>
                                <span class="font-medium text-gray-800">${device.name}</span>
                                <span class="text-sm text-gray-600">(${device.endpoint})</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="text-xs text-red-600 bg-red-100 px-2 py-1 rounded-full">
                                    ${device.offline_duration || 'Unknown'}
                                </span>
                                <button onclick="showEndpointHistory('${device.endpoint}')" 
                                        class="text-blue-600 hover:text-blue-800 text-sm">
                                    <i class="fas fa-history"></i>
                                </button>
                            </div>
                        </div>
                    `).join('');
                } else {
                    container.innerHTML = '<div class="text-center py-4 text-green-600"><i class="fas fa-check-circle"></i><span class="ml-2">Semua perangkat online!</span></div>';
                }
            } catch (error) {
                console.error('Error refreshing offline devices:', error);
                container.innerHTML = '<div class="text-center py-4 text-red-500"><i class="fas fa-exclamation-triangle"></i><span class="ml-2">Error memuat data perangkat</span></div>';
            }
        };
        
        // Initialize offline devices on load
        window.refreshOfflineDevices();
        
        // Auto-refresh every 30 seconds
        setInterval(window.refreshOfflineDevices, 30000);
    </script>
    
    <script src="{{ asset('js/tes.js') }}"></script>
    <!-- Load your actual logs.js module here -->
    <!-- <script type="module" src="/resources/js/logs.js"></script> -->
</body>
</html>

    <!-- Include your full DeviceHistoryTracker & HistoryUI script here -->

