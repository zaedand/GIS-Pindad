// resources/js/logs.js
import { io } from 'socket.io-client';

let socket;
let devices = [];
let disconnectLogs = [];

// Ambil data awal dan koneksi socket
document.addEventListener('DOMContentLoaded', async () => {
    const res = await fetch('/api/nodes');
    devices = await res.json();

    socket = io('http://localhost:3000');

    socket.on("device-status", statusList => {
        trackStatusChange(statusList);
        renderActivityLog();
    });

    document.getElementById('activity-filter')?.addEventListener('change', renderActivityLog);
});

function trackStatusChange(newStatusList) {
    const now = new Date();

    newStatusList.forEach(newDevice => {
        const existing = devices.find(d => d.endpoint === newDevice.endpoint);
        if (!existing) {
            // Perangkat baru
            devices.push({
                endpoint: newDevice.endpoint,
                status: newDevice.status,
                timestamp: newDevice.timestamp
            });
            return;
        }

        const prevStatus = normalizeStatus(existing.status);
        const currStatus = normalizeStatus(newDevice.status);

        // Jika status berubah dari online → offline
        if (prevStatus === 'online' && currStatus === 'offline') {
            disconnectLogs.push({
                endpoint: newDevice.endpoint,
                status: 'offline',
                time: now.toISOString(),
                description: 'Telepon tidak merespons',
            });
        }

        // Jika status berubah dari offline → online
        if (prevStatus === 'offline' && currStatus === 'online') {
            disconnectLogs.push({
                endpoint: newDevice.endpoint,
                status: 'online',
                time: now.toISOString(),
                description: 'Telepon kembali online',
            });
        }

        // Update status terakhir
        existing.status = newDevice.status;
        existing.timestamp = newDevice.timestamp;
    });
}

function normalizeStatus(status) {
    const s = status.toLowerCase();
    if (s.includes('online')) return 'online';
    if (s.includes('in use')) return 'online';
    return 'offline'; // semua selain online dianggap offline
}

function renderActivityLog() {
    const container = document.getElementById("activity-log");
    const filter = document.getElementById("activity-filter")?.value || 'all';

    if (!container) return;

    container.innerHTML = '';

    const logsToShow = disconnectLogs.filter(log => {
        if (filter === 'all') return true;
        return log.status === filter;
    });

    if (logsToShow.length === 0) {
        container.innerHTML = `<div class="text-center text-gray-500 text-sm">Belum ada aktivitas ${filter !== 'all' ? `(${filter})` : ''}.</div>`;
        return;
    }

    logsToShow.slice().reverse().forEach(log => {
        const item = document.createElement('div');
        item.className = 'p-4 rounded-xl shadow-sm border border-gray-200 bg-white flex justify-between items-start gap-4';

        item.innerHTML = `
            <div>
                <div class="font-semibold text-gray-800">
                    Endpoint <span class="text-indigo-600">${log.endpoint}</span> ${log.status === 'offline' ? 'tidak merespons' : 'kembali aktif'}
                </div>
                <div class="text-sm text-gray-500">${log.description}</div>
            </div>
            <div class="text-sm text-gray-400 whitespace-nowrap">
                ${new Date(log.time).toLocaleString()}
            </div>
        `;

        container.appendChild(item);
    });
}

class PhoneMonitoring {
    constructor() {
        this.phoneData = [
            { id: 1, name: 'Gedung A - Lantai 1', ip: '192.168.1.101', status: 'online', lastSeen: new Date(), downtime: 0 },
            { id: 2, name: 'Gedung A - Lantai 2', ip: '192.168.1.102', status: 'online', lastSeen: new Date(), downtime: 0 },
            { id: 3, name: 'Gedung B - Resepsionis', ip: '192.168.1.201', status: 'offline', lastSeen: new Date(Date.now() - 1800000), downtime: 30 },
            { id: 4, name: 'Gedung B - Ruang Meeting', ip: '192.168.1.202', status: 'offline', lastSeen: new Date(Date.now() - 3600000), downtime: 60 },
            { id: 5, name: 'Gedung C - Security', ip: '192.168.1.301', status: 'online', lastSeen: new Date(), downtime: 0 },
            { id: 6, name: 'Gedung C - Kantin', ip: '192.168.1.302', status: 'offline', lastSeen: new Date(Date.now() - 7200000), downtime: 120 },
            { id: 7, name: 'Gedung D - IT Support', ip: '192.168.1.401', status: 'online', lastSeen: new Date(), downtime: 0 },
            { id: 8, name: 'Gedung D - HR', ip: '192.168.1.402', status: 'online', lastSeen: new Date(), downtime: 0 }
        ];

        this.currentFilter = 'all';
        this.currentActivityFilter = 'all';
        this.allActivities = [];

        this.init();
    }

    init() {
        this.generateActivityLog();
        this.initLogboard();
        this.simulateUpdates();
    }

    formatDuration(minutes) {
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

    getStatusColor(status, downtime) {
        if (status === 'online') return 'green';
        if (downtime > 60) return 'red';
        if (downtime > 30) return 'orange';
        return 'yellow';
    }

    filterPhones(status) {
        this.currentFilter = status;

        // Update filter button states
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('bg-indigo-500', 'text-white', 'shadow-md');
            btn.classList.add('text-gray-600');
        });

        const activeBtn = document.getElementById(`filter-${status}`);
        activeBtn.classList.add('bg-indigo-500', 'text-white', 'shadow-md');
        activeBtn.classList.remove('text-gray-600');

        // Filter and display phones
        const filteredPhones = status === 'all' ? this.phoneData : this.phoneData.filter(phone => phone.status === status);

        // Update filter info
        const filterStatus = {
            'all': 'Semua telepon',
            'online': 'Telepon online',
            'offline': 'Telepon offline'
        };

        document.getElementById('filter-status').textContent = filterStatus[status];

        // Generate phone cards
        const phoneGrid = document.getElementById('phone-grid');
        const noResults = document.getElementById('no-results');

        if (filteredPhones.length === 0) {
            phoneGrid.classList.add('hidden');
            noResults.classList.remove('hidden');
        } else {
            phoneGrid.classList.remove('hidden');
            noResults.classList.add('hidden');
            phoneGrid.innerHTML = filteredPhones.map(phone => this.generatePhoneCard(phone)).join('');
        }

        // Update counters

    }

    filterActivities() {
        this.currentActivityFilter = document.getElementById('activity-filter').value;
        const activityLog = document.getElementById('activity-log');

        let filteredActivities = this.allActivities;
        if (this.currentActivityFilter !== 'all') {
            filteredActivities = this.allActivities.filter(activity => activity.type === this.currentActivityFilter);
        }

        if (filteredActivities.length === 0) {
            activityLog.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-inbox text-3xl mb-3"></i>
                    <p>Tidak ada aktivitas dengan filter yang dipilih</p>
                </div>
            `;
        } else {
            activityLog.innerHTML = filteredActivities.map(activity => this.generateActivityItem(activity)).join('');
        }
    }

    generatePhoneCard(phone) {
        const color = this.getStatusColor(phone.status, phone.downtime);
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
                            <span class="text-red-600 font-bold">${this.formatDuration(phone.downtime)}</span>
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

    generateActivityLog() {
        this.allActivities = [
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
    }

    generateActivityItem(activity) {
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

    initLogboard() {
        const phoneGrid = document.getElementById('phone-grid');
        const activityLog = document.getElementById('activity-log');

        phoneGrid.innerHTML = this.phoneData.map(phone => this.generatePhoneCard(phone)).join('');
        activityLog.innerHTML = this.allActivities.map(activity => this.generateActivityItem(activity)).join('');
    }



    simulateUpdates() {
        setInterval(() => {
            // Randomly change phone status
            const randomPhone = this.phoneData[Math.floor(Math.random() * this.phoneData.length)];
            const randomStatus = Math.random() > 0.7 ? 'offline' : 'online';

            if (randomPhone.status !== randomStatus) {
                randomPhone.status = randomStatus;
                randomPhone.lastSeen = new Date();
                if (randomStatus === 'offline') {
                    randomPhone.downtime = Math.floor(Math.random() * 180) + 1;
                } else {
                    randomPhone.downtime = 0;
                }

                this.initLogboard();

            }
        }, 5000);
    }
}

// Global functions for HTML onclick events
let phoneMonitoring;

function filterPhones(status) {
    phoneMonitoring.filterPhones(status);
}

function filterActivities() {
    phoneMonitoring.filterActivities();
}
window.filterPhones = function (status) {
    phoneMonitoring.filterPhones(status);
};

window.filterActivities = function () {
    phoneMonitoring.filterActivities();
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    phoneMonitoring = new PhoneMonitoring();
});

