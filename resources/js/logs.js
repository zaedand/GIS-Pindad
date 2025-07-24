// resources/js/logs.js
import { io } from 'socket.io-client';

let socket;
let nodes = [];
let disconnectLogs = [];
let latestStatus = [];
let markers = {};
let previousStatusMap = {}; // Track previous status

const apiHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
};

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Fetch initial nodes data
        await fetchNodes();

        // Initialize socket connection
        initializeSocket();

        // Initialize phone monitoring
        initializePhoneMonitoring();

        // Setup event listeners
        setupEventListeners();

    } catch (error) {
        console.error('Initialization error:', error);
    }
});

async function fetchNodes() {
    try {
        const response = await fetch('/api/nodes', { headers: apiHeaders });
        nodes = await response.json();
        console.log('Loaded nodes:', nodes);

        // Initialize previous status map with current node status
        nodes.forEach(node => {
            if (node.endpoint) {
                previousStatusMap[node.endpoint] = normalizeStatus(node.status || 'offline');
            }
        });

        // Apply any existing live status
        applyLiveStatus();
        updateRealtimeStats(latestStatus);

    } catch (error) {
        console.error('Error fetching nodes:', error);
    }
}

function initializeSocket() {
    socket = io('http://localhost:3000');

    socket.on('connect', () => {
        console.log('Connected to Socket.IO server:', socket.id);
    });

    socket.on('device-status', statusList => {
        console.log('Received device status:', statusList);
        latestStatus = statusList;
        
        // Track status changes BEFORE applying live status
        trackStatusChange(statusList);
        
        // Apply live status updates
        applyLiveStatus();
        updateRealtimeStats(statusList);
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from Socket.IO server');
    });
}

function setupEventListeners() {
    // Activity filter
    const activityFilter = document.getElementById('activity-filter');
    if (activityFilter) {
        activityFilter.addEventListener('change', renderActivityLog);
    }
}

function normalizeStatus(status) {
    if (!status) return 'offline';
    
    status = status.toLowerCase();
    
    if (status.includes('unavailable') || status.includes('0 of')) {
        return 'offline';
    }

    if (status.includes('in use') || status.includes('not in use')) {
        return 'online'; // masih dianggap aktif
    }

    return 'unknown';
}

function getStatusColor(status) {
    switch (status) {
        case 'online': return '#10b981';    // green
        case 'offline': return '#ef4444';   // red
        case 'partial': return '#f59e0b';   // yellow
        default: return '#6b7280';          // gray
    }
}

function formatDisplayStatus(status) {
    switch (status) {
        case 'online': return 'Online';
        case 'offline': return 'Offline';
        case 'partial': return 'In Use';
        default: return 'Unknown';
    }
}

function applyLiveStatus() {
    if (!latestStatus || latestStatus.length === 0) return;

    latestStatus.forEach(update => {
        const node = nodes.find(n => n.endpoint === update.endpoint);
        if (!node) return;

        const normalizedStatus = normalizeStatus(update.status);
        node.status = normalizedStatus;
        node.last_ping_raw = update.timestamp || new Date().toISOString();

        const color = getStatusColor(normalizedStatus);

        // Update marker if exists
        if (markers[update.endpoint]) {
            markers[update.endpoint].setStyle({
                color,
                fillColor: color
            });
            markers[update.endpoint].setPopupContent(getPopupContent(node, color));
        }
    });
}

function trackStatusChange(devices) {
    devices.forEach(device => {
        const endpoint = device.endpoint;
        const currentStatus = normalizeStatus(device.status);
        const timestamp = device.timestamp || new Date().toISOString();

        // Get previous status for this endpoint
        const prevStatus = previousStatusMap[endpoint];

        // Only track if there's actually a status change AND we have a previous status
        if (prevStatus && prevStatus !== currentStatus) {
            console.log(`[STATUS CHANGE] ${endpoint}: ${prevStatus} → ${currentStatus} at ${timestamp}`);

            // Check if this exact log already exists (prevent duplicates)
            const existingLogIndex = disconnectLogs.findIndex(log =>
                log.endpoint === endpoint && 
                log.time === timestamp &&
                log.from === prevStatus &&
                log.to === currentStatus
            );

            if (existingLogIndex === -1) { // No duplicate found
                const node = nodes.find(n => n.endpoint === endpoint);

                const log = {
                    endpoint,
                    from: prevStatus,
                    to: currentStatus,
                    time: timestamp,
                    status: currentStatus,
                    nodeName: node?.name || `Node ${endpoint}`,
                    description: getStatusDescription(prevStatus, currentStatus)
                };

                disconnectLogs.push(log);
                console.log("New log added:", log);
                
                // Render the updated activity log
                renderActivityLog();
            }
        }

        // Update the previous status map
        previousStatusMap[endpoint] = currentStatus;
    });
}

function getStatusDescription(fromStatus, toStatus) {
    if (toStatus === 'offline') {
        return 'Telepon tidak merespons';
    } else if (fromStatus === 'offline' && toStatus === 'online') {
        return 'Telepon kembali online';
    } else if (toStatus === 'online') {
        return 'Telepon aktif';
    } else {
        return `Status berubah dari ${fromStatus} ke ${toStatus}`;
    }
}

function updateRealtimeStats(statusData) {
    if (!statusData || statusData.length === 0) {
        // Use nodes data if no status data
        statusData = nodes.map(node => ({
            endpoint: node.endpoint,
            status: node.status || 'offline'
        }));
    }

    const total = statusData.length;
    const online = statusData.filter(s => normalizeStatus(s.status) === 'online').length;
    const offline = statusData.filter(s => normalizeStatus(s.status) === 'offline').length;
    const inUse = statusData.filter(s => normalizeStatus(s.status) === 'partial').length;

    console.log('Stats:', { total, online, offline, inUse });

    const setText = (id, val) => {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = val;
        }
    };

    setText('total-phones', total);
    setText('online-phones', online);
    setText('offline-phones', offline);
    setText('in-use-phones', inUse);

    // Update filter info if phoneMonitoring exists
    if (phoneMonitoring) {
        // Get current filter and update the display accordingly
        const currentFilter = phoneMonitoring.currentFilter;
        const currentPhoneData = phoneMonitoring.phoneData;
        const filteredPhones = currentFilter === 'all' ? currentPhoneData : currentPhoneData.filter(phone => phone.status === currentFilter);
        
        phoneMonitoring.updateFilterInfo(currentFilter, filteredPhones.length, total);
    }
}

function renderActivityLog() {
    const container = document.getElementById("activity-log");
    const filter = document.getElementById("activity-filter")?.value || 'all';

    if (!container) {
        console.warn('Activity log container not found');
        return;
    }

    console.log('Rendering activity log with', disconnectLogs.length, 'total logs');

    // Clear container
    container.innerHTML = '';

    // Filter logs based on selected filter
    let logsToShow = disconnectLogs.filter(log => {
        if (filter === 'all') return true;
        return log.status === filter;
    });

    console.log('Filtered logs:', logsToShow.length, 'logs to show');

    if (logsToShow.length === 0) {
        container.innerHTML = `
            <div class="text-center text-gray-500 text-sm p-8">
                <i class="fas fa-inbox text-3xl mb-3"></i>
                <p>Belum ada aktivitas ${filter !== 'all' ? `(${filter})` : ''}.</p>
                <p class="text-xs mt-2">Total logs in memory: ${disconnectLogs.length}</p>
            </div>
        `;
        return;
    }

    // Show latest logs first (reverse chronologically)
    const sortedLogs = logsToShow.slice().sort((a, b) => new Date(b.time) - new Date(a.time));
    
    sortedLogs.forEach(log => {
        const item = document.createElement('div');
        item.className = 'p-4 rounded-xl shadow-sm border border-gray-200 bg-white flex justify-between items-start gap-4 hover:shadow-md transition-shadow';

        const statusIcon = log.status === 'offline' ?
            '<i class="fas fa-exclamation-triangle text-red-500"></i>' :
            '<i class="fas fa-check-circle text-green-500"></i>';

        const statusColor = log.status === 'offline' ? 'text-red-600' : 'text-green-600';

        item.innerHTML = `
            <div class="flex items-start gap-3">
                <div class="mt-1">${statusIcon}</div>
                <div>
                    <div class="font-semibold text-gray-800">
                        ${log.nodeName}
                    </div>
                    <div class="text-sm text-gray-500">${log.description}</div>
                    <div class="text-xs ${statusColor} font-medium mt-1">
                        ${log.from} → ${log.to} | Endpoint: ${log.endpoint}
                    </div>
                </div>
            </div>
            <div class="text-sm text-gray-400 whitespace-nowrap">
                ${new Date(log.time).toLocaleString('id-ID')}
            </div>
        `;

        container.appendChild(item);
    });
}

function getPopupContent(node, color) {
    // Return popup content for map markers
    return `
        <div>
            <strong>${node.name}</strong><br>
            <span style="color: ${color}">Status: ${formatDisplayStatus(node.status)}</span><br>
            IP: ${node.ip}<br>
            Endpoint: ${node.endpoint}
        </div>
    `;
}

// Phone Monitoring Class - Updated to use real backend data
class PhoneMonitoring {
    constructor() {
        this.currentFilter = 'all';
        this.currentActivityFilter = 'all';
        this.init();
    }

    init() {
        this.initLogboard();
        // Remove simulation - we're using real data now
    }

    get phoneData() {
        // Convert nodes data to phone data format
        return nodes.map(node => ({
            id: node.id,
            name: node.name,
            ip: node.ip,
            endpoint: node.endpoint,
            status: node.status || 'offline',
            lastSeen: node.last_ping_raw ? new Date(node.last_ping_raw) : new Date(),
            downtime: this.calculateDowntime(node.last_ping_raw),
            uptime: node.uptime_percentage || '0',
            responseTime: node.response_time_raw || 'N/A'
        }));
    }

    calculateDowntime(lastPing) {
        if (!lastPing) return 0;
        const lastPingDate = new Date(lastPing);
        const now = new Date();
        const diffMinutes = Math.floor((now - lastPingDate) / (1000 * 60));
        return Math.max(0, diffMinutes);
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
        if (status === 'partial') return 'yellow';
        if (downtime > 60) return 'red';
        if (downtime > 30) return 'orange';
        return 'red';
    }

    filterPhones(status) {
        this.currentFilter = status;

        // Update filter button states
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('bg-indigo-500', 'text-white', 'shadow-md');
            btn.classList.add('text-gray-600');
        });

        const activeBtn = document.getElementById(`filter-${status}`);
        if (activeBtn) {
            activeBtn.classList.add('bg-indigo-500', 'text-white', 'shadow-md');
            activeBtn.classList.remove('text-gray-600');
        }

        // Filter and display phones
        const currentPhoneData = this.phoneData;
        const filteredPhones = status === 'all' ? currentPhoneData : currentPhoneData.filter(phone => phone.status === status);

        // Update filter info
        this.updateFilterInfo(status, filteredPhones.length, currentPhoneData.length);

        // Generate phone cards
        const phoneGrid = document.getElementById('phone-grid');
        const noResults = document.getElementById('no-results');

        if (!phoneGrid) return;

        if (filteredPhones.length === 0) {
            phoneGrid.classList.add('hidden');
            if (noResults) noResults.classList.remove('hidden');
        } else {
            phoneGrid.classList.remove('hidden');
            if (noResults) noResults.classList.add('hidden');
            phoneGrid.innerHTML = filteredPhones.map(phone => this.generatePhoneCard(phone)).join('');
        }
    }

    updateFilterInfo(status, filteredCount, totalCount) {
        const filterStatus = {
            'all': 'Semua telepon',
            'online': 'Telepon online',
            'offline': 'Telepon offline',
            'partial': 'Telepon in use'
        };

        // Update filter status text
        const filterStatusEl = document.getElementById('filter-status');
        if (filterStatusEl) {
            filterStatusEl.textContent = filterStatus[status] || 'Filter tidak dikenal';
        }

        // Update filtered count
        const filterPhonesEl = document.getElementById('filterPhones');
        if (filterPhonesEl) {
            filterPhonesEl.textContent = filteredCount;
        }

        // Update total count (this should match the total-phones from stats)
        const totalPhonesEl = document.getElementById('total-phones');
        if (totalPhonesEl) {
            totalPhonesEl.textContent = totalCount;
        }

        console.log(`Filter Info Updated: ${filterStatus[status]} (${filteredCount} dari ${totalCount} telepon)`);
    }

    generatePhoneCard(phone) {
        const color = this.getStatusColor(phone.status, phone.downtime);
        const isOnline = phone.status === 'online';
        const displayStatus = formatDisplayStatus(phone.status);

        return `
            <div class="bg-white rounded-xl p-4 shadow-lg border-l-4 border-${color}-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div class="flex items-start justify-between mb-3">
                    <div class="flex-1">
                        <h4 class="font-semibold text-gray-800 text-sm mb-1">${phone.name}</h4>
                        <p class="text-xs text-gray-600">${phone.ip}</p>
                        <p class="text-xs text-gray-500">Endpoint: ${phone.endpoint}</p>
                    </div>
                    <div class="flex flex-col items-end gap-1">
                        <div class="flex items-center gap-2">
                            <div class="w-3 h-3 bg-${color}-500 rounded-full ${isOnline ? 'animate-pulse' : ''}"></div>
                            <span class="text-xs font-medium ${isOnline ? 'text-green-600' : phone.status === 'partial' ? 'text-yellow-600' : 'text-red-600'} capitalize">
                                ${displayStatus}
                            </span>
                        </div>
                    </div>
                </div>

                <div class="space-y-2">
                    <div class="flex justify-between items-center text-xs">
                        <span class="text-gray-500">Last Seen:</span>
                        <span class="text-gray-700 font-medium">${phone.lastSeen.toLocaleString('id-ID')}</span>
                    </div>

                    <div class="flex justify-between items-center text-xs">
                        <span class="text-gray-500">Uptime:</span>
                        <span class="text-blue-600 font-medium">${phone.uptime}%</span>
                    </div>

                    ${!isOnline ? `
                        <div class="flex justify-between items-center text-xs">
                            <span class="text-gray-500">Offline Duration:</span>
                            <span class="text-red-600 font-bold">${this.formatDuration(phone.downtime)}</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-1.5">
                            <div class="bg-red-500 h-1.5 rounded-full" style="width: ${Math.min(phone.downtime / 120 * 100, 100)}%"></div>
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

    initLogboard() {
        const phoneGrid = document.getElementById('phone-grid');
        if (phoneGrid) {
            const currentPhoneData = this.phoneData;
            phoneGrid.innerHTML = currentPhoneData.map(phone => this.generatePhoneCard(phone)).join('');
            
            // Update filter info for initial load (show all phones)
            this.updateFilterInfo('all', currentPhoneData.length, currentPhoneData.length);
        }

        // Also render activity log
        renderActivityLog();
    }

    // Update the logboard when data changes
    updateLogboard() {
        this.initLogboard();
        this.filterPhones(this.currentFilter); // Reapply current filter
    }
}

// Global functions for HTML onclick events
let phoneMonitoring;

// Global functions
window.filterPhones = function(status) {
    if (phoneMonitoring) {
        phoneMonitoring.filterPhones(status);
    }
};

window.filterActivities = function() {
    renderActivityLog();
};

// Initialize phone monitoring after nodes are loaded
function initializePhoneMonitoring() {
    phoneMonitoring = new PhoneMonitoring();

    // Update logboard when nodes data changes
    const originalApplyLiveStatus = applyLiveStatus;
    applyLiveStatus = function() {
        originalApplyLiveStatus();
        if (phoneMonitoring) {
            phoneMonitoring.updateLogboard();
        }
    };
}

// Export for global access
Object.assign(window, {
    phoneMonitoring,
    fetchNodes,
    renderActivityLog,
    updateRealtimeStats
});