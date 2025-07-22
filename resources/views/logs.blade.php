<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Phone Monitoring System</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    animation: {
                        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                        'bounce-slow': 'bounce 2s infinite'
                    }
                }
            }
        }
    </script>
</head>
<body class="bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 min-h-screen">
    <!-- Header -->
    <div class="bg-white shadow-md border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <h2 class="font-semibold text-xl text-gray-800 leading-tight flex items-center gap-3">
                <div class="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <i class="fas fa-phone text-white text-sm"></i>
                </div>
                Phone Monitoring System - Selamat datang Admin
            </h2>
        </div>
    </div>

    <div class="py-8">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <!-- Stats Overview -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div class="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Total Telepon</p>
                            <p class="text-3xl font-bold text-gray-900" id="total-phones">8</p>
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
                            <p class="text-3xl font-bold text-green-600" id="online-count">5</p>
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
                            <p class="text-3xl font-bold text-red-600" id="offline-count">3</p>
                        </div>
                        <div class="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center">
                            <i class="fas fa-exclamation-triangle text-white"></i>
                        </div>
                    </div>
                </div>

                <div class="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Uptime</p>
                            <p class="text-3xl font-bold text-blue-600">62.5%</p>
                        </div>
                        <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                            <i class="fas fa-chart-line text-white"></i>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Phone Status Grid -->
            <div class="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/30 mb-8">
                <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <h3 class="text-xl font-bold text-gray-800 flex items-center gap-3">
                        <i class="fas fa-network-wired text-indigo-500"></i>
                        Status Telepon Real-time
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
                        <span class="text-blue-600">(<span id="filtered-count">8</span> dari <span id="total-count">8</span> telepon)</span>
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

            <!-- Activity Log -->
            <div class="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/30">
                <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <h3 class="text-xl font-bold text-gray-800 flex items-center gap-3">
                        <i class="fas fa-history text-indigo-500"></i>
                        Log Aktivitas Telepon
                    </h3>
                    
                    <!-- Activity Filter -->
                    <div class="flex items-center gap-2">
                        <select id="activity-filter" onchange="filterActivities()" class="px-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white">
                            <option value="all">Semua Aktivitas</option>
                            <option value="offline">Hanya Offline</option>
                            <option value="online">Hanya Online</option>
                            <option value="maintenance">Maintenance</option>
                        </select>
                    </div>
                </div>
                
                <div class="space-y-3" id="activity-log">
                    <!-- Activity items will be generated here -->
                </div>

                <div class="mt-6 text-center">
                    <button class="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg">
                        <i class="fas fa-refresh mr-2"></i>
                        Muat Lebih Banyak
                    </button>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Sample phone data
        const phoneData = [
            { id: 1, name: 'Gedung A - Lantai 1', ip: '192.168.1.101', status: 'online', lastSeen: new Date(), downtime: 0 },
            { id: 2, name: 'Gedung A - Lantai 2', ip: '192.168.1.102', status: 'online', lastSeen: new Date(), downtime: 0 },
            { id: 3, name: 'Gedung B - Resepsionis', ip: '192.168.1.201', status: 'offline', lastSeen: new Date(Date.now() - 1800000), downtime: 30 },
            { id: 4, name: 'Gedung B - Ruang Meeting', ip: '192.168.1.202', status: 'offline', lastSeen: new Date(Date.now() - 3600000), downtime: 60 },
            { id: 5, name: 'Gedung C - Security', ip: '192.168.1.301', status: 'online', lastSeen: new Date(), downtime: 0 },
            { id: 6, name: 'Gedung C - Kantin', ip: '192.168.1.302', status: 'offline', lastSeen: new Date(Date.now() - 7200000), downtime: 120 },
            { id: 7, name: 'Gedung D - IT Support', ip: '192.168.1.401', status: 'online', lastSeen: new Date(), downtime: 0 },
            { id: 8, name: 'Gedung D - HR', ip: '192.168.1.402', status: 'online', lastSeen: new Date(), downtime: 0 }
        ];

        let currentFilter = 'all';
        let currentActivityFilter = 'all';
        let allActivities = [];

        function formatDuration(minutes) {
            if (minutes < 1) return 'Baru saja';
            if (minutes < 60) return `${minutes} menit`;
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            if (hours < 24) {
                return mins > 0 ? `${hours}j ${mins}m` : `${hours} jam`;
            }
            const days = Math.floor(hours / 24);
            const remainingHours = hours % 24;
            return remainingHours > 0 ? `${days}h ${remainingHours}j` : `${days} hari`;
        }

        function getStatusColor(status, downtime) {
            if (status === 'online') return 'green';
            if (downtime > 60) return 'red';
            if (downtime > 30) return 'orange';
            return 'yellow';
        }

        function filterPhones(status) {
            currentFilter = status;
            
            // Update filter button states
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('bg-indigo-500', 'text-white', 'shadow-md');
                btn.classList.add('text-gray-600');
            });
            
            const activeBtn = document.getElementById(`filter-${status}`);
            activeBtn.classList.add('bg-indigo-500', 'text-white', 'shadow-md');
            activeBtn.classList.remove('text-gray-600');

            // Filter and display phones
            const filteredPhones = status === 'all' ? phoneData : phoneData.filter(phone => phone.status === status);
            
            // Update filter info
            const filterStatus = {
                'all': 'Semua telepon',
                'online': 'Telepon online',
                'offline': 'Telepon offline'
            };
            
            document.getElementById('filter-status').textContent = filterStatus[status];
            document.getElementById('filtered-count').textContent = filteredPhones.length;
            document.getElementById('total-count').textContent = phoneData.length;

            // Generate phone cards
            const phoneGrid = document.getElementById('phone-grid');
            const noResults = document.getElementById('no-results');
            
            if (filteredPhones.length === 0) {
                phoneGrid.classList.add('hidden');
                noResults.classList.remove('hidden');
            } else {
                phoneGrid.classList.remove('hidden');
                noResults.classList.add('hidden');
                phoneGrid.innerHTML = filteredPhones.map(generatePhoneCard).join('');
            }

            // Update counters
            updateCounters();
        }

        function filterActivities() {
            currentActivityFilter = document.getElementById('activity-filter').value;
            const activityLog = document.getElementById('activity-log');
            
            let filteredActivities = allActivities;
            if (currentActivityFilter !== 'all') {
                filteredActivities = allActivities.filter(activity => activity.type === currentActivityFilter);
            }
            
            if (filteredActivities.length === 0) {
                activityLog.innerHTML = `
                    <div class="text-center py-8 text-gray-500">
                        <i class="fas fa-inbox text-3xl mb-3"></i>
                        <p>Tidak ada aktivitas dengan filter yang dipilih</p>
                    </div>
                `;
            } else {
                activityLog.innerHTML = filteredActivities.map(generateActivityItem).join('');
            }
        }

        function generatePhoneCard(phone) {
            const color = getStatusColor(phone.status, phone.downtime);
            const isOnline = phone.status === 'online';
            
            return `
                <div class="bg-white rounded-xl p-4 shadow-lg border-l-4 border-${color}-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <div class="flex items-start justify-between mb-3">
                        <div class="flex-1">
                            <h4 class="font-semibold text-gray-800 text-sm mb-1">${phone.name}</h4>
                            <p class="text-xs text-gray-600">${phone.ip}</p>
                        </div>
                        <div class="flex flex-col items-end gap-1">
                            <div class="flex items-center gap-2">
                                <div class="w-3 h-3 bg-${color}-500 rounded-full ${isOnline ? 'animate-pulse' : ''}"></div>
                                <span class="text-xs font-medium ${isOnline ? 'text-green-600' : 'text-red-600'} capitalize">
                                    ${phone.status}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="space-y-2">
                        <div class="flex justify-between items-center text-xs">
                            <span class="text-gray-500">Last Seen:</span>
                            <span class="text-gray-700 font-medium">${phone.lastSeen.toLocaleTimeString('id-ID')}</span>
                        </div>
                        
                        ${!isOnline ? `
                            <div class="flex justify-between items-center text-xs">
                                <span class="text-gray-500">Offline Duration:</span>
                                <span class="text-red-600 font-bold">${formatDuration(phone.downtime)}</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-1.5">
                                <div class="bg-red-500 h-1.5 rounded-full animate-pulse" style="width: ${Math.min(phone.downtime / 120 * 100, 100)}%"></div>
                            </div>
                        ` : `
                            <div class="flex justify-between items-center text-xs">
                                <span class="text-gray-500">Status:</span>
                                <span class="text-green-600 font-medium flex items-center gap-1">
                                    <i class="fas fa-check-circle"></i>
                                    Active
                                </span>
                            </div>
                        `}
                    </div>
                </div>
            `;
        }

        function generateActivityLog() {
            allActivities = [
                { type: 'offline', phone: 'Gedung C - Kantin', duration: '2 jam 15 menit', time: '14:30', severity: 'high' },
                { type: 'offline', phone: 'Gedung B - Ruang Meeting', duration: '1 jam 5 menit', time: '13:45', severity: 'medium' },
                { type: 'online', phone: 'Gedung A - Lantai 2', time: '13:20', severity: 'low' },
                { type: 'offline', phone: 'Gedung B - Resepsionis', duration: '35 menit', time: '12:55', severity: 'medium' },
                { type: 'online', phone: 'Gedung D - HR', time: '12:10', severity: 'low' },
                { type: 'maintenance', phone: 'Sistem Monitoring', time: '11:30', severity: 'info' },
                { type: 'offline', phone: 'Gedung A - Lantai 3', duration: '5 jam 20 menit', time: '10:15', severity: 'high' },
                { type: 'online', phone: 'Gedung C - Security', time: '09:45', severity: 'low' },
                { type: 'offline', phone: 'Gedung D - IT Support', duration: '45 menit', time: '09:20', severity: 'medium' },
                { type: 'maintenance', phone: 'Database Backup', time: '08:00', severity: 'info' }
            ];

            return allActivities.map(generateActivityItem).join('');
        }

        function generateActivityItem(activity) {
            let icon, bgColor, textColor, message;
            
            switch(activity.type) {
                case 'offline':
                    icon = 'fas fa-exclamation-triangle';
                    bgColor = activity.severity === 'high' ? 'from-red-500 to-pink-600' : 'from-orange-500 to-red-500';
                    textColor = 'text-red-700';
                    message = `${activity.phone} offline selama ${activity.duration}`;
                    break;
                case 'online':
                    icon = 'fas fa-check-circle';
                    bgColor = 'from-green-500 to-emerald-600';
                    textColor = 'text-green-700';
                    message = `${activity.phone} kembali online`;
                    break;
                case 'maintenance':
                    icon = 'fas fa-tools';
                    bgColor = 'from-blue-500 to-indigo-600';
                    textColor = 'text-blue-700';
                    message = `${activity.phone} menjalankan maintenance`;
                    break;
            }

            return `
                <div class="activity-item flex gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-all duration-300 hover:shadow-md" data-type="${activity.type}">
                    <div class="w-12 h-12 bg-gradient-to-br ${bgColor} rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-lg">
                        <i class="${icon}"></i>
                    </div>
                    <div class="flex-1">
                        <div class="font-semibold ${textColor} mb-1">${message}</div>
                        <div class="text-sm text-gray-600">
                            ${activity.type === 'offline' ? `Telepon tidak merespons ping sejak ${activity.time}` : 
                              activity.type === 'online' ? `Koneksi berhasil dipulihkan pada ${activity.time}` :
                              `Maintenance rutin dimulai pada ${activity.time}`}
                        </div>
                        <div class="flex items-center gap-4 mt-2">
                            <div class="text-xs text-gray-500 flex items-center gap-1">
                                <i class="fas fa-clock"></i>
                                ${activity.time} WIB
                            </div>
                            ${activity.duration ? `<div class="text-xs text-red-600 font-semibold bg-red-50 px-2 py-1 rounded-full">
                                <i class="fas fa-hourglass-half mr-1"></i>
                                ${activity.duration}
                            </div>` : ''}
                            ${activity.type === 'offline' ? `
                                <div class="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                                    <i class="fas fa-wifi-slash mr-1"></i>
                                    Terputus
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }

        // Initialize the dashboard
        function initDashboard() {
            const phoneGrid = document.getElementById('phone-grid');
            const activityLog = document.getElementById('activity-log');

            phoneGrid.innerHTML = phoneData.map(generatePhoneCard).join('');
            activityLog.innerHTML = generateActivityLog();
        }

        // Update counters
        function updateCounters() {
            const online = phoneData.filter(phone => phone.status === 'online').length;
            const offline = phoneData.filter(phone => phone.status === 'offline').length;
            
            document.getElementById('online-count').textContent = online;
            document.getElementById('offline-count').textContent = offline;
        }

        // Simulate real-time updates
        function simulateUpdates() {
            setInterval(() => {
                // Randomly change phone status
                const randomPhone = phoneData[Math.floor(Math.random() * phoneData.length)];
                const randomStatus = Math.random() > 0.7 ? 'offline' : 'online';
                
                if (randomPhone.status !== randomStatus) {
                    randomPhone.status = randomStatus;
                    randomPhone.lastSeen = new Date();
                    if (randomStatus === 'offline') {
                        randomPhone.downtime = Math.floor(Math.random() * 180) + 1;
                    } else {
                        randomPhone.downtime = 0;
                    }
                    
                    initDashboard();
                    updateCounters();
                }
            }, 5000);
        }

        // Initialize on page load
        document.addEventListener('DOMContentLoaded', function() {
            initDashboard();
            updateCounters();
            simulateUpdates();
        });
    </script>
</body>
</html>