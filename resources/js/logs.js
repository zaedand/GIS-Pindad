// resources/js/logs.js -  FIXED TIME FORMAT
import { io } from 'socket.io-client';

let socket;
let nodes = [];
let disconnectLogs = [];
let latestStatus = [];
let markers = {};
let previousStatusMap = {};
let deviceHistoryTracker;
let phoneMonitoring;

// Pagination settings
let currentPage = 1;
let itemsPerPage = 10;
let totalPages = 1;
let filteredLogs = [];

const apiHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
};

// ===== TIME FORMAT UTILITIES - FIXED =====
function formatDateTime(dateString, format = 'full') {
    if (!dateString) return 'N/A';

    try {
        // Parse manual, ambil nilai asli (bukan hasil konversi timezone browser)
        const parts = dateString.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
        if (!parts) return 'Invalid Date';

        const [_, year, month, day, hour, minute, second] = parts;

        switch (format) {
            case 'short':
                return `${day}/${month}/${year.slice(2)} ${hour}.${minute}`;

            case 'date-only':
                return `${day}/${month}/${year}`;

            case 'time-only':
                return `${hour}.${minute}.${second}`;

            case 'full':
            default:
                return `${day}/${month}/${year} ${hour}.${minute}.${second}`;
        }
    } catch (error) {
        console.error('Error formatting date:', error, dateString);
        return 'Format Error';
    }
}



function formatRelativeTime(dateString) {
    if (!dateString) return 'N/A';
    
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffMinutes < 1) return 'Baru saja';
        if (diffMinutes < 60) return `${diffMinutes} menit yang lalu`;
        if (diffHours < 24) return `${diffHours} jam yang lalu`;
        if (diffDays < 7) return `${diffDays} hari yang lalu`;
        
        // For older dates, show absolute date
        return formatDateTime(dateString, 'short');
    } catch (error) {
        console.error('Error calculating relative time:', error);
        return formatDateTime(dateString, 'short');
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Fetch initial nodes data
        await fetchNodes();

        // Initialize device history tracker
        deviceHistoryTracker = new DeviceHistoryTracker();

        // Initialize socket connection
        initializeSocket();

        // Initialize phone monitoring
        initializePhoneMonitoring();

        // Setup event listeners
        setupEventListeners();

        // Initialize search functionality
        initializeSearch();

    } catch (error) {
        console.error('Initialization error:', error);
    }
});

async function fetchNodes() {
    try {
        const response = await fetch('/api/nodes', { headers: apiHeaders });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        nodes = await response.json();
        console.log('Loaded nodes:', nodes);

        // Initialize previous status map with current node status
        nodes.forEach(node => {
            if (node.endpoint) {
                previousStatusMap[node.endpoint] = normalizeStatus(node.status || 'offline');
            }
        });

        // Load existing activity logs from database using History API
        await loadActivityLogsFromDatabase();

        // Apply any existing live status
        applyLiveStatus();
        updateRealtimeStats(latestStatus);

    } catch (error) {
        console.error('Error fetching nodes:', error);
        showNotification('Error loading nodes data', 'error');
    }
}

async function loadActivityLogsFromDatabase() {
    try {
        // Use the existing History API endpoint
        const response = await fetch('/api/history/all', { headers: apiHeaders });
        if (response.ok) {
            const data = await response.json();
            // Handle different response formats
            const logs = Array.isArray(data) ? data : (data.data || []);

            disconnectLogs = logs.map(log => ({
                id: log.id,
                endpoint: log.endpoint,
                status: log.current_status,
                time: log.timestamp || log.created_at,
                description: log.description,
                nodeName: log.node_name || `Node ${log.endpoint}`,
                duration: log.duration || null,
                from: log.previous_status,
                to: log.current_status
            }));

            // Calculate durations for all logs
            calculateLogDurations();
            console.log('Loaded activity logs from database:', disconnectLogs.length);
        }
    } catch (error) {
        console.error('Error loading activity logs:', error);
    }
}

// NEW FEATURE: Calculate duration between status changes
function calculateLogDurations() {
    // Group logs by endpoint for duration calculation
    const logsByEndpoint = {};

    // Sort logs by time (oldest first) for accurate duration calculation
    const sortedLogs = [...disconnectLogs].sort((a, b) => new Date(a.time) - new Date(b.time));

    sortedLogs.forEach(log => {
        if (!logsByEndpoint[log.endpoint]) {
            logsByEndpoint[log.endpoint] = [];
        }
        logsByEndpoint[log.endpoint].push(log);
    });

    // Calculate durations for each endpoint
    Object.keys(logsByEndpoint).forEach(endpoint => {
        const endpointLogs = logsByEndpoint[endpoint];

        for (let i = 0; i < endpointLogs.length; i++) {
            const currentLog = endpointLogs[i];
            const nextLog = endpointLogs[i + 1];

            if (nextLog && currentLog.to === 'offline') {
                // Calculate offline duration
                const offlineStart = new Date(currentLog.time);
                const offlineEnd = new Date(nextLog.time);
                const durationMs = offlineEnd - offlineStart;
                const durationMinutes = Math.floor(durationMs / (1000 * 60));

                currentLog.offlineDuration = durationMinutes;
                currentLog.offlineDurationFormatted = formatDuration(durationMinutes);
            } else if (currentLog.to === 'offline') {
                // Still offline, calculate duration from then to now
                const offlineStart = new Date(currentLog.time);
                const now = new Date();
                const durationMs = now - offlineStart;
                const durationMinutes = Math.floor(durationMs / (1000 * 60));

                currentLog.offlineDuration = durationMinutes;
                currentLog.offlineDurationFormatted = formatDuration(durationMinutes);
                currentLog.isCurrentlyOffline = true;
            }
        }
    });
}

function formatDuration(minutes) {
    if (minutes < 1) return 'Kurang dari 1 menit';
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

// NEW FEATURE: Get total offline duration for specific endpoint
function getTotalOfflineDuration(endpoint) {
    const endpointLogs = disconnectLogs.filter(log => log.endpoint === endpoint);
    let totalOfflineMinutes = 0;

    endpointLogs.forEach(log => {
        if (log.to === 'offline' && log.offlineDuration) {
            totalOfflineMinutes += log.offlineDuration;
        }
    });

    return {
        minutes: totalOfflineMinutes,
        formatted: formatDuration(totalOfflineMinutes)
    };
}

function initializeSocket() {
    // Try different socket URLs based on environment
    const socketUrls = [
        'http://localhost:3000',
        window.location.origin.replace(/^http/, 'ws'),
        window.location.origin
    ];

    let socketConnected = false;

    function tryConnect(urlIndex = 0) {
        if (urlIndex >= socketUrls.length || socketConnected) return;

        const url = socketUrls[urlIndex];
        console.log(`Attempting socket connection to: ${url}`);

        socket = io(url, {
            transports: ['websocket', 'polling'],
            autoConnect: true,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 3,
            timeout: 5000
        });

        socket.on('connect', () => {
            console.log('Connected to Socket.IO server:', socket.id);
            socketConnected = true;
            showNotification('Server connected successfully', 'success');
        });

        socket.on('device-status', async (statusList) => {
            console.log('Received device status:', statusList);
            latestStatus = statusList;

            // Track status changes and save to database
            await trackStatusChangeAndSave(statusList);

            // Apply live status updates
            applyLiveStatus();
            updateRealtimeStats(statusList);

            // Update phone monitoring display
            if (phoneMonitoring) {
                phoneMonitoring.updateLogboard();
            }
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from Socket.IO server');
            showNotification('Server disconnected', 'warning');
        });

        socket.on('connect_error', (error) => {
            console.error(`Server connection error for ${url}:`, error);
            if (!socketConnected) {
                tryConnect(urlIndex + 1);
            }
        });
    }

    tryConnect();
}

function setupEventListeners() {
    // Activity filter
    const activityFilter = document.getElementById('activity-filter');
    if (activityFilter) {
        activityFilter.addEventListener('change', () => {
            currentPage = 1; // Reset to first page when filtering
            renderActivityLog();
        });
    }

    // Search input
    const searchInput = document.getElementById('endpoint-search');
    if (searchInput) {
        searchInput.addEventListener('input', handleEndpointSearch);
    }

    // Date range filters
    const dateFromInput = document.getElementById('date-from');
    const dateToInput = document.getElementById('date-to');

    if (dateFromInput) dateFromInput.addEventListener('change', () => {
        currentPage = 1;
        renderActivityLog();
    });
    if (dateToInput) dateToInput.addEventListener('change', () => {
        currentPage = 1;
        renderActivityLog();
    });

    // Items per page selector
    const itemsPerPageSelect = document.getElementById('items-per-page');
    if (itemsPerPageSelect) {
        itemsPerPageSelect.addEventListener('change', (e) => {
            itemsPerPage = parseInt(e.target.value);
            currentPage = 1;
            renderActivityLog();
        });
    }
}

function normalizeStatus(status) {
    if (!status) return 'offline';

    status = status.toString().toLowerCase();

    if (status.includes('unavailable') || status.includes('0 of')) {
        return 'offline';
    }

    if (status.includes('in use') || status.includes('not in use')) {
        return 'online';
    }

    if (status.includes('online') || status.includes('active')) {
        return 'online';
    }

    return 'offline';
}

function getStatusColor(status) {
    switch (status) {
        case 'online': return '#10b981';
        case 'offline': return '#ef4444';
        case 'partial': return '#f59e0b';
        default: return '#6b7280';
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
        const node = nodes.find(n => 
            n.endpoint === update.endpoint || 
            n.endpoint.includes(update.endpoint) ||
            update.endpoint.includes(n.endpoint)
        );
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

async function trackStatusChangeAndSave(devices) {
    const statusChanges = [];

    for (const device of devices) {
        const endpoint = device.endpoint;
        const currentStatus = normalizeStatus(device.status);
        const timestamp = device.timestamp || new Date().toISOString();
        const prevStatus = previousStatusMap[endpoint];

        // Only track if there's actually a status change AND we have a previous status
        if (prevStatus && prevStatus !== currentStatus) {
            console.log(`[STATUS CHANGE] ${endpoint}: ${prevStatus} → ${currentStatus} at ${timestamp}`);

            const node = nodes.find(n => n.endpoint === endpoint);
            const statusChangeData = {
                endpoint: endpoint,
                node_name: node?.name || `Node ${endpoint}`,
                previous_status: prevStatus,
                current_status: currentStatus,
                timestamp: timestamp,
                description: getStatusDescription(prevStatus, currentStatus)
            };

            statusChanges.push(statusChangeData);

            // Calculate duration for offline periods
            let offlineDuration = null;
            let offlineDurationFormatted = null;

            if (prevStatus === 'offline') {
                // Find the last offline event for this endpoint
                const lastOfflineLog = disconnectLogs.find(log =>
                    log.endpoint === endpoint &&
                    log.to === 'offline' &&
                    new Date(log.time) < new Date(timestamp)
                );

                if (lastOfflineLog) {
                    const offlineStart = new Date(lastOfflineLog.time);
                    const offlineEnd = new Date(timestamp);
                    const durationMs = offlineEnd - offlineStart;
                    offlineDuration = Math.floor(durationMs / (1000 * 60));
                    offlineDurationFormatted = formatDuration(offlineDuration);
                }
            }

            // Add to local logs immediately for UI responsiveness
            const logEntry = {
                endpoint: endpoint,
                from: prevStatus,
                to: currentStatus,
                time: timestamp,
                status: currentStatus,
                nodeName: node?.name || `Node ${endpoint}`,
                description: statusChangeData.description,
                offlineDuration: offlineDuration,
                offlineDurationFormatted: offlineDurationFormatted
            };

            // Check if this exact log already exists (prevent duplicates)
            const existingLogIndex = disconnectLogs.findIndex(log =>
                log.endpoint === endpoint &&
                log.time === timestamp &&
                log.from === prevStatus &&
                log.to === currentStatus
            );

            if (existingLogIndex === -1) {
                disconnectLogs.unshift(logEntry); // Add to beginning for latest first
                console.log("New log added:", logEntry);
            }
        }

        // Update the previous status map
        previousStatusMap[endpoint] = currentStatus;
    }

    // Save status changes to database using History API
    if (statusChanges.length > 0) {
        try {
            await saveStatusChangesToDatabase(statusChanges);
        } catch (error) {
            console.error('Error saving status changes to database:', error);
        }
    }

    // Recalculate durations after new logs
    calculateLogDurations();

    // Render the updated activity log
    renderActivityLog();
}

async function saveStatusChangesToDatabase(statusChanges) {
    try {
        // Use the existing History API endpoint for individual updates
        const savePromises = statusChanges.map(async (change) => {
            const response = await fetch('/api/history/update-status', {
                method: 'POST',
                headers: apiHeaders,
                body: JSON.stringify({
                    endpoint: change.endpoint,
                    node_name: change.node_name,
                    previous_status: change.previous_status,
                    current_status: change.current_status,
                    timestamp: change.timestamp,
                    description: change.description
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error Response:', response.status, errorText);
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }

            return await response.json();
        });

        const results = await Promise.allSettled(savePromises);

        // Log results and handle failures
        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                console.log(`Status change ${index + 1} saved successfully:`, result.value);
            } else {
                console.error(`Status change ${index + 1} failed:`, result.reason);
            }
        });

    } catch (error) {
        console.error('Error in saveStatusChangesToDatabase:', error);
        showNotification('Error saving activity logs to database', 'error');

        // Retry mechanism
        setTimeout(() => {
            console.log('Retrying failed status changes...');
            saveStatusChangesToDatabase(statusChanges);
        }, 5000);
    }
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
        if (el) el.textContent = val;
    };

    setText('total-phones', total);
    setText('online-phones', online);
    setText('offline-phones', offline);
    setText('in-use-phones', inUse);

    // Update filter info if phoneMonitoring exists
    if (phoneMonitoring) {
        const currentFilter = phoneMonitoring.currentFilter;
        const currentPhoneData = phoneMonitoring.phoneData;
        const filteredPhones = currentFilter === 'all' ? currentPhoneData :
            currentPhoneData.filter(phone => phone.status === currentFilter);

        phoneMonitoring.updateFilterInfo(currentFilter, filteredPhones.length, total);
    }
}

// ENHANCED: Activity log rendering with pagination - FIXED TIME FORMAT
function renderActivityLog() {
    const container = document.getElementById("activity-log");
    const filter = document.getElementById("activity-filter")?.value || 'all';
    const searchTerm = document.getElementById('endpoint-search')?.value.toLowerCase() || '';
    const dateFrom = document.getElementById('date-from')?.value;
    const dateTo = document.getElementById('date-to')?.value;

    if (!container) {
        console.warn('Activity log container not found');
        return;
    }

    console.log('Rendering activity log with', disconnectLogs.length, 'total logs');

    // Filter logs based on criteria
    filteredLogs = disconnectLogs.filter(log => {
        // Status filter
        if (filter !== 'all' && log.status !== filter) return false;

        // Search filter - Enhanced to search specific endpoints
        if (searchTerm) {
            const matchesEndpoint = log.endpoint.toLowerCase().includes(searchTerm);
            const matchesNodeName = log.nodeName.toLowerCase().includes(searchTerm);
            const matchesExactEndpoint = log.endpoint.toLowerCase() === searchTerm;

            if (!matchesEndpoint && !matchesNodeName && !matchesExactEndpoint) return false;
        }

        // Date range filter
        const logDate = new Date(log.time).toISOString().split('T')[0];
        if (dateFrom && logDate < dateFrom) return false;
        if (dateTo && logDate > dateTo) return false;

        return true;
    });

    // Sort logs by time (latest first)
    filteredLogs.sort((a, b) => new Date(b.time) - new Date(a.time));

    console.log('Filtered logs:', filteredLogs.length, 'logs to show');

    // Calculate pagination
    totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const logsToShow = filteredLogs.slice(startIndex, endIndex);

    // Clear container
    container.innerHTML = '';

    if (filteredLogs.length === 0) {
        container.innerHTML = `
            <div class="text-center text-gray-500 text-sm p-8">
                <i class="fas fa-inbox text-3xl mb-3"></i>
                <p>Tidak ada aktivitas ditemukan</p>
                ${searchTerm ? `<p class="text-xs mt-2">dengan pencarian: "${searchTerm}"</p>` : ''}
                <p class="text-xs mt-2">Total logs: ${disconnectLogs.length}</p>
            </div>
        `;
        updatePaginationControls();
        return;
    }

    // Render current page logs
    logsToShow.forEach((log, index) => {
        const item = document.createElement('div');
        item.className = 'p-4 rounded-xl shadow-sm border border-gray-200 bg-white hover:shadow-md transition-all duration-300';

        const statusIcon = log.status === 'offline' ?
            '<i class="fas fa-exclamation-triangle text-red-500"></i>' :
            '<i class="fas fa-check-circle text-green-500"></i>';

        const statusColor = log.status === 'offline' ? 'text-red-600' : 'text-green-600';

        // Get total offline duration for this endpoint
        const totalOffline = getTotalOfflineDuration(log.endpoint);

        item.innerHTML = `
            <div class="flex justify-between items-start gap-4">
                <div class="flex items-start gap-3 flex-1">
                    <div class="mt-1">${statusIcon}</div>
                    <div class="flex-1">
                        <div class="font-semibold text-gray-800 mb-1">
                            ${log.nodeName}
                            <span class="text-sm font-normal text-gray-500">(${log.endpoint})</span>
                        </div>
                        <div class="text-sm text-gray-600 mb-2">${log.description}</div>

                        <!-- Enhanced status change info with duration -->
                        <div class="flex flex-wrap gap-2 text-xs mb-2">
                            <span class="${statusColor} font-medium bg-gray-50 px-2 py-1 rounded-full">
                                ${log.from} → ${log.to}
                            </span>
                            ${log.offlineDurationFormatted ? `
                                <span class="text-orange-600 font-medium bg-orange-50 px-2 py-1 rounded-full">
                                    <i class="fas fa-clock mr-1"></i>Durasi: ${log.offlineDurationFormatted}
                                </span>
                            ` : ''}
                            ${log.isCurrentlyOffline ? `
                                <span class="text-red-600 font-medium bg-red-50 px-2 py-1 rounded-full animate-pulse">
                                    <i class="fas fa-exclamation-circle mr-1"></i>Masih Offline
                                </span>
                            ` : ''}
                        </div>

                        <!-- Total offline duration for endpoint -->
                        <div class="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full inline-block mb-2">
                            <i class="fas fa-chart-line mr-1"></i>Total Offline: ${totalOffline.formatted}
                        </div>

                        <div class="flex flex-wrap gap-2 text-xs">
                            <button
                                onclick="showEndpointHistory('${log.endpoint}')"
                                class="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-full transition-colors"
                            >
                                <i class="fas fa-history mr-1"></i>View History
                            </button>
                            <button
                                onclick="searchSpecificEndpoint('${log.endpoint}')"
                                class="text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-full transition-colors"
                            >
                                <i class="fas fa-filter mr-1"></i>Filter This Endpoint
                            </button>
                        </div>
                    </div>
                </div>
                <div class="text-sm text-gray-400 whitespace-nowrap">
                    ${formatDateTime(log.time, 'full')}
                </div>
            </div>
        `;

        container.appendChild(item);
    });

    // Update pagination and search results
    updatePaginationControls();
    updateSearchResultsCount(filteredLogs.length, disconnectLogs.length);
}

// Pagination controls
function updatePaginationControls() {
    const paginationContainer = document.getElementById('pagination-controls');
    if (!paginationContainer) return;

    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    let paginationHTML = `
        <div class="flex items-center justify-between bg-white px-4 py-3 rounded-lg border ">
            <div class="flex items-center gap-2 text-sm text-gray-700">
                <span>Menampilkan ${((currentPage - 1) * itemsPerPage) + 1} - ${Math.min(currentPage * itemsPerPage, filteredLogs.length)} dari ${filteredLogs.length} data</span>
            </div>
            <div class="flex items-center gap-2">
                <select id="items-per-page" class="px-3 py-1 border border-gray-300 rounded text-sm">
                    <option value="10" ${itemsPerPage === 10 ? 'selected' : ''}>10</option>
                    <option value="20" ${itemsPerPage === 20 ? 'selected' : ''}>20</option>
                    <option value="50" ${itemsPerPage === 50 ? 'selected' : ''}>50</option>
                    <option value="100" ${itemsPerPage === 100 ? 'selected' : ''}>100</option>
                </select>

                <div class="flex gap-1">
                    <button onclick="goToPage(${currentPage - 1})"
                            ${currentPage <= 1 ? 'disabled' : ''}
                            class="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                        <i class="fas fa-chevron-left"></i> Prev
                    </button>
    `;

    // Page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <button onclick="goToPage(${i})"
                    class="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 ${i === currentPage ? 'bg-indigo-500 text-white border-indigo-500' : ''}">
                ${i}
            </button>
        `;
    }

    paginationHTML += `
                    <button onclick="goToPage(${currentPage + 1})"
                            ${currentPage >= totalPages ? 'disabled' : ''}
                            class="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                        Next <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>
        </div>
    `;

    paginationContainer.innerHTML = paginationHTML;

    // Re-attach event listener for items per page
    const itemsPerPageSelect = document.getElementById('items-per-page');
    if (itemsPerPageSelect) {
        itemsPerPageSelect.addEventListener('change', (e) => {
            itemsPerPage = parseInt(e.target.value);
            currentPage = 1;
            renderActivityLog();
        });
    }
}

// NEW FEATURE: Go to specific page
function goToPage(page) {
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderActivityLog();
}

// NEW FEATURE: Search for specific endpoint
function searchSpecificEndpoint(endpoint) {
    const searchInput = document.getElementById('endpoint-search');
    if (searchInput) {
        searchInput.value = endpoint;
        currentPage = 1;
        renderActivityLog();

        // Scroll to search container
        const searchContainer = document.getElementById('search-container');
        if (searchContainer) {
            searchContainer.scrollIntoView({ behavior: 'smooth' });
        }

        showNotification(`Menampilkan aktivitas untuk endpoint: <strong>${endpoint}</strong>`, 'info');
    }
}

function updateSearchResultsCount(filteredCount, totalCount) {
    const searchResults = document.getElementById('search-results-count');
    if (searchResults) {
        if (filteredCount === totalCount) {
            searchResults.textContent = `Showing all ${totalCount} activities`;
        } else {
            searchResults.textContent = `Showing ${filteredCount} of ${totalCount} activities`;
        }
    }
}

function handleEndpointSearch() {
    // Debounce search to avoid too many re-renders
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
        currentPage = 1; // Reset to first page when searching
        renderActivityLog();
    }, 300);
}

function initializeSearch() {
    // Setup search functionality
    const searchContainer = document.getElementById('search-container');
    if (searchContainer) {
        searchContainer.innerHTML = `
            <div class="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/30 mb-6">
                <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <i class="fas fa-search text-indigo-500"></i>
                    Log Aktivitas
                </h3>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Cari Endpoint</label>
                        <input
                            type="text"
                            id="endpoint-search"
                            placeholder="Contoh: 1001, 1002, atau nama gedung..."
                            class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Dari Tanggal</label>
                        <input
                            type="date"
                            id="date-from"
                            class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Sampai Tanggal</label>
                        <input
                            type="date"
                            id="date-to"
                            class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                    </div>
                </div>

                <!-- Quick endpoint search buttons -->
                <div class="mt-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Pencarian Endpoint Offline:</label>
                    <div class="flex flex-wrap gap-2" id="quick-endpoint-buttons">
                        <!-- Will be populated with available endpoints -->
                    </div>
                </div>

                <div class="flex flex-wrap items-center justify-between gap-4 mt-4">
                    <div class="text-sm text-gray-600">
                        <span id="search-results-count">Loading...</span>
                    </div>

                    <div class="flex gap-2">
                        <button
                            onclick="clearSearchFilters()"
                            class="px-4 py-2 text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
                        >
                            <i class="fas fa-times mr-1"></i>Clear Filters
                        </button>
                        <button
                            onclick="showEndpointSummary()"
                            class="px-4 py-2 text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-sm"
                        >
                            <i class="fas fa-chart-bar mr-1"></i>Summary
                        </button>
                    </div>
                </div>
            </div>

            <!-- Pagination Controls Container -->
            <div id="pagination-controls" class="mb-4"></div>
        `;

        // Populate quick endpoint buttons
        populateQuickEndpointButtons();

        // Re-setup event listeners for search
        setupEventListeners();
    }
}

// NEW FEATURE: Populate quick endpoint buttons
function populateQuickEndpointButtons() {
    const container = document.getElementById('quick-endpoint-buttons');
    if (!container) return;

    // Get unique endpoints from logs and nodes
    const endpointsFromLogs = [...new Set(disconnectLogs.map(log => log.endpoint))];
    const endpointsFromNodes = nodes.map(node => node.endpoint).filter(Boolean);
    const allEndpoints = [...new Set([...endpointsFromLogs, ...endpointsFromNodes])];

    // Sort endpoints numerically
    allEndpoints.sort((a, b) => {
        const numA = parseInt(a);
        const numB = parseInt(b);
        if (!isNaN(numA) && !isNaN(numB)) {
            return numA - numB;
        }
        return a.localeCompare(b);
    });

    container.innerHTML = allEndpoints.slice(0, 10).map(endpoint => {
        const totalOffline = getTotalOfflineDuration(endpoint);
        const node = nodes.find(n => n.endpoint === endpoint);
        const currentStatus = node?.status || 'unknown';

        let statusClass = 'bg-gray-100 text-gray-600';
        if (currentStatus === 'online') statusClass = 'bg-green-100 text-green-700';
        else if (currentStatus === 'offline') statusClass = 'bg-red-100 text-red-700';

        return `
            <button
                onclick="searchSpecificEndpoint('${endpoint}')"
                class="px-3 py-2 ${statusClass} hover:shadow-md rounded-lg text-xs transition-all duration-200 border"
                title="Total offline: ${totalOffline.formatted}"
            >
                <div class="font-medium">${endpoint}</div>
                <div class="text-xs opacity-75">${totalOffline.formatted}</div>
            </button>
        `;
    }).join('');

    if (allEndpoints.length > 10) {
        container.innerHTML += `
            <button
                onclick="showAllEndpoints()"
                class="px-3 py-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-lg text-xs transition-colors border border-indigo-200"
            >
                <i class="fas fa-ellipsis-h"></i><br>
                +${allEndpoints.length - 10} lagi
            </button>
        `;
    }
}

// NEW FEATURE: Show all endpoints modal
function showAllEndpoints() {
    const endpointsFromLogs = [...new Set(disconnectLogs.map(log => log.endpoint))];
    const endpointsFromNodes = nodes.map(node => node.endpoint).filter(Boolean);
    const allEndpoints = [...new Set([...endpointsFromLogs, ...endpointsFromNodes])];

    // Sort endpoints numerically
    allEndpoints.sort((a, b) => {
        const numA = parseInt(a);
        const numB = parseInt(b);
        if (!isNaN(numA) && !isNaN(numB)) {
            return numA - numB;
        }
        return a.localeCompare(b);
    });

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';

    modal.innerHTML = `
        <div class="bg-white rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden shadow-2xl">
            <div class="p-6 border-b border-gray-200">
                <div class="flex justify-between items-center">
                    <h2 class="text-2xl font-bold text-gray-800">
                        Semua Endpoint (${allEndpoints.length})
                    </h2>
                    <button onclick="this.closest('.fixed').remove()"
                            class="text-gray-500 hover:text-gray-700 text-2xl p-2">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>

            <div class="p-6 overflow-y-auto max-h-[60vh]">
                <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    ${allEndpoints.map(endpoint => {
                        const totalOffline = getTotalOfflineDuration(endpoint);
                        const node = nodes.find(n => n.endpoint === endpoint);
                        const currentStatus = node?.status || 'unknown';

                        let statusClass = 'bg-gray-100 text-gray-600 border-gray-300';
                        if (currentStatus === 'online') statusClass = 'bg-green-100 text-green-700 border-green-300';
                        else if (currentStatus === 'offline') statusClass = 'bg-red-100 text-red-700 border-red-300';

                        return `
                            <button
                                onclick="searchSpecificEndpoint('${endpoint}'); this.closest('.fixed').remove();"
                                class="p-3 ${statusClass} hover:shadow-lg rounded-lg text-sm transition-all duration-200 border-2"
                            >
                                <div class="font-bold text-lg">${endpoint}</div>
                                <div class="text-xs opacity-75 mt-1">${node?.name || 'Unknown'}</div>
                                <div class="text-xs font-medium mt-1">${totalOffline.formatted}</div>
                                <div class="text-xs capitalize mt-1">${currentStatus}</div>
                            </button>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// NEW FEATURE: Show endpoint summary statistics
function showEndpointSummary() {
    // Calculate summary statistics
    const endpointStats = {};

    disconnectLogs.forEach(log => {
        if (!endpointStats[log.endpoint]) {
            endpointStats[log.endpoint] = {
                endpoint: log.endpoint,
                nodeName: log.nodeName,
                totalEvents: 0,
                offlineEvents: 0,
                onlineEvents: 0,
                totalOfflineMinutes: 0,
                lastActivity: null
            };
        }

        const stats = endpointStats[log.endpoint];
        stats.totalEvents++;

        if (log.to === 'offline') {
            stats.offlineEvents++;
            if (log.offlineDuration) {
                stats.totalOfflineMinutes += log.offlineDuration;
            }
        } else if (log.to === 'online') {
            stats.onlineEvents++;
        }

        if (!stats.lastActivity || new Date(log.time) > new Date(stats.lastActivity)) {
            stats.lastActivity = log.time;
        }
    });

    // Convert to array and sort by total offline time
    const sortedStats = Object.values(endpointStats).sort((a, b) => b.totalOfflineMinutes - a.totalOfflineMinutes);

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';

    modal.innerHTML = `
        <div class="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            <div class="p-6 border-b border-gray-200">
                <div class="flex justify-between items-center">
                    <div>
                        <h2 class="text-2xl font-bold text-gray-800">
                            Ringkasan Endpoint
                        </h2>
                        <p class="text-gray-600 mt-1">Statistik total durasi offline per endpoint</p>
                    </div>
                    <button onclick="this.closest('.fixed').remove()"
                            class="text-gray-500 hover:text-gray-700 text-2xl p-2">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>

            <div class="p-6 overflow-y-auto max-h-[70vh]">
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead class="bg-gray-100 rounded-lg">
                            <tr>
                                <th class="py-3 px-4 text-left font-medium text-gray-700">Rank</th>
                                <th class="py-3 px-4 text-left font-medium text-gray-700">Endpoint</th>
                                <th class="py-3 px-4 text-left font-medium text-gray-700">Gedung</th>
                                <th class="py-3 px-4 text-left font-medium text-gray-700">Total Offline Duration</th>
                                <th class="py-3 px-4 text-left font-medium text-gray-700">Total Events</th>
                                <th class="py-3 px-4 text-left font-medium text-gray-700">Offline Events</th>
                                <th class="py-3 px-4 text-left font-medium text-gray-700">Online Events</th>
                                <th class="py-3 px-4 text-left font-medium text-gray-700">Last Activity</th>
                                <th class="py-3 px-4 text-left font-medium text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sortedStats.map((stats, index) => `
                                <tr class="border-b border-gray-200 hover:bg-gray-50">
                                    <td class="py-3 px-4">
                                        <div class="flex items-center gap-2">
                                            
                                            <span class="font-bold">#${index + 1}</span>
                                        </div>
                                    </td>
                                    <td class="py-3 px-4 font-bold text-indigo-600">${stats.endpoint}</td>
                                    <td class="py-3 px-4">${stats.nodeName}</td>
                                    <td class="py-3 px-4">
                                        <span class="font-bold text-red-600">${formatDuration(stats.totalOfflineMinutes)}</span>
                                        <div class="w-full bg-gray-200 rounded-full h-1 mt-1">
                                            <div class="bg-red-500 h-1 rounded-full" style="width: ${Math.min(stats.totalOfflineMinutes / Math.max(...sortedStats.map(s => s.totalOfflineMinutes)) * 100, 100)}%"></div>
                                        </div>
                                    </td>
                                    <td class="py-3 px-4">
                                        <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                            ${stats.totalEvents}
                                        </span>
                                    </td>
                                    <td class="py-3 px-4">
                                        <span class="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                                            ${stats.offlineEvents}
                                        </span>
                                    </td>
                                    <td class="py-3 px-4">
                                        <span class="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                            ${stats.onlineEvents}
                                        </span>
                                    </td>
                                    <td class="py-3 px-4 text-xs text-gray-500">
                                        ${stats.lastActivity ? formatDateTime(stats.lastActivity, 'full') : 'N/A'}
                                    </td>
                                    <td class="py-3 px-4">
                                        <div class="flex gap-1">
                                            <button
                                                onclick="searchSpecificEndpoint('${stats.endpoint}'); this.closest('.fixed').remove();"
                                                class="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded transition-colors"
                                                title="Filter endpoint ini"
                                            >
                                                <i class="fas fa-filter"></i>
                                            </button>
                                            <button
                                                onclick="showEndpointHistory('${stats.endpoint}')"
                                                class="px-2 py-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 rounded transition-colors"
                                                title="Lihat history detail"
                                            >
                                                <i class="fas fa-history"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                ${sortedStats.length === 0 ? `
                    <div class="text-center py-8 text-gray-500">
                        <i class="fas fa-inbox text-3xl mb-3"></i>
                        <p>Belum ada data statistik endpoint</p>
                    </div>
                ` : ''}
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

function clearSearchFilters() {
    document.getElementById('endpoint-search').value = '';
    document.getElementById('date-from').value = '';
    document.getElementById('date-to').value = '';
    document.getElementById('activity-filter').value = 'all';
    currentPage = 1;
    renderActivityLog();
}

async function showEndpointHistory(endpoint) {
    try {
        // Use existing History API endpoints
        const [historyResponse, statsResponse] = await Promise.all([
            fetch(`/api/history/endpoint/${endpoint}`, { headers: apiHeaders }),
            fetch(`/api/history/endpoint/${endpoint}/stats`, { headers: apiHeaders })
        ]);

        if (!historyResponse.ok || !statsResponse.ok) {
            throw new Error('Failed to fetch endpoint data');
        }

        const history = await historyResponse.json();
        const stats = await statsResponse.json();

        displayEndpointHistoryModal(endpoint, {
            history: history,
            statistics: stats,
            node_name: nodes.find(n => n.endpoint === endpoint)?.name || `Node ${endpoint}`
        });
    } catch (error) {
        console.error('Error fetching endpoint history:', error);
        showNotification('Error loading endpoint history', 'error');
    }
}

function displayEndpointHistoryModal(endpoint, data) {
    const totalOffline = getTotalOfflineDuration(endpoint);

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';

    modal.innerHTML = `
        <div class="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            <div class="p-6 border-b border-gray-200">
                <div class="flex justify-between items-center">
                    <div>
                        <h2 class="text-2xl font-bold text-gray-800">
                            History Endpoint: ${endpoint}
                        </h2>
                        <p class="text-gray-600 mt-1">${data.node_name || 'Unknown Node'}</p>
                        <p class="text-sm text-purple-600 mt-1">
                            <i class="fas fa-clock mr-1"></i>Total Offline Duration: ${totalOffline.formatted}
                        </p>
                    </div>
                    <button onclick="this.closest('.fixed').remove()"
                            class="text-gray-500 hover:text-gray-700 text-2xl p-2">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>

            <div class="p-6 overflow-y-auto max-h-[75vh]">
                <!-- Enhanced Statistics Cards -->
                <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                    <div class="bg-blue-50 p-4 rounded-xl border border-blue-200">
                        <div class="text-sm text-blue-600">Total Events</div>
                        <div class="text-2xl font-bold text-blue-800">${data.statistics?.total_events || 0}</div>
                    </div>
                    <div class="bg-red-50 p-4 rounded-xl border border-red-200">
                        <div class="text-sm text-red-600">Offline Events</div>
                        <div class="text-2xl font-bold text-red-800">${data.statistics?.offline_events || 0}</div>
                    </div>
                    <div class="bg-green-50 p-4 rounded-xl border border-green-200">
                        <div class="text-sm text-green-600">Online Events</div>
                        <div class="text-2xl font-bold text-green-800">${data.statistics?.online_events || 0}</div>
                    </div>
                    <div class="bg-purple-50 p-4 rounded-xl border border-purple-200">
                        <div class="text-sm text-purple-600">Total Offline Time</div>
                        <div class="text-2xl font-bold text-purple-800">${totalOffline.formatted}</div>
                    </div>
                </div>

                <!-- Enhanced Recent History Table -->
                <div class="bg-gray-50 rounded-xl p-4">
                    <h3 class="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
                        <i class="fas fa-history"></i>Recent Activity (Last 50)
                    </h3>

                    ${data.history && data.history.length > 0 ? `
                        <div class="overflow-x-auto">
                            <table class="w-full text-sm">
                                <thead class="bg-gray-100 rounded-lg">
                                    <tr>
                                        <th class="py-3 px-4 text-left font-medium text-gray-700">Time</th>
                                        <th class="py-3 px-4 text-left font-medium text-gray-700">Status Change</th>
                                        <th class="py-3 px-4 text-left font-medium text-gray-700">Duration</th>
                                        <th class="py-3 px-4 text-left font-medium text-gray-700">Description</th>
                                    </tr>
                                </thead>
                                <tbody class="space-y-2">
                                    ${data.history.map((item, index) => {
                                        // Calculate duration to next event for offline periods
                                        let duration = null;
                                        let durationFormatted = null;

                                        if (item.current_status === 'offline') {
                                            const nextItem = data.history[index + 1];
                                            if (nextItem) {
                                                const currentTime = new Date(item.timestamp || item.created_at);
                                                const nextTime = new Date(nextItem.timestamp || nextItem.created_at);
                                                const durationMs = nextTime - currentTime;
                                                duration = Math.floor(durationMs / (1000 * 60));
                                                durationFormatted = formatDuration(duration);
                                            } else {
                                                // Still offline, calculate to current time
                                                const currentTime = new Date(item.timestamp || item.created_at);
                                                const now = new Date();
                                                const durationMs = now - currentTime;
                                                duration = Math.floor(durationMs / (1000 * 60));
                                                durationFormatted = formatDuration(duration) + ' (ongoing)';
                                            }
                                        }

                                        return `
                                            <tr class="border-b border-gray-200 hover:bg-white">
                                                <td class="py-3 px-4 text-gray-800">
                                                    ${formatDateTime(item.timestamp || item.created_at, 'full')}
                                                </td>
                                                <td class="py-3 px-4">
                                                    <span class="px-2 py-1 rounded-full text-xs font-medium ${
                                                        item.current_status === 'offline' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                                    }">
                                                        ${item.previous_status} → ${item.current_status}
                                                    </span>
                                                </td>
                                                <td class="py-3 px-4">
                                                    ${durationFormatted ? `
                                                        <span class="px-2 py-1 rounded-full text-xs font-medium ${
                                                            item.current_status === 'offline' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
                                                        }">
                                                            <i class="fas fa-clock mr-1"></i>${durationFormatted}
                                                        </span>
                                                    ` : '<span class="text-gray-400">-</span>'}
                                                </td>
                                                <td class="py-3 px-4 text-gray-600">${item.description}</td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    ` : `
                        <div class="text-center py-8 text-gray-500">
                            <i class="fas fa-inbox text-3xl mb-3"></i>
                            <p>No history data available for this endpoint</p>
                        </div>
                    `}
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

function getPopupContent(node, color) {
    return `
        <div>
            <strong>${node.name}</strong><br>
            <span style="color: ${color}">Status: ${formatDisplayStatus(node.status)}</span><br>
            IP: ${node.ip}<br>
            Endpoint: ${node.endpoint}
        </div>
    `;
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full`;

    const colors = {
        success: 'bg-white text-green-500',
        error: 'bg-white text-red-500',
        warning: 'bg-white text-yellow-600',
        info: 'bg-white text-blue-500'
    };

    notification.className += ` ${colors[type] || colors.info}`;
    notification.innerHTML = `
        <div class="flex items-center gap-2">
            <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation-triangle' : 'info'}-circle"></i>
            <span>${message}</span>
        </div>
    `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);

    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// Device History Tracker Class - Updated to use History API
class DeviceHistoryTracker {
    constructor() {
        this.previousStates = new Map();
        this.historyCache = new Map();
        this.init();
    }

    init() {
        console.log('Device History Tracker initialized');

        // Initialize previous states from current nodes
        if (nodes && nodes.length > 0) {
            this.initializePreviousStates(nodes);
        }
    }

    initializePreviousStates(nodesList) {
        nodesList.forEach(node => {
            if (node.endpoint) {
                this.previousStates.set(node.endpoint, normalizeStatus(node.status));
            }
        });
        console.log('Initialized previous states for', this.previousStates.size, 'endpoints');
    }

    async handleStatusChange(endpoint, newStatus, timestamp = null) {
        try {
            const previousStatus = this.previousStates.get(endpoint);
            const currentTimestamp = timestamp || new Date().toISOString();

            if (previousStatus !== newStatus) {
                console.log(`Status change detected for ${endpoint}: ${previousStatus} → ${newStatus}`);

                // Update our local state
                this.previousStates.set(endpoint, newStatus);

                // Send to backend for database storage using History API
                await this.sendStatusUpdate(endpoint, newStatus, currentTimestamp, previousStatus);
            }
        } catch (error) {
            console.error('Error handling status change:', error);
        }
    }

    async sendStatusUpdate(endpoint, status, timestamp, previousStatus = null) {
        try {
            const node = nodes.find(n => n.endpoint === endpoint);
            const response = await fetch('/api/history/update-status', {
                method: 'POST',
                headers: apiHeaders,
                body: JSON.stringify({
                    endpoint: endpoint,
                    node_name: node?.name || `Node ${endpoint}`,
                    previous_status: previousStatus,
                    current_status: status,
                    timestamp: timestamp,
                    description: getStatusDescription(previousStatus, status)
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Status update sent successfully:', result);
        } catch (error) {
            console.error('Error sending status update:', error);
            this.queueRetry(endpoint, status, timestamp, previousStatus);
        }
    }

    queueRetry(endpoint, status, timestamp, previousStatus) {
        setTimeout(() => {
            this.sendStatusUpdate(endpoint, status, timestamp, previousStatus);
        }, 5000);
    }

    async getHistory(endpoint, limit = 50) {
        try {
            const cacheKey = `${endpoint}_${limit}`;

            if (this.historyCache.has(cacheKey)) {
                const cached = this.historyCache.get(cacheKey);
                if (Date.now() - cached.timestamp < 300000) {
                    return cached.data;
                }
            }

            // Use existing History API endpoints
            const [historyResponse, statsResponse] = await Promise.all([
                fetch(`/api/history/endpoint/${endpoint}?limit=${limit}`, { headers: apiHeaders }),
                fetch(`/api/history/endpoint/${endpoint}/stats`, { headers: apiHeaders })
            ]);

            if (!historyResponse.ok || !statsResponse.ok) {
                throw new Error('Failed to fetch endpoint data');
            }

            const history = await historyResponse.json();
            const statistics = await statsResponse.json();

            const data = {
                endpoint,
                history,
                statistics,
                total: history.length
            };

            this.historyCache.set(cacheKey, {
                data: data,
                timestamp: Date.now()
            });

            return data;
        } catch (error) {
            console.error('Error fetching history:', error);
            return { endpoint, history: [], statistics: {}, total: 0 };
        }
    }

    clearCache() {
        this.historyCache.clear();
        console.log('History cache cleared');
    }
}

// Phone Monitoring Class - Updated with real backend data and FIXED TIME FORMAT
class PhoneMonitoring {
    constructor() {
        this.currentFilter = 'all';
        this.currentActivityFilter = 'all';
        this.init();
    }

    init() {
        this.initLogboard();
    }

    get phoneData() {
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

        const currentPhoneData = this.phoneData;
        const filteredPhones = status === 'all' ? currentPhoneData :
            currentPhoneData.filter(phone => phone.status === status);

        this.updateFilterInfo(status, filteredPhones.length, currentPhoneData.length);

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

        const filterStatusEl = document.getElementById('filter-status');
        if (filterStatusEl) {
            filterStatusEl.textContent = filterStatus[status] || 'Filter tidak dikenal';
        }

        const filterPhonesEl = document.getElementById('filterPhones');
        if (filterPhonesEl) {
            filterPhonesEl.textContent = filteredCount;
        }

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
        const totalOffline = getTotalOfflineDuration(phone.endpoint);

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

                    <!-- Enhanced offline duration display -->
                    <div class="flex justify-between items-center text-xs">
                        <span class="text-gray-500">Total Offline:</span>
                        <span class="text-purple-600 font-bold">${totalOffline.formatted}</span>
                    </div>

                    ${!isOnline ? `
                        <div class="flex justify-between items-center text-xs">
                            <span class="text-gray-500">Current Offline:</span>
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

                    <div class="mt-3 pt-2 border-t border-gray-100">
                        <div class="flex gap-1">
                            <button
                                onclick="showEndpointHistory('${phone.endpoint}')"
                                class="flex-1 text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 py-1 px-2 rounded-lg transition-colors"
                            >
                                <i class="fas fa-chart-line mr-1"></i>History
                            </button>
                            <button
                                onclick="searchSpecificEndpoint('${phone.endpoint}')"
                                class="flex-1 text-xs text-purple-600 hover:text-purple-800 hover:bg-purple-50 py-1 px-2 rounded-lg transition-colors"
                            >
                                <i class="fas fa-filter mr-1"></i>Filter
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    initLogboard() {
        const phoneGrid = document.getElementById('phone-grid');
        if (phoneGrid) {
            const currentPhoneData = this.phoneData;
            phoneGrid.innerHTML = currentPhoneData.map(phone => this.generatePhoneCard(phone)).join('');
            this.updateFilterInfo('all', currentPhoneData.length, currentPhoneData.length);
        }

        renderActivityLog();
    }

    updateLogboard() {
        this.initLogboard();
        this.filterPhones(this.currentFilter);
    }
}

// Additional utility function to get offline phones using existing API
async function getCurrentOfflinePhones() {
    try {
        const response = await fetch('/api/history/offline', { headers: apiHeaders });
        if (response.ok) {
            const offlinePhones = await response.json();
            console.log('Current offline phones:', offlinePhones);
            return offlinePhones;
        }
    } catch (error) {
        console.error('Error fetching offline phones:', error);
    }
    return [];
}

// Global functions for HTML onclick events
window.filterPhones = function(status) {
    if (phoneMonitoring) {
        phoneMonitoring.filterPhones(status);
    }
};

window.filterActivities = function() {
    renderActivityLog();
};

window.showEndpointHistory = showEndpointHistory;
window.clearSearchFilters = clearSearchFilters;
window.getCurrentOfflinePhones = getCurrentOfflinePhones;
window.searchSpecificEndpoint = searchSpecificEndpoint;
window.goToPage = goToPage;
window.showAllEndpoints = showAllEndpoints;
window.showEndpointSummary = showEndpointSummary;
window.getTotalOfflineDuration = getTotalOfflineDuration;

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

    // Update quick endpoint buttons when data changes
    const originalRenderActivityLog = renderActivityLog;
    renderActivityLog = function() {
        originalRenderActivityLog();
        populateQuickEndpointButtons();
    };
}

// Export for global access
Object.assign(window, {
    phoneMonitoring,
    deviceHistoryTracker,
    fetchNodes,
    renderActivityLog,
    updateRealtimeStats,
    showNotification,
    getCurrentOfflinePhones,
    calculateLogDurations,
    formatDuration,
    populateQuickEndpointButtons,
    formatDateTime,
    formatRelativeTime
});