// resources/js/logs.js
import { io } from 'socket.io-client';

let socket;
let nodes = [];
let disconnectLogs = [];
let latestStatus = [];
let markers = {};
let previousStatusMap = {};
let deviceHistoryTracker;
let phoneMonitoring;
let currentPage = 1;
let itemsPerPage = 10;
let totalPages = 1;
let filteredLogs = [];

const apiHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
};

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

        return formatDateTime(dateString, 'short');
    } catch (error) {
        console.error('Error calculating relative time:', error);
        return formatDateTime(dateString, 'short');
    }
}

// Uptime Calculation
function calculateRealUptime(endpoint, timeRangeHours = 24) {
    const endpointLogs = disconnectLogs
        .filter(log => log.endpoint === endpoint)
        .sort((a, b) => new Date(a.time) - new Date(b.time));

    if (endpointLogs.length === 0) {
            return {
            uptimePercentage: 0,
            totalMinutes: timeRangeHours * 60,
            onlineMinutes: 0,
            offlineMinutes: 0,
            dataAvailable: false
        };
    }

    const now = new Date();
    const rangeStart = new Date(now.getTime() - (timeRangeHours * 60 * 60 * 1000));

    // Filter logs within the time range
    const logsInRange = endpointLogs.filter(log => {
        const logTime = new Date(log.time);
        return logTime >= rangeStart && logTime <= now;
    });

    // If no logs in range, check the last known status before the range
    if (logsInRange.length === 0) {
        const lastLogBeforeRange = endpointLogs
            .filter(log => new Date(log.time) < rangeStart)
            .pop();

        if (lastLogBeforeRange) {
            const totalMinutes = timeRangeHours * 60;
            if (lastLogBeforeRange.to === 'online') {
                return {
                    uptimePercentage: 100,
                    totalMinutes: totalMinutes,
                    onlineMinutes: totalMinutes,
                    offlineMinutes: 0,
                    dataAvailable: true,
                    assumption: 'Assumed online based on last known status'
                };
            } else {
                return {
                    uptimePercentage: 0,
                    totalMinutes: totalMinutes,
                    onlineMinutes: 0,
                    offlineMinutes: totalMinutes,
                    dataAvailable: true,
                    assumption: 'Assumed offline based on last known status'
                };
            }
        }

        // No data at all
        return {
            uptimePercentage: 0,
            totalMinutes: timeRangeHours * 60,
            onlineMinutes: 0,
            offlineMinutes: 0,
            dataAvailable: false
        };
    }

    let totalOfflineMinutes = 0;
    let totalOnlineMinutes = 0;

    // Get initial status for the calculation period
    let currentStatus = 'unknown';
    const lastLogBeforeRange = endpointLogs
        .filter(log => new Date(log.time) < rangeStart)
        .pop();

    if (lastLogBeforeRange) {
        currentStatus = lastLogBeforeRange.to;
    } else if (logsInRange.length > 0) {
        currentStatus = logsInRange[0].from || 'online';
    }

    let lastTimestamp = rangeStart;

    // Process each status change in the time range
    logsInRange.forEach((log, index) => {
        const logTime = new Date(log.time);
        const durationMinutes = Math.floor((logTime - lastTimestamp) / (1000 * 60));

        if (currentStatus === 'online') {
            totalOnlineMinutes += durationMinutes;
        } else if (currentStatus === 'offline') {
            totalOfflineMinutes += durationMinutes;
        }

        // Update current status and timestamp
        currentStatus = log.to;
        lastTimestamp = logTime;
    });

    // Handle the final period from last status change to now
    const finalDurationMinutes = Math.floor((now - lastTimestamp) / (1000 * 60));
    if (currentStatus === 'online') {
        totalOnlineMinutes += finalDurationMinutes;
    } else if (currentStatus === 'offline') {
        totalOfflineMinutes += finalDurationMinutes;
    }

    const totalMinutes = timeRangeHours * 60;
    const accountedMinutes = totalOnlineMinutes + totalOfflineMinutes;

    const unaccountedMinutes = Math.max(0, totalMinutes - accountedMinutes);
    if (unaccountedMinutes > 0) {
        totalOnlineMinutes += unaccountedMinutes;
    }

    const uptimePercentage = totalMinutes > 0 ?
        Math.round((totalOnlineMinutes / totalMinutes) * 100) : 0;

    return {
        uptimePercentage,
        totalMinutes: totalMinutes,
        onlineMinutes: totalOnlineMinutes,
        offlineMinutes: totalOfflineMinutes,
        dataAvailable: true,
        logsProcessed: logsInRange.length,
        currentStatus: currentStatus
    };
}

function calculateUptimeForAllPeriods(endpoint) {
    return {
        last24h: calculateRealUptime(endpoint, 24),
        last7d: calculateRealUptime(endpoint, 24 * 7),
        last30d: calculateRealUptime(endpoint, 24 * 30)
    };
}

function getUptimeDisplay(endpoint, period = '24h') {
    const uptimeData = calculateUptimeForAllPeriods(endpoint);

    switch (period) {
        case '7d':
            return uptimeData.last7d;
        case '30d':
            return uptimeData.last30d;
        case '24h':
        default:
            return uptimeData.last24h;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    try {

        await fetchNodes();
        deviceHistoryTracker = new DeviceHistoryTracker();
        initializeSocket();
        initializePhoneMonitoring();
        setupEventListeners();
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

        await loadActivityLogsFromDatabase();

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
                nodeName: log.node_name || log.endpoint,
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

// Calculate duration between status changes
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

// Get total offline duration for specific endpoint
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
            timeout: 5000,
            auth: { token: window.userToken }
            // Add authentication token
            // auth: {
            //     token: 'pindad_123'  // Add the required token
            // }
        });

        socket.on('connect', () => {
            console.log('Connected to Socket.IO server:', socket.id);
            socketConnected = true;
            showNotification('Real-Time connection established', 'success');
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

        socket.on('server-info', (info) => {
            console.log('Server info:', info);
            showNotification('Connected to device monitoring server', 'success');
        });

        socket.on('server-error', (error) => {
            console.warn('Server error:', error);
            showNotification('Server API temporarily unavailable', 'warning');
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from Socket.IO server');
            socketConnected = false;
            showNotification('Server disconnected', 'warning');
        });

        socket.on('connect_error', (error) => {
            console.error(`Server connection error for ${url}:`, error);

            // Show specific error message for authentication
            if (error.message === 'Unauthorized') {
                showNotification('Authentication failed - invalid token', 'error');
                return; // Don't try other URLs for auth errors
            }

            if (!socketConnected) {
                tryConnect(urlIndex + 1);
            }
        });

        // Handle authentication errors specifically
        socket.on('error', (error) => {
            console.error('Socket error:', error);
            if (error === 'Unauthorized') {
                showNotification('Authentication failed - check token', 'error');
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
                node_name: node?.name || endpoint,
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
                nodeName: node?.name || endpoint,
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

// Go to specific page
function goToPage(page) {
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderActivityLog();
}

// Search for specific endpoint
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
                            onclick="showPdfExportModal()"
                            class="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm"
                        >
                            <i class="fas fa-download mr-1"></i>Export PDF
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

// Populate quick endpoint buttons offline
function populateQuickEndpointButtons() {
    const container = document.getElementById('quick-endpoint-buttons');
    if (!container) return;

    // Put endpoint offline
    const offlineEndpoints = nodes
        .filter(node => normalizeStatus(node.status) === 'offline')
        .map(node => node.endpoint)
        .filter(Boolean);

    // Put endpoint from logs off
    const endpointsFromLogs = [...new Set(
        disconnectLogs
            .filter(log => log.status === 'offline')
            .map(log => log.endpoint)
    )];

    const allOfflineEndpoints = [...new Set([...offlineEndpoints, ...endpointsFromLogs])];

    // Sorting
    allOfflineEndpoints.sort((a, b) => {
        const numA = parseInt(a);
        const numB = parseInt(b);
        if (!isNaN(numA) && !isNaN(numB)) {
            return numA - numB;
        }
        return a.localeCompare(b);
    });

    container.innerHTML = allOfflineEndpoints.slice(0, 10).map(endpoint => {
        const totalOffline = getTotalOfflineDuration(endpoint);
        return `
            <button
                onclick="searchSpecificEndpoint('${endpoint}')"
                class="px-3 py-2 bg-red-100 text-red-700 hover:shadow-md rounded-lg text-xs transition-all duration-200 border"
                title="Total offline: ${totalOffline.formatted}"
            >
                <div class="font-medium">${endpoint}</div>
                <div class="text-xs opacity-75">${totalOffline.formatted}</div>
            </button>
        `;
    }).join('');

    if (allOfflineEndpoints.length > 10) {
        container.innerHTML += `
            <button
                onclick="showAllEndpoints()"
                class="px-3 py-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-lg text-xs transition-colors border border-indigo-200"
            >
                <i class="fas fa-ellipsis-h"></i><br>
                +${allOfflineEndpoints.length - 10} lagi
            </button>
        `;
    }
}

// Show all endpoints modal
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
                        const uptimeData = getUptimeDisplay(endpoint, '24h');

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
                                <div class="text-xs font-medium mt-1">Offline: ${totalOffline.formatted}</div>
                                <div class="text-xs font-medium mt-1 text-blue-600">Uptime: ${uptimeData.uptimePercentage}%</div>
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

// Show endpoint summary statistics
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

    // Add uptime calculations for each endpoint
    Object.keys(endpointStats).forEach(endpoint => {
        const uptimeData = getUptimeDisplay(endpoint, '24h');
        endpointStats[endpoint].uptime24h = uptimeData.uptimePercentage;
        endpointStats[endpoint].uptimeData = uptimeData;
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
                        <p class="text-gray-600 mt-1">Statistik total durasi offline dan uptime per endpoint</p>
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
                                <th class="py-3 px-4 text-left font-medium text-gray-700">24h Uptime</th>
                                <th class="py-3 px-4 text-left font-medium text-gray-700">Total Offline Duration</th>
                                <th class="py-3 px-4 text-left font-medium text-gray-700">Total Events</th>
                                <th class="py-3 px-4 text-left font-medium text-gray-700">Offline Events</th>
                                <th class="py-3 px-4 text-left font-medium text-gray-700">Online Events</th>
                                <th class="py-3 px-4 text-left font-medium text-gray-700">Last Activity</th>
                                <th class="py-3 px-4 text-left font-medium text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sortedStats.map((stats, index) => {
                                const uptimeColor = stats.uptime24h >= 95 ? 'text-green-600' :
                                                  stats.uptime24h >= 80 ? 'text-yellow-600' : 'text-red-600';
                                const uptimeBgColor = stats.uptime24h >= 95 ? 'bg-green-100' :
                                                     stats.uptime24h >= 80 ? 'bg-yellow-100' : 'bg-red-100';

                                return `
                                    <tr class="border-b border-gray-200 hover:bg-gray-50">
                                        <td class="py-3 px-4">
                                            <div class="flex items-center gap-2">
                                                <span class="font-bold">#${index + 1}</span>
                                            </div>
                                        </td>
                                        <td class="py-3 px-4 font-bold text-indigo-600">${stats.endpoint}</td>
                                        <td class="py-3 px-4">${stats.nodeName}</td>
                                        <td class="py-3 px-4">
                                            <div class="flex items-center gap-2">
                                                <span class="font-bold ${uptimeColor} px-2 py-1 ${uptimeBgColor} rounded-full text-xs">
                                                    ${stats.uptime24h}%
                                                </span>
                                                <div class="w-16 bg-gray-200 rounded-full h-1">
                                                    <div class="bg-green-500 h-1 rounded-full" style="width: ${stats.uptime24h}%"></div>
                                                </div>
                                            </div>
                                            ${stats.uptimeData.dataAvailable ? '' : '<div class="text-xs text-gray-400">No data</div>'}
                                        </td>
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
                                `;
                            }).join('')}
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
            node_name: nodes.find(n => n.endpoint === endpoint)?.name || endpoint
        });
    } catch (error) {
        console.error('Error fetching endpoint history:', error);
        showNotification('Error loading endpoint history', 'error');
    }
}

function displayEndpointHistoryModal(endpoint, data) {
    const totalOffline = getTotalOfflineDuration(endpoint);
    const uptimeData = calculateUptimeForAllPeriods(endpoint);

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
                        <div class="flex flex-wrap gap-4 mt-2 text-sm">
                            <p class="text-purple-600">
                                <i class="fas fa-clock mr-1"></i>Total Offline: ${totalOffline.formatted}
                            </p>
                            <p class="text-blue-600">
                                <i class="fas fa-chart-line mr-1"></i>24h Uptime: ${uptimeData.last24h.uptimePercentage}%
                            </p>
                            <p class="text-green-600">
                                <i class="fas fa-calendar-week mr-1"></i>7d Uptime: ${uptimeData.last7d.uptimePercentage}%
                            </p>
                            <p class="text-indigo-600">
                                <i class="fas fa-calendar-alt mr-1"></i>30d Uptime: ${uptimeData.last30d.uptimePercentage}%
                            </p>
                        </div>
                    </div>
                    <button onclick="this.closest('.fixed').remove()"
                            class="text-gray-500 hover:text-gray-700 text-2xl p-2">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>

            <div class="p-6 overflow-y-auto max-h-[75vh]">
                <!-- Enhanced Statistics Cards -->
                <div class="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
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
                        <div class="text-sm text-purple-600">Total Offline</div>
                        <div class="text-2xl font-bold text-purple-800">${totalOffline.formatted}</div>
                    </div>
                    <div class="bg-indigo-50 p-4 rounded-xl border border-indigo-200">
                        <div class="text-sm text-indigo-600">24h Uptime</div>
                        <div class="text-2xl font-bold text-indigo-800">${uptimeData.last24h.uptimePercentage}%</div>
                        <div class="w-full bg-gray-200 rounded-full h-1 mt-1">
                            <div class="bg-indigo-500 h-1 rounded-full" style="width: ${uptimeData.last24h.uptimePercentage}%"></div>
                        </div>
                    </div>
                    <div class="bg-teal-50 p-4 rounded-xl border border-teal-200">
                        <div class="text-sm text-teal-600">7d Uptime</div>
                        <div class="text-2xl font-bold text-teal-800">${uptimeData.last7d.uptimePercentage}%</div>
                        <div class="w-full bg-gray-200 rounded-full h-1 mt-1">
                            <div class="bg-teal-500 h-1 rounded-full" style="width: ${uptimeData.last7d.uptimePercentage}%"></div>
                        </div>
                    </div>
                </div>

                <!-- Uptime Details -->
                <div class="bg-gray-50 rounded-xl p-4 mb-6">
                    <h4 class="text-lg font-semibold mb-3 text-gray-800 flex items-center gap-2">
                        <i class="fas fa-chart-bar"></i>Uptime Analysis
                    </h4>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="bg-white p-3 rounded-lg border">
                            <div class="text-sm font-medium text-gray-700 mb-2">Last 24 Hours</div>
                            <div class="text-lg font-bold ${uptimeData.last24h.uptimePercentage >= 95 ? 'text-green-600' : uptimeData.last24h.uptimePercentage >= 80 ? 'text-yellow-600' : 'text-red-600'}">${uptimeData.last24h.uptimePercentage}%</div>
                            <div class="text-xs text-gray-500 mt-1">
                                Online: ${formatDuration(uptimeData.last24h.onlineMinutes)} |
                                Offline: ${formatDuration(uptimeData.last24h.offlineMinutes)}
                            </div>
                            ${!uptimeData.last24h.dataAvailable ? '<div class="text-xs text-orange-500">No data available</div>' : ''}
                        </div>
                        <div class="bg-white p-3 rounded-lg border">
                            <div class="text-sm font-medium text-gray-700 mb-2">Last 7 Days</div>
                            <div class="text-lg font-bold ${uptimeData.last7d.uptimePercentage >= 95 ? 'text-green-600' : uptimeData.last7d.uptimePercentage >= 80 ? 'text-yellow-600' : 'text-red-600'}">${uptimeData.last7d.uptimePercentage}%</div>
                            <div class="text-xs text-gray-500 mt-1">
                                Online: ${formatDuration(uptimeData.last7d.onlineMinutes)} |
                                Offline: ${formatDuration(uptimeData.last7d.offlineMinutes)}
                            </div>
                            ${!uptimeData.last7d.dataAvailable ? '<div class="text-xs text-orange-500">No data available</div>' : ''}
                        </div>
                        <div class="bg-white p-3 rounded-lg border">
                            <div class="text-sm font-medium text-gray-700 mb-2">Last 30 Days</div>
                            <div class="text-lg font-bold ${uptimeData.last30d.uptimePercentage >= 95 ? 'text-green-600' : uptimeData.last30d.uptimePercentage >= 80 ? 'text-yellow-600' : 'text-red-600'}">${uptimeData.last30d.uptimePercentage}%</div>
                            <div class="text-xs text-gray-500 mt-1">
                                Online: ${formatDuration(uptimeData.last30d.onlineMinutes)} |
                                Offline: ${formatDuration(uptimeData.last30d.offlineMinutes)}
                            </div>
                            ${!uptimeData.last30d.dataAvailable ? '<div class="text-xs text-orange-500">No data available</div>' : ''}
                        </div>
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
/**
 * Export PDF Report with options - Fixed Version
 */
/**
 * Animate text updates
 */
function animateTextUpdate(element, newText) {
    if (!element) return;

    element.style.opacity = '0.5';
    element.style.transform = 'scale(0.95)';
    element.style.transition = 'all 0.2s ease-in-out';

    setTimeout(() => {
        element.textContent = newText;
        element.style.opacity = '1';
        element.style.transform = 'scale(1)';
    }, 100);
}

/**
 * PERBAIKAN: Setup enhanced date event listeners dengan proper debouncing
 */
function setupDateEventListeners() {
    const startDateInput = document.querySelector('input[name="start_date"]');
    const endDateInput = document.querySelector('input[name="end_date"]');

    if (startDateInput && endDateInput) {
        // Debounced event handlers for better performance
        const debouncedStartHandler = debounce(() => handleDateChange('start'), 300);
        const debouncedEndHandler = debounce(() => handleDateChange('end'), 300);

        startDateInput.addEventListener('change', debouncedStartHandler);
        endDateInput.addEventListener('change', debouncedEndHandler);

        // Also listen for input events for real-time updates
        startDateInput.addEventListener('input', debounce(() => handleDateChange('start'), 500));
        endDateInput.addEventListener('input', debounce(() => handleDateChange('end'), 500));
    }

    // Setup period and timeframe change handlers
    const periodSelect = document.querySelector('select[name="period"]');
    const timeframeSelect = document.querySelector('select[name="timeframe"]');
    const quarterSelect = document.querySelector('select[name="quarter"]');
    const yearSelect = document.querySelector('select[name="year"]');

    if (periodSelect) {
        periodSelect.addEventListener('change', debounce(updatePdfPreviewStats, 300));
    }

    if (timeframeSelect) {
        timeframeSelect.addEventListener('change', debounce(updatePdfPreviewStats, 300));
    }

    if (quarterSelect) {
        quarterSelect.addEventListener('change', debounce(updatePdfPreviewStats, 300));
    }

    if (yearSelect) {
        yearSelect.addEventListener('change', debounce(updatePdfPreviewStats, 300));
    }
}

/**
 * Debounce utility function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * PERBAIKAN: Enhanced PDF export handler dengan format tanggal yang benar
 */
async function handlePdfExport(format = 'download') {
    const form = document.getElementById('pdf-export-form');
    const exportBtn = document.getElementById('pdf-export-btn');

    if (!form) {
        showNotification('Form tidak ditemukan', 'error');
        return;
    }

    // Prevent multiple simultaneous exports
    if (PDFExportState.isProcessing) {
        showNotification('Export sedang diproses, mohon tunggu...', 'info');
        return;
    }

    try {
        PDFExportState.isProcessing = true;

        // Update button state
        updateExportButtonState(exportBtn, true);

        const formData = new FormData(form);
        const dateMethod = formData.get('dateMethod');

        // Enhanced form validation
        const validationResult = await validatePdfFormEnhanced(formData, dateMethod);
        if (!validationResult.isValid) {
            showNotification(validationResult.message, 'warning');
            return;
        }

        // Show progress notification
        showNotification('Mempersiapkan data laporan...', 'info');

        // Generate chart if needed
        let chartResult = null;
        if (formData.get('include_chart') !== null) {
            try {
                showNotification('Membuat chart analisis...', 'info');
                chartResult = await generateUptimeChart();
                showNotification('Chart berhasil dibuat, memproses PDF...', 'info');
            } catch (chartError) {
                console.error('Chart generation failed:', chartError);
                showNotification('Melanjutkan tanpa chart...', 'warning');
            }
        }

        // Build comprehensive options object
        const options = await buildExportOptions(formData, dateMethod, chartResult);

        console.log('PDF Export Options:', options);

        // Close modal
        const modal = form.closest('.fixed');
        if (modal) {
            closePdfModal(modal.querySelector('button'));
        }

        // Final progress notification
        const processingMsg = format === 'download' ?
            'Mengunduh laporan PDF... Estimasi: 15-45 detik' :
            'Membuka preview PDF... Estimasi: 15-45 detik';

        showNotification(processingMsg, 'info');

        // Execute export
        await exportPdfReportOptimized(options);

    } catch (error) {
        console.error('Error in handlePdfExport:', error);
        showNotification('Terjadi kesalahan: ' + error.message, 'error');
    } finally {
        PDFExportState.isProcessing = false;
        updateExportButtonState(exportBtn, false);
    }
}

/**
 * Update export button state
 */
function updateExportButtonState(button, isProcessing) {
    if (!button) return;

    if (isProcessing) {
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Memproses...';
        button.classList.add('opacity-75', 'cursor-not-allowed');
    } else {
        button.disabled = false;
        button.innerHTML = '<i class="fas fa-download mr-1"></i>Download PDF';
        button.classList.remove('opacity-75', 'cursor-not-allowed');
    }
}

/**
 * Enhanced form validation with comprehensive checks
 */
async function validatePdfFormEnhanced(formData, dateMethod) {
    try {
        // Required field validation
        const requiredFields = {
            'indikator': 'Indikator KPI',
            'nama_indikator': 'Nama Indikator',
            'target': 'Target KPI',
            'prepared_nama': 'Nama Penyusun'
        };

        for (const [field, label] of Object.entries(requiredFields)) {
            const value = formData.get(field);
            if (!value || value.trim() === '') {
                return {
                    isValid: false,
                    message: `Field "${label}" harus diisi`
                };
            }
        }

        // Date validation for custom method
        if (dateMethod === 'custom') {
            const startDate = formData.get('start_date');
            const endDate = formData.get('end_date');

            if (!startDate || !endDate) {
                return {
                    isValid: false,
                    message: 'Tanggal mulai dan akhir harus diisi untuk periode custom'
                };
            }

            const start = new Date(startDate);
            const end = new Date(endDate);

            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                return {
                    isValid: false,
                    message: 'Format tanggal tidak valid'
                };
            }

            const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;

            if (start > end) {
                return {
                    isValid: false,
                    message: 'Tanggal mulai tidak boleh lebih besar dari tanggal akhir'
                };
            }

            if (daysDiff > PDF_CONFIG.MAX_DATE_RANGE) {
                return {
                    isValid: false,
                    message: `Periode maksimal ${PDF_CONFIG.MAX_DATE_RANGE} hari. Periode saat ini: ${daysDiff} hari`
                };
            }
        }

        return { isValid: true, message: 'Valid' };

    } catch (error) {
        console.error('Validation error:', error);
        return {
            isValid: false,
            message: 'Error validasi form: ' + error.message
        };
    }
}

/**
 * Generate optimized uptime chart for PDF
 */
async function generateUptimeChart() {
    try {
        // Check if we already have chart data cached
        const cacheKey = PDF_CONFIG.CHART_CACHE_KEY;
        const cached = PDFExportState.getCachedData(cacheKey);

        if (cached) {
            return cached;
        }

        // Get current form data for date range
        const form = document.getElementById('pdf-export-form');
        const formData = new FormData(form);
        const dateParams = extractDateParameters(formData);

        // Try to fetch real-time chart data
        let chartData;
        try {
            const response = await fetch('/api/chart-data?' + new URLSearchParams(dateParams), {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                }
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data) {
                    chartData = result.data;
                }
            }
        } catch (apiError) {
            console.warn('API chart data fetch failed, using fallback');
        }

        // Fallback to calculated data if API fails
        if (!chartData) {
            chartData = await calculateChartDataFallback();
        }

        // Generate chart image
        const chartImage = await createChartImageOptimized(chartData);

        const result = {
            chartImage: chartImage,
            chartData: chartData
        };

        // Cache the result
        PDFExportState.setCachedData(cacheKey, result);

        return result;

    } catch (error) {
        console.error('Error generating optimized chart:', error);
        throw new Error('Failed to generate chart: ' + error.message);
    }
}

/**
 * Extract date parameters from form data
 */
function extractDateParameters(formData) {
    const dateMethod = formData.get('dateMethod') || 'preset';
    const params = {
        date_method: dateMethod,
        quarter: formData.get('quarter') || 'IV',
        year: formData.get('year') || new Date().getFullYear().toString(),
        timeframe: formData.get('timeframe') || 'days'
    };

    if (dateMethod === 'custom') {
        params.start_date = formData.get('start_date');
        params.end_date = formData.get('end_date');
    } else {
        params.period = formData.get('period') || PDF_CONFIG.DEFAULT_PERIOD.toString();
    }

    return params;
}

/**
 * Calculate fallback chart data
 */
async function calculateChartDataFallback() {
    try {
        const uptimeData = await getUptimeDataAsync();

        const totalPossibleUptime = uptimeData.total_devices * 100;
        const actualUptime = uptimeData.total_uptime || (uptimeData.uptime_percentage / 100 * totalPossibleUptime);
        const actualDowntime = totalPossibleUptime - actualUptime;

        return {
            total_devices: uptimeData.total_devices,
            total_possible_uptime: totalPossibleUptime,
            actual_uptime: actualUptime,
            actual_downtime: actualDowntime,
            uptime_percentage: uptimeData.uptime_percentage,
            downtime_percentage: 100 - uptimeData.uptime_percentage
        };
    } catch (error) {
        console.error('Error calculating fallback chart data:', error);
        return {
            total_devices: 10,
            total_possible_uptime: 1000,
            actual_uptime: 800,
            actual_downtime: 200,
            uptime_percentage: 80,
            downtime_percentage: 20
        };
    }
}

/**
 * Create optimized chart image
 */
async function createChartImageOptimized(chartData) {
    return new Promise((resolve, reject) => {
        try {
            // Create temporary canvas for chart generation
            const canvas = document.createElement('canvas');
            canvas.width = 400;
            canvas.height = 400;
            canvas.style.display = 'none';
            document.body.appendChild(canvas);

            const ctx = canvas.getContext('2d');

            // Create chart with optimized settings
            const chart = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: [
                        `Uptime (${chartData.uptime_percentage.toFixed(1)}%)`,
                        `Downtime (${chartData.downtime_percentage.toFixed(1)}%)`
                    ],
                    datasets: [{
                        data: [chartData.actual_uptime, chartData.actual_downtime],
                        backgroundColor: [
                            '#10B981', // Green for uptime
                            '#EF4444'  // Red for downtime
                        ],
                        borderColor: [
                            '#059669',
                            '#DC2626'
                        ],
                        borderWidth: 3
                    }]
                },
                options: {
                    responsive: false,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: `Analisis Uptime - ${chartData.total_devices} Devices`,
                            font: {
                                size: 18,
                                weight: 'bold'
                            },
                            padding: 20
                        },
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                font: {
                                    size: 14
                                },
                                usePointStyle: true,
                                pointStyle: 'circle'
                            }
                        },
                        tooltip: {
                            enabled: false // Disable for PDF export
                        }
                    },
                    animation: {
                        duration: 0 // Disable animation for faster rendering
                    }
                }
            });

            // Wait for chart to render, then convert to base64
            setTimeout(() => {
                try {
                    const base64Image = canvas.toDataURL('image/png', 1.0);

                    // Cleanup
                    chart.destroy();
                    document.body.removeChild(canvas);

                    resolve(base64Image);
                } catch (error) {
                    console.error('Error converting chart to image:', error);
                    chart.destroy();
                    document.body.removeChild(canvas);
                    reject(error);
                }
            }, 1000);

        } catch (error) {
            console.error('Error creating optimized chart image:', error);
            reject(error);
        }
    });
}

/**
 * PERBAIKAN: Build comprehensive export options dengan format tanggal yang benar
 */
async function buildExportOptions(formData, dateMethod, chartResult) {
    try {
        // Helper functions
        const safeString = (value) => value ? String(value).trim() : '';

        // Base options
        const options = {
            format: formData.get('format') || 'download',
            report_type: 'kpi',
            include_ranking: safeString(formData.get('include_ranking')) || 'true',

            // Header information
            quarter: safeString(formData.get('quarter')),
            year: safeString(formData.get('year')),
            department: safeString(formData.get('department')),

            // KPI Information
            indikator: safeString(formData.get('indikator')),
            nama_indikator: safeString(formData.get('nama_indikator')),
            formula: safeString(formData.get('formula')),
            target: safeString(formData.get('target')),
            realisasi: safeString(formData.get('realisasi')),

            // PERBAIKAN: Footer/Signature Information dengan format tanggal server
            prepared_jabatan: safeString(formData.get('prepared_jabatan')),
            prepared_nama: safeString(formData.get('prepared_nama')),
            prepared_tanggal: formatDateForServer(formData.get('prepared_tanggal')),
            approved_jabatan: safeString(formData.get('approved_jabatan')),
            approved_nama: safeString(formData.get('approved_nama')),
            approved_tanggal: formatDateForServer(formData.get('approved_tanggal')),
            validated_jabatan: safeString(formData.get('validated_jabatan')),
            validated_nama: safeString(formData.get('validated_nama')),
            validated_tanggal: formatDateForServer(formData.get('validated_tanggal'))
        };

        // Add chart data if available
        if (chartResult) {
            options.chart_image = chartResult.chartImage;
            options.chart_data = JSON.stringify(chartResult.chartData);
            options.include_chart = 'true';
        }

        // Handle date parameters
        if (dateMethod === 'custom') {
            const startDate = formData.get('start_date');
            const endDate = formData.get('end_date');

            if (startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);
                const daysDiff = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1);

                options.date_method = 'custom';
                options.start_date = startDate;
                options.end_date = endDate;
                options.period = daysDiff.toString();
            }
        } else {
            options.date_method = 'preset';
            options.period = safeString(formData.get('period'));
            options.timeframe = safeString(formData.get('timeframe'));
        }

        // Debug logging
        console.log('Export options build completed:', {
            prepared_tanggal: options.prepared_tanggal,
            approved_tanggal: options.approved_tanggal,
            validated_tanggal: options.validated_tanggal
        });

        return options;

    } catch (error) {
        console.error('Error building export options:', error);
        throw new Error('Failed to build export options: ' + error.message);
    }
}

/**
 * Optimized PDF export with better error handling and progress tracking
 */
async function exportPdfReportOptimized(options = {}) {
    try {
        // Default params with validation
        const params = {
            format: options.format || 'download',
            period: options.period || PDF_CONFIG.DEFAULT_PERIOD.toString(),
            quarter: options.quarter || 'IV',
            year: options.year || new Date().getFullYear().toString(),
            report_type: options.report_type || 'kpi',
            date_method: options.date_method || 'preset',
            timeframe: options.timeframe || 'days',
            filename: `Laporan_KPI_${options.quarter || 'IV'}_${options.year || new Date().getFullYear()}_${Date.now()}.pdf`,
            ...options
        };

        console.log('Optimized PDF Export Parameters:', params);

        // Build query parameters efficiently
        const queryParams = new URLSearchParams();

        Object.entries(params).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
                queryParams.append(key, String(value));
            }
        });

        const url = `/api/history/export-pdf?${queryParams.toString()}`;

        console.log('Export URL (first 200 chars):', url.substring(0, 200) + '...');

        // Enhanced fetch with better timeout and error handling
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 seconds

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/pdf',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Enhanced response validation
        if (!response.ok) {
            let errorMessage = `Server error: ${response.status}`;
            try {
                const errorText = await response.text();
                console.error('Server error response:', errorText);

                // Try to parse JSON error
                try {
                    const errorJson = JSON.parse(errorText);
                    if (errorJson.error) {
                        errorMessage = errorJson.error;
                        if (errorJson.messages) {
                            const messages = Object.values(errorJson.messages).flat();
                            errorMessage += ': ' + messages.join(', ');
                        }
                    }
                } catch (e) {
                    // Not JSON, use text as is
                    if (errorText && errorText.length < 200) {
                        errorMessage += ` - ${errorText}`;
                    }
                }
            } catch (e) {
                // Ignore error text parsing errors
            }
            throw new Error(errorMessage);
        }

        // Validate content type
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/pdf')) {
            throw new Error('Server tidak mengembalikan file PDF yang valid');
        }

        // Get PDF blob with size validation
        const blob = await response.blob();

        if (blob.size === 0) {
            throw new Error('File PDF kosong');
        }

        if (blob.size < 1000) { // Less than 1KB is suspicious
            throw new Error('File PDF terlalu kecil, kemungkinan rusak');
        }

        console.log(`PDF berhasil dibuat: ${(blob.size / 1024).toFixed(2)} KB`);

        // Handle PDF based on format
        await handlePdfBlob(blob, params.filename, params.format);

        // Success notification
        showNotification('Laporan PDF berhasil dibuat!', 'success');

        // Clear cache after successful export
        PDFExportState.clearCache();

    } catch (error) {
        console.error('Optimized PDF Export Error:', error);
        handleExportError(error);
    }
}

/**
 * Handle PDF blob based on format preference
 */
async function handlePdfBlob(blob, filename, format) {
    try {
        if (format === 'view') {
            // Open in new tab
            const url = window.URL.createObjectURL(blob);
            const newWindow = window.open(url, '_blank');

            if (!newWindow || newWindow.closed) {
                // Popup blocked, fallback to download
                console.warn('Popup blocked, falling back to download');
                downloadBlob(blob, filename);
            } else {
                // Clean up URL after delay
                setTimeout(() => {
                    window.URL.revokeObjectURL(url);
                }, 10000);
            }
        } else {
            // Direct download
            downloadBlob(blob, filename);
        }
    } catch (error) {
        console.error('Error handling PDF blob:', error);
        throw new Error('Gagal memproses file PDF: ' + error.message);
    }
}

/**
 * Enhanced blob download with better error handling
 */
function downloadBlob(blob, filename) {
    try {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');

        a.style.display = 'none';
        a.href = url;
        a.download = filename || 'laporan.pdf';

        // Add to DOM, click, and remove
        document.body.appendChild(a);
        a.click();

        // Cleanup with proper timing
        setTimeout(() => {
            try {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            } catch (cleanupError) {
                console.warn('Cleanup error:', cleanupError);
            }
        }, 100);

    } catch (error) {
        console.error('Error downloading blob:', error);
        throw new Error('Gagal mengunduh file PDF: ' + error.message);
    }
}

/**
 * Enhanced error handling for export
 */
function handleExportError(error) {
    let errorMessage = 'Gagal membuat laporan PDF';

    if (error.name === 'AbortError') {
        errorMessage = 'Timeout: Server terlalu lama merespons (>90 detik)';
    } else if (error.message.includes('Server error')) {
        errorMessage = error.message;
    } else if (error.message.includes('NetworkError') || error.message.includes('fetch')) {
        errorMessage = 'Koneksi ke server bermasalah. Periksa koneksi internet Anda.';
    } else if (error.message.includes('PDF')) {
        errorMessage = error.message;
    } else {
        errorMessage = error.message || errorMessage;
    }

    showNotification(errorMessage, 'error');
}

/**
 * Enhanced modal close function with cleanup
 */
function closePdfModal(button) {
    try {
        const modal = button.closest('.fixed');
        if (!modal) return;

        // Cleanup chart
        if (PDFExportState.currentChart) {
            PDFExportState.currentChart.destroy();
            PDFExportState.currentChart = null;
        }

        // Reset processing state
        PDFExportState.isProcessing = false;

        // Animate modal close
        modal.style.opacity = '0';
        modal.style.transform = 'scale(0.95)';

        setTimeout(() => {
            modal.remove();
            document.body.style.overflow = '';
        }, 200);

    } catch (error) {
        console.error('Error closing modal:', error);
        // Force remove as fallback
        const modal = document.querySelector('.pdf-export-modal');
        if (modal) {
            modal.remove();
            document.body.style.overflow = '';
        }
    }
}

// PERBAIKAN: Export utility functions untuk compatibility
async function exportHistory(params = {}) {
    try {
        // Validate required parameters
        if (!params.format) {
            throw new Error('Format parameter is required');
        }

        // Default params
        params.filename = params.filename || 'history-report.pdf';

        // Show loading notification
        showNotification('Mempersiapkan laporan PDF...', 'info');

        // Pastikan semua parameter dikirim dengan benar
        const queryParams = new URLSearchParams();

        // Loop through all params dan pastikan semuanya dikirim
        Object.keys(params).forEach(key => {
            const value = params[key];
            if (value !== null && value !== undefined && value !== '') {
                if (Array.isArray(value)) {
                    // Handle arrays
                    queryParams.append(key, JSON.stringify(value));
                } else {
                    // Ensure non-array values are converted to strings
                    queryParams.append(key, String(value));
                }
            }
        });

        // Debug: Log query parameters yang akan dikirim
        console.log('Query Parameters being sent:');
        for (let [key, value] of queryParams.entries()) {
            console.log(`${key}: ${value}`);
        }

        const queryString = queryParams.toString();
        const url = `/api/history/export-pdf?${queryString}`;

        console.log('Full URL:', url);

        // Fetch PDF from server dengan timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/pdf',
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            console.error('Server response error:', errorText);
            throw new Error(`Server error: ${response.status} - ${errorText}`);
        }

        // Check if response is actually PDF
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/pdf')) {
            const responseText = await response.text();
            console.error('Non-PDF response received:', responseText);
            throw new Error('Server did not return a PDF file');
        }

        // Get PDF blob
        const blob = await response.blob();

        if (blob.size === 0) {
            throw new Error('PDF file is empty');
        }

        console.log('PDF blob size:', blob.size, 'bytes');

        // Handle PDF display/download
        if (params.format === 'view') {
            // Open in new tab
            const url = window.URL.createObjectURL(blob);
            const newWindow = window.open(url, '_blank');

            if (!newWindow) {
                // If popup blocked, fallback to download
                console.warn('Popup blocked, falling back to download');
                downloadBlob(blob, params.filename);
            } else {
                // Clean up URL after a delay to allow the browser to load the PDF
                setTimeout(() => {
                    window.URL.revokeObjectURL(url);
                }, 10000);
            }
        } else {
            // Direct download
            downloadBlob(blob, params.filename);
        }

        showNotification('Laporan PDF berhasil dibuat!', 'success');

    } catch (error) {
        console.error('Export PDF Error:', error);

        let errorMessage = 'Gagal membuat laporan PDF';

        if (error.name === 'AbortError') {
            errorMessage = 'Timeout: Server terlalu lama merespons';
        } else if (error.message.includes('Server error')) {
            errorMessage = error.message;
        } else if (error.message.includes('NetworkError') || error.message.includes('fetch')) {
            errorMessage = 'Koneksi ke server bermasalah';
        } else {
            errorMessage = error.message || errorMessage;
        }

        showNotification(errorMessage, 'error');
    }
}

// Backward compatibility functions
function showChartPreviewInModal() {
    try {
        const uptimeData = calculateUptimeData();

        // Update preview statistics dengan chart preview
        const chartPreviewContainer = document.getElementById('chart-preview-container');
        if (!chartPreviewContainer) {
            // Create chart preview container jika belum ada
            const previewSection = document.querySelector('.bg-blue-100.rounded-xl');
            if (previewSection) {
                const chartDiv = document.createElement('div');
                chartDiv.id = 'chart-preview-container';
                chartDiv.className = 'mt-4';
                chartDiv.innerHTML = `
                    <h5 class="text-sm font-semibold text-gray-700 mb-2">Preview Chart Uptime/Downtime:</h5>
                    <div class="bg-white rounded-lg p-3 text-center">
                        <canvas id="preview-chart" width="200" height="200"></canvas>
                        <div class="mt-2 text-xs text-gray-600">
                            <div>Total Uptime: ${uptimeData.total_uptime.toFixed(1)}%</div>
                            <div>Total Downtime: ${(uptimeData.total_devices * 100 - uptimeData.total_uptime).toFixed(1)}%</div>
                        </div>
                    </div>
                `;
                previewSection.appendChild(chartDiv);
            }
        }

        // Generate small preview chart
        const canvas = document.getElementById('preview-chart');
        if (canvas) {
            const ctx = canvas.getContext('2d');

            const totalPossibleUptime = uptimeData.total_devices * 100;
            const actualDowntime = totalPossibleUptime - uptimeData.total_uptime;

            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Uptime', 'Downtime'],
                    datasets: [{
                        data: [uptimeData.total_uptime, actualDowntime],
                        backgroundColor: ['#10B981', '#EF4444'],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: false,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error showing chart preview:', error);
    }
}

// Configuration constants
const PDF_CONFIG = {
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
    MAX_DATE_RANGE: 365,
    DEFAULT_PERIOD: 30,
    CHART_CACHE_KEY: 'chart_preview_data',
    ENDPOINTS_CACHE_KEY: 'endpoints_data_cache'
};

// Global state management
const PDFExportState = {
    currentChart: null,
    cachedData: new Map(),
    isProcessing: false,

    getCachedData(key) {
        const cached = this.cachedData.get(key);
        if (cached && Date.now() - cached.timestamp < PDF_CONFIG.CACHE_DURATION) {
            return cached.data;
        }
        return null;
    },

    setCachedData(key, data) {
        this.cachedData.set(key, {
            data,
            timestamp: Date.now()
        });
    },

    clearCache() {
        this.cachedData.clear();
    }
};

/**
 * PERBAIKAN: Format tanggal sesuai dengan requirement server
 */
function formatDateForServer(dateString) {
    if (!dateString) return '';

    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';

        // Format: d/m/Y (contoh: 24/08/2025)
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
    } catch (error) {
        console.error('Error formatting date:', error);
        return '';
    }
}

/**
 * PERBAIKAN: Format tanggal untuk display Indonesia
 */
function formatDateDisplay(dateString) {
    if (!dateString) return '';

    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';

        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        };

        return date.toLocaleDateString('id-ID', options);
    } catch (error) {
        console.error('Error formatting display date:', error);
        return dateString;
    }
}

/**
 * Enhanced PDF Export Modal with optimizations
 */
function showPdfExportModal() {
    // Prevent multiple modal instances
    const existingModal = document.querySelector('.pdf-export-modal');
    if (existingModal) {
        existingModal.remove();
    }

    const modal = createModalElement();
    document.body.appendChild(modal);

    // Setup modal behavior
    setupModalBehavior(modal);

    // Initialize components asynchronously
    requestAnimationFrame(() => {
        initializeModalComponents();
    });
}

/**
 * Create modal element with optimized HTML structure
 */
function createModalElement() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 pdf-export-modal';

    // Calculate defaults
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentQuarter = Math.ceil((today.getMonth() + 1) / 3);
    const todayStr = today.toISOString().split('T')[0];

    modal.innerHTML = `
        <div class="bg-white rounded-2xl w-full max-w-7xl flex flex-col shadow-2xl" style="max-height: 95vh; min-height: 70vh;">
            ${createModalHeader()}
            ${createModalContent(currentQuarter, currentYear, todayStr)}
            ${createModalFooter()}
        </div>
    `;

    return modal;
}

/**
 * Create modal header section
 */
function createModalHeader() {
    return `
        <div class="flex-shrink-0 p-4 sm:p-6 border-b border-gray-200 bg-red-500 text-white rounded-t-2xl">
            <div class="flex justify-between items-center">
                <div>
                    <h2 class="text-xl sm:text-2xl font-bold">
                        <i class="fas fa-file-pdf mr-2"></i>Export Laporan KPI PDF
                    </h2>
                    <p class="mt-1 opacity-90 text-sm sm:text-base">Generate laporan KPI dengan analisis chart uptime/downtime</p>
                </div>
                <button onclick="closePdfModal(this)"
                        class="text-white/80 hover:text-white text-xl sm:text-2xl p-2 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `;
}

/**
 * Create modal content with optimized sections
 */
function createModalContent(currentQuarter, currentYear, todayStr) {
    return `
        <div class="flex-1 overflow-y-auto p-4 sm:p-6">
            <form id="pdf-export-form" class="space-y-6 sm:space-y-8">
                ${createHeaderSection(currentQuarter, currentYear)}
                ${createKpiSection()}
                ${createDateRangeSection(todayStr)}
                ${createFooterSection(todayStr)}
                ${createChartPreviewSection()}
                ${createStatisticsPreviewSection()}
            </form>
        </div>
    `;
}

/**
 * Create header information section
 */
function createHeaderSection(currentQuarter, currentYear) {
    const quarters = ['I', 'II', 'III', 'IV'];
    const quarterOptions = quarters.map(q =>
        `<option value="${q}" ${currentQuarter === quarters.indexOf(q) + 1 ? 'selected' : ''}>${q}</option>`
    ).join('');

    return `
        <div class="bg-blue-50 rounded-xl p-4 sm:p-6 border border-blue-200">
            <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <i class="fas fa-info-circle text-blue-500"></i>
                Informasi Header Laporan
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Triwulan</label>
                    <select name="quarter" onchange="updatePdfPreviewStats()"
                            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        ${quarterOptions}
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Tahun</label>
                    <select name="year" onchange="updatePdfPreviewStats()"
                            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="2023">2023</option>
                        <option value="2024" ${currentYear === 2024 ? 'selected' : ''}>2024</option>
                        <option value="2025" ${currentYear === 2025 ? 'selected' : ''}>2025</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Departemen</label>
                    <select name="department" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="DEPARTEMEN SERVICE RESPRESENTATIVE TI TUREN" selected>DEPARTEMEN SERVICE RESPRESENTATIVE TI TUREN</option>
                    </select>
                </div>
            </div>
        </div>
    `;
}

/**
 * Create KPI information section
 */
function createKpiSection() {
    return `
        <div class="bg-green-50 rounded-xl p-4 sm:p-6 border border-green-200">
            <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <i class="fas fa-chart-line text-green-500"></i>
                Informasi KPI
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Indikator *</label>
                    <input type="text" name="indikator" value="KPI-TI-001" required
                           class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Target *</label>
                    <input type="text" name="target" value="1 Dokumen" required
                           class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500">
                </div>
                <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Nama Indikator *</label>
                    <textarea name="nama_indikator" rows="2" required
                              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500">Inventarisasi PC PMN Monitoring Produksi Munisi dan Seat Management Area PT Pindad Turen</textarea>
                </div>
                <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Formula</label>
                    <textarea name="formula" rows="2"
                              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500">Inventarisasi lengkap dan update per triwulan</textarea>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Realisasi</label>
                    <input type="text" name="realisasi" value="Tercapai 1 dokumen"
                           class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500">
                </div>
            </div>
        </div>
    `;
}

/**
 * PERBAIKAN: Create date range selection section dengan proper event handlers
 */
function createDateRangeSection(todayStr) {
    const startDate = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
    const endDate = todayStr;

    return `
        <div class="bg-gray-50 rounded-xl p-4 sm:p-6 border border-gray-200">
            <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <i class="fas fa-calendar-alt text-indigo-500"></i>
                Pilih Periode Laporan
            </h3>

            <!-- Date Method Selection -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <div class="space-y-3">
                    <label class="flex items-center p-3 sm:p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-indigo-300 cursor-pointer transition-colors">
                        <input type="radio" name="dateMethod" value="preset" checked
                               class="mr-3 text-indigo-600 focus:ring-indigo-500"
                               onchange="toggleDateMethod('preset')">
                        <div>
                            <div class="font-semibold text-gray-800 text-sm sm:text-base">Periode Preset</div>
                            <div class="text-xs sm:text-sm text-gray-600">Pilih dari periode yang sudah ditentukan</div>
                        </div>
                    </label>
                    <label class="flex items-center p-3 sm:p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-indigo-300 cursor-pointer transition-colors">
                        <input type="radio" name="dateMethod" value="custom"
                               class="mr-3 text-indigo-600 focus:ring-indigo-500"
                               onchange="toggleDateMethod('custom')">
                        <div>
                            <div class="font-semibold text-gray-800 text-sm sm:text-base">Tanggal Custom</div>
                            <div class="text-xs sm:text-sm text-gray-600">Pilih tanggal mulai dan akhir sendiri</div>
                        </div>
                    </label>
                </div>

                <!-- Quick Select Buttons -->
                <div class="space-y-2">
                    <div class="text-sm font-medium text-gray-700 mb-2">Quick Select:</div>
                    <div class="grid grid-cols-2 lg:grid-cols-1 gap-2">
                        ${createQuickSelectButtons()}
                    </div>
                </div>
            </div>

            <!-- Preset Options -->
            <div id="preset-options" class="grid grid-cols-2 gap-4 mb-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Periode Preset</label>
                    <select name="period" onchange="updatePdfPreviewStats()"
                            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                        <option value="1">1 Hari</option>
                        <option value="7">7 Hari</option>
                        <option value="14">14 Hari</option>
                        <option value="30" selected>30 Hari</option>
                        <option value="60">60 Hari</option>
                        <option value="90">90 Hari</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Format Waktu</label>
                    <select name="timeframe" onchange="updatePdfPreviewStats()"
                            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                        <option value="days">Hari Terakhir</option>
                        <option value="from_start">Dari Awal Tahun</option>
                        <option value="quarter">Per Triwulan</option>
                    </select>
                </div>
            </div>

            <!-- Custom Date Options -->
            <div id="custom-options" class="grid grid-cols-1 lg:grid-cols-2 gap-6 hidden">
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            <i class="fas fa-calendar-plus mr-1"></i>Tanggal Mulai
                        </label>
                        <input type="date" name="start_date" value="${startDate}" max="${endDate}"
                               class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                               onchange="handleDateChange('start')">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            <i class="fas fa-calendar-check mr-1"></i>Tanggal Akhir
                        </label>
                        <input type="date" name="end_date" value="${endDate}" max="${endDate}"
                               class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                               onchange="handleDateChange('end')">
                    </div>
                </div>
                <div class="bg-white rounded-lg border border-gray-200 p-4">
                    <h4 class="text-sm font-semibold text-gray-800 mb-3">
                        <i class="fas fa-info-circle text-blue-500 mr-1"></i>Preview Periode
                    </h4>
                    <div id="date-preview" class="space-y-2 text-sm text-gray-600">
                        <div class="flex justify-between">
                            <span>Dari:</span>
                            <span id="preview-start-date" class="font-medium">-</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Sampai:</span>
                            <span id="preview-end-date" class="font-medium">-</span>
                        </div>
                        <div class="flex justify-between pt-2 border-t">
                            <span>Total Hari:</span>
                            <span id="preview-total-days" class="font-medium text-indigo-600">-</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Create quick select buttons
 */
function createQuickSelectButtons() {
    const buttons = [
        { key: 'today', label: 'Hari Ini', icon: 'fa-calendar-day', color: 'blue' },
        { key: 'thisWeek', label: 'Minggu Ini', icon: 'fa-calendar-week', color: 'green' },
        { key: 'thisMonth', label: 'Bulan Ini', icon: 'fa-calendar', color: 'purple' },
        { key: 'lastMonth', label: 'Bulan Lalu', icon: 'fa-calendar-minus', color: 'orange' }
    ];

    return buttons.map(btn => `
        <button type="button" onclick="setQuickDate('${btn.key}')"
                class="w-full text-left px-3 py-2 text-xs sm:text-sm bg-${btn.color}-50 hover:bg-${btn.color}-100 text-${btn.color}-700 rounded-lg transition-colors">
            <i class="fas ${btn.icon} mr-2"></i>${btn.label}
        </button>
    `).join('');
}

/**
 * PERBAIKAN: Create footer signature section dengan format tanggal yang benar
 */
function createFooterSection(todayStr) {
    return `
        <div class="bg-purple-50 rounded-xl p-4 sm:p-6 border border-purple-200">
            <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <i class="fas fa-signature text-purple-500"></i>
                Informasi Footer & Tanda Tangan
            </h3>
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                ${createSignatureSection('prepared', 'DISIAPKAN OLEH', 'OFFICER MANAJEMEN SISTEM KOMPUTER TUREN', 'MUHAMMAD', todayStr)}
                ${createSignatureSection('approved', 'DISETUJUI OLEH', 'MANAGER', 'kimi', todayStr)}
                ${createSignatureSection('validated', 'DISAHKAN OLEH', 'MANAGER LAYANAN TI BANDUNG TUREN', 'RIZKY', todayStr)}
            </div>
        </div>
    `;
}

/**
 * Create signature section
 */
function createSignatureSection(type, title, defaultJabatan, defaultNama, todayStr) {
    return `
        <div class="space-y-4">
            <h4 class="font-semibold text-gray-700 border-b pb-2">${title}</h4>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Jabatan</label>
                <input type="text" name="${type}_jabatan" value="${defaultJabatan}" required
                       class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Nama *</label>
                <input type="text" name="${type}_nama" value="${defaultNama}" required
                       class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Tanggal</label>
                <input type="date" name="${type}_tanggal" value="${todayStr}" required
                       class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
            </div>
        </div>
    `;
}

/**
 * Create chart preview section
 */
function createChartPreviewSection() {
    return `
        <div class="bg-yellow-50 rounded-xl p-4 sm:p-6 border border-yellow-200">
            <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <i class="fas fa-chart-pie text-yellow-600"></i>
                Preview Chart Uptime/Downtime
            </h3>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Chart Container -->
                <div class="bg-white rounded-lg p-4 border border-yellow-300">
                    <div class="text-center">
                        <canvas id="preview-uptime-chart" width="250" height="250" style="max-width: 250px;"></canvas>
                        <div id="chart-loading" class="hidden text-sm text-gray-500 mt-2">Loading chart...</div>
                    </div>
                </div>

                <!-- Chart Statistics -->
                <div class="bg-white rounded-lg p-4 border border-yellow-300">
                    <h4 class="font-semibold text-gray-700 mb-3">Statistik Chart:</h4>
                    <div class="space-y-2 text-sm">
                        ${createChartStatistics()}
                    </div>
                    <div id="chart-assessment" class="mt-4 p-3 rounded-lg text-sm font-medium">
                        <div class="flex items-center gap-2">
                            <i class="fas fa-info-circle"></i>
                            <span id="chart-assessment-text">Menghitung assessment...</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Chart Options -->
            <div class="mt-4 bg-white rounded-lg p-4 border border-yellow-300">
                <label class="flex items-center gap-2">
                    <input type="checkbox" name="include_chart" checked
                           class="text-yellow-600 focus:ring-yellow-500 rounded">
                    <span class="text-sm font-medium text-gray-700">Sertakan chart dalam PDF</span>
                </label>
                <p class="text-xs text-gray-500 mt-1">
                    Chart akan ditampilkan sebagai diagram pie dalam laporan PDF
                </p>
            </div>
        </div>
    `;
}

/**
 * Create chart statistics elements
 */
function createChartStatistics() {
    const stats = [
        { id: 'chart-total-devices', label: 'Total Perangkat' },
        { id: 'chart-max-uptime', label: 'Kemungkinan Max Uptime' },
        { id: 'chart-actual-uptime', label: 'Total Uptime Aktual', class: 'text-green-600' },
        { id: 'chart-actual-downtime', label: 'Total Downtime', class: 'text-red-600' },
        { id: 'chart-uptime-percentage', label: 'Persentase Uptime', class: 'text-green-600 font-bold' },
        { id: 'chart-downtime-percentage', label: 'Persentase Downtime', class: 'text-red-600 font-bold' }
    ];

    return stats.map(stat => `
        <div class="flex justify-between ${stat.class || ''}">
            <span class="text-gray-600">${stat.label}:</span>
            <span id="${stat.id}" class="font-medium">-</span>
        </div>
    `).join('');
}

/**
 * Create statistics preview section
 */
function createStatisticsPreviewSection() {
    return `
        <div class="bg-blue-100 rounded-xl p-4 sm:p-6 border border-blue-200">
            <h4 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <i class="fas fa-chart-pie text-blue-600"></i>
                Preview Statistik yang Akan Dilaporkan
            </h4>
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 text-center">
                ${createStatisticCards()}
            </div>
        </div>
    `;
}

/**
 * Create statistic cards
 */
function createStatisticCards() {
    const cards = [
        { id: 'preview-total', label: 'Total Telepon', color: 'blue' },
        { id: 'preview-online', label: 'Online', color: 'green' },
        { id: 'preview-offline', label: 'Offline', color: 'red' },
        { id: 'preview-uptime', label: 'Avg Uptime', color: 'indigo' },
        { id: 'preview-period', label: 'Periode (Hari)', color: 'purple' }
    ];

    return cards.map(card => `
        <div class="bg-white rounded-lg p-3 sm:p-4 shadow-sm${card.id === 'preview-period' ? ' col-span-2 sm:col-span-1' : ''}">
            <div class="text-lg sm:text-2xl font-bold text-${card.color}-600" id="${card.id}">-</div>
            <div class="text-xs text-gray-600">${card.label}</div>
        </div>
    `).join('');
}

/**
 * Create modal footer
 */
function createModalFooter() {
    return `
        <div class="flex-shrink-0 p-4 sm:p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
            <div class="flex flex-col sm:flex-row justify-between items-center gap-3">
                <div class="text-xs sm:text-sm text-gray-600 flex items-center gap-2 order-2 sm:order-1">
                    <i class="fas fa-clock"></i>
                    <span>Estimasi waktu: ~15-45 detik</span>
                </div>
                <div class="flex gap-2 sm:gap-3 order-1 sm:order-2 w-full sm:w-auto">
                    <button type="button" onclick="closePdfModal(this)"
                            class="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm text-gray-600 hover:text-gray-800 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors">
                        <i class="fas fa-times mr-1"></i>Batal
                    </button>
                    <button type="button" onclick="handlePdfExport('download')" id="pdf-export-btn"
                            class="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-lg">
                        <i class="fas fa-download mr-1"></i>Download PDF
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Setup modal behavior and event listeners
 */
function setupModalBehavior(modal) {
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closePdfModal(modal.querySelector('button'));
        }
    });

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    // ESC key to close
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            closePdfModal(modal.querySelector('button'));
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
}

/**
 * PERBAIKAN: Initialize modal components asynchronously dengan proper error handling
 */
async function initializeModalComponents() {
    try {
        // Initialize preview statistics
        await updatePdfPreviewStats();

        // Initialize chart preview
        await initializeChartPreview();

        // Initialize custom date preview
        updateCustomDatePreview();

        // Setup date event listeners
        setupDateEventListeners();

        console.log('Modal components initialized successfully');
    } catch (error) {
        console.error('Error initializing modal components:', error);
        showNotification('Beberapa komponen gagal dimuat, namun modal tetap dapat digunakan', 'warning');
    }
}

/**
 * Enhanced chart preview initialization with better error handling
 */
async function initializeChartPreview() {
    try {
        const canvas = document.getElementById('preview-uptime-chart');
        const loadingEl = document.getElementById('chart-loading');

        if (!canvas) {
            console.warn('Chart preview canvas not found');
            return;
        }

        // Show loading
        if (loadingEl) {
            loadingEl.classList.remove('hidden');
        }

        // Get or calculate uptime data
        const uptimeData = await getUptimeDataAsync();

        // Update chart statistics display
        updateChartStatisticsDisplay(uptimeData);

        // Create preview chart
        const ctx = canvas.getContext('2d');
        await createPreviewChart(ctx, uptimeData);

        // Hide loading
        if (loadingEl) {
            loadingEl.classList.add('hidden');
        }

        console.log('Chart preview initialized successfully');

    } catch (error) {
        console.error('Error initializing chart preview:', error);

        // Hide loading and show error state
        const loadingEl = document.getElementById('chart-loading');
        if (loadingEl) {
            loadingEl.classList.add('hidden');
        }

        showChartError();
    }
}

/**
 * Get uptime data asynchronously with caching
 */
async function getUptimeDataAsync() {
    const cacheKey = PDF_CONFIG.ENDPOINTS_CACHE_KEY;
    const cached = PDFExportState.getCachedData(cacheKey);

    if (cached) {
        return cached;
    }

    try {
        // Try to get real-time data from API
        const response = await fetch('/api/realtime-uptime-data', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
            }
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
                const data = {
                    total_devices: result.data.total_devices,
                    online_devices: result.data.online_devices,
                    offline_devices: result.data.offline_devices,
                    total_uptime: result.data.online_percentage,
                    uptime_percentage: result.data.online_percentage
                };

                PDFExportState.setCachedData(cacheKey, data);
                return data;
            }
        }
    } catch (error) {
        console.warn('Failed to fetch real-time data, using fallback', error);
    }

    // Fallback to calculated data
    return calculateUptimeDataFallback();
}

/**
 * Calculate uptime data fallback with optimization
 */
function calculateUptimeDataFallback() {
    try {
        // Get nodes data or use sample
        let nodesData = window.nodes || [];

        if (nodesData.length === 0) {
            // Generate realistic sample data
            const totalNodes = 12;
            const onlineNodes = Math.floor(totalNodes * 0.75); // 75% online rate

            nodesData = Array.from({length: totalNodes}, (_, i) => ({
                status: i < onlineNodes ? 'online' : 'offline'
            }));
        }

        const totalDevices = nodesData.length;
        const onlineDevices = nodesData.filter(n => {
            const status = (n.status || '').toLowerCase();
            return status === 'online' || status === 'aktif';
        }).length;

        const totalPossibleUptime = totalDevices * 100;
        const actualUptimePercentage = totalDevices > 0 ? (onlineDevices / totalDevices) * 100 : 0;
        const actualUptime = (actualUptimePercentage / 100) * totalPossibleUptime;

        return {
            total_devices: totalDevices,
            online_devices: onlineDevices,
            offline_devices: totalDevices - onlineDevices,
            total_uptime: actualUptime,
            uptime_percentage: actualUptimePercentage
        };
    } catch (error) {
        console.error('Error calculating fallback uptime data:', error);
        // Return safe defaults
        return {
            total_devices: 10,
            online_devices: 8,
            offline_devices: 2,
            total_uptime: 800,
            uptime_percentage: 80
        };
    }
}

/**
 * Create preview chart with better error handling
 */
async function createPreviewChart(ctx, uptimeData) {
    try {
        const totalPossibleUptime = uptimeData.total_devices * 100;
        const actualDowntime = totalPossibleUptime - uptimeData.total_uptime;
        const uptimePercentage = ((uptimeData.total_uptime / totalPossibleUptime) * 100);
        const downtimePercentage = 100 - uptimePercentage;

        // Destroy existing chart if any
        if (PDFExportState.currentChart) {
            PDFExportState.currentChart.destroy();
        }

        // Create new chart with animation
        PDFExportState.currentChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: [
                    `Uptime (${uptimePercentage.toFixed(1)}%)`,
                    `Downtime (${downtimePercentage.toFixed(1)}%)`
                ],
                datasets: [{
                    data: [uptimeData.total_uptime, actualDowntime],
                    backgroundColor: [
                        '#10B981', // Green for uptime
                        '#EF4444'  // Red for downtime
                    ],
                    borderColor: [
                        '#059669',
                        '#DC2626'
                    ],
                    borderWidth: 2,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: false,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Preview Chart Uptime',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 10,
                            font: {
                                size: 10
                            },
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                return `${label}: ${value.toFixed(1)}%`;
                            }
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeInOutQuart'
                }
            }
        });

    } catch (error) {
        console.error('Error creating preview chart:', error);
        showChartError();
    }
}

/**
 * Show chart error state
 */
function showChartError() {
    const canvas = document.getElementById('preview-uptime-chart');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#f3f4f6';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#6b7280';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Chart tidak dapat dimuat', canvas.width/2, canvas.height/2 - 10);
        ctx.fillText('Data masih dapat diexport', canvas.width/2, canvas.height/2 + 10);
    }
}

/**
 * Enhanced chart statistics display update
 */
function updateChartStatisticsDisplay(uptimeData) {
    try {
        const totalPossibleUptime = uptimeData.total_devices * 100;
        const actualDowntime = totalPossibleUptime - uptimeData.total_uptime;
        const uptimePercentage = totalPossibleUptime > 0 ? ((uptimeData.total_uptime / totalPossibleUptime) * 100) : 0;
        const downtimePercentage = 100 - uptimePercentage;

        // Update display elements with animation
        const updates = {
            'chart-total-devices': `${uptimeData.total_devices} unit`,
            'chart-max-uptime': `${totalPossibleUptime.toFixed(0)}%`,
            'chart-actual-uptime': `${uptimeData.total_uptime.toFixed(1)}%`,
            'chart-actual-downtime': `${actualDowntime.toFixed(1)}%`,
            'chart-uptime-percentage': `${uptimePercentage.toFixed(1)}%`,
            'chart-downtime-percentage': `${downtimePercentage.toFixed(1)}%`
        };

        Object.entries(updates).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                // Animate number changes
                animateValueUpdate(element, value);
            }
        });

        // Update performance assessment with smooth transition
        updatePerformanceAssessment(uptimePercentage);

    } catch (error) {
        console.error('Error updating chart statistics display:', error);
    }
}

/**
 * Animate value updates
 */
function animateValueUpdate(element, newValue) {
    element.style.opacity = '0.5';
    setTimeout(() => {
        element.textContent = newValue;
        element.style.opacity = '1';
        element.style.transition = 'opacity 0.3s ease-in-out';
    }, 150);
}

/**
 * Update performance assessment with proper styling
 */
function updatePerformanceAssessment(uptimePercentage) {
    const assessmentEl = document.getElementById('chart-assessment');
    const assessmentTextEl = document.getElementById('chart-assessment-text');

    if (!assessmentEl || !assessmentTextEl) return;

    let assessmentClass, assessmentText, iconClass;

    if (uptimePercentage >= 95) {
        assessmentClass = 'bg-green-100 border-green-300 text-green-800';
        assessmentText = 'Excellent - Sistem beroperasi sangat baik';
        iconClass = 'fa-check-circle text-green-600';
    } else if (uptimePercentage >= 85) {
        assessmentClass = 'bg-blue-100 border-blue-300 text-blue-800';
        assessmentText = 'Very Good - Sistem beroperasi dengan baik';
        iconClass = 'fa-thumbs-up text-blue-600';
    } else if (uptimePercentage >= 75) {
        assessmentClass = 'bg-yellow-100 border-yellow-300 text-yellow-800';
        assessmentText = 'Good - Sistem memerlukan monitoring rutin';
        iconClass = 'fa-exclamation-triangle text-yellow-600';
    } else if (uptimePercentage >= 60) {
        assessmentClass = 'bg-orange-100 border-orange-300 text-orange-800';
        assessmentText = 'Fair - Sistem memerlukan perhatian khusus';
        iconClass = 'fa-exclamation-circle text-orange-600';
    } else {
        assessmentClass = 'bg-red-100 border-red-300 text-red-800';
        assessmentText = 'Poor - Sistem memerlukan perbaikan segera';
        iconClass = 'fa-times-circle text-red-600';
    }

    // Animate transition
    assessmentEl.style.opacity = '0.5';
    setTimeout(() => {
        assessmentEl.className = `mt-4 p-3 rounded-lg text-sm font-medium border ${assessmentClass} transition-all duration-300`;
        assessmentTextEl.innerHTML = `<i class="fas ${iconClass} mr-2"></i>${assessmentText}`;
        assessmentEl.style.opacity = '1';
    }, 150);
}

/**
 * PERBAIKAN: Enhanced PDF preview statistics update dengan proper period calculation
 */
async function updatePdfPreviewStats() {
    try {
        const form = document.getElementById('pdf-export-form');
        if (!form) {
            console.warn('PDF export form not found');
            return;
        }

        // Get current period calculation
        let currentPeriod = await calculateCurrentPeriod(form);

        // Update period display
        const periodEl = document.getElementById('preview-period');
        if (periodEl) {
            const oldValue = parseInt(periodEl.textContent) || 0;
            animateNumberUpdate(periodEl, oldValue, currentPeriod);
        }

        // Get or calculate statistics
        const stats = await getPreviewStatistics();

        // Update displays with animation
        const elements = {
            'preview-total': stats.total,
            'preview-online': stats.online,
            'preview-offline': stats.offline,
            'preview-uptime': stats.avgUptime
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                const currentValue = parseInt(element.textContent) || 0;
                animateNumberUpdate(element, currentValue, value, id === 'preview-uptime' ? '%' : '');

                // Update colors based on values
                updateElementColor(element, id, value);
            }
        });

        // Update chart preview if it exists
        if (PDFExportState.currentChart) {
            await updateChartWithNewData();
        }

        console.log('Preview stats updated successfully');

    } catch (error) {
        console.error('Error updating preview stats:', error);
    }
}

/**
 * PERBAIKAN: Calculate current period from form data dengan validation
 */
async function calculateCurrentPeriod(form) {
    try {
        const formData = new FormData(form);
        const dateMethod = formData.get('dateMethod');

        if (dateMethod === 'custom') {
            const startDate = formData.get('start_date');
            const endDate = formData.get('end_date');

            if (startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);

                if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                    const timeDiff = end.getTime() - start.getTime();
                    return Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1);
                }
            }
        }

        const period = parseInt(formData.get('period')) || PDF_CONFIG.DEFAULT_PERIOD;
        return Math.max(1, period);
    } catch (error) {
        console.error('Error calculating current period:', error);
        return PDF_CONFIG.DEFAULT_PERIOD;
    }
}

/**
 * Get preview statistics with caching
 */
async function getPreviewStatistics() {
    const cacheKey = 'preview_statistics';
    const cached = PDFExportState.getCachedData(cacheKey);

    if (cached) {
        return cached;
    }

    try {
        // Try to get from API first
        const response = await fetch('/api/realtime-uptime-data', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
            }
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
                const stats = {
                    total: result.data.total_devices,
                    online: result.data.online_devices,
                    offline: result.data.offline_devices,
                    avgUptime: Math.round(result.data.online_percentage)
                };

                PDFExportState.setCachedData(cacheKey, stats);
                return stats;
            }
        }
    } catch (error) {
        console.warn('Failed to get API stats, using fallback');
    }

    // Fallback calculation
    return calculateFallbackStats();
}

/**
 * Calculate fallback statistics
 */
function calculateFallbackStats() {
    let nodesData = window.nodes || [];

    if (nodesData.length === 0) {
        // Generate sample data
        const total = 12;
        const online = Math.floor(total * 0.78); // ~78% online

        nodesData = Array.from({length: total}, (_, i) => ({
            status: i < online ? 'online' : 'offline'
        }));
    }

    const total = nodesData.length;
    const online = nodesData.filter(n => {
        const status = (n.status || '').toLowerCase();
        return status === 'online' || status === 'aktif';
    }).length;
    const offline = total - online;
    const avgUptime = total > 0 ? Math.round((online / total) * 100) : 0;

    return { total, online, offline, avgUptime };
}

/**
 * Update element color based on value and type
 */
function updateElementColor(element, id, value) {
    if (id === 'preview-uptime') {
        const colorClass = value >= 90 ? 'text-green-600' :
                          value >= 75 ? 'text-yellow-600' : 'text-red-600';

        element.className = element.className.replace(/text-\w+-600/, colorClass);
    }
}

/**
 * Update chart with new data
 */
async function updateChartWithNewData() {
    try {
        const uptimeData = await getUptimeDataAsync();

        if (PDFExportState.currentChart && uptimeData) {
            const totalPossibleUptime = uptimeData.total_devices * 100;
            const actualDowntime = totalPossibleUptime - uptimeData.total_uptime;
            const uptimePercentage = ((uptimeData.total_uptime / totalPossibleUptime) * 100);
            const downtimePercentage = 100 - uptimePercentage;

            // Update chart data
            PDFExportState.currentChart.data.datasets[0].data = [uptimeData.total_uptime, actualDowntime];
            PDFExportState.currentChart.data.labels = [
                `Uptime (${uptimePercentage.toFixed(1)}%)`,
                `Downtime (${downtimePercentage.toFixed(1)}%)`
            ];

            // Animate update
            PDFExportState.currentChart.update('active');

            // Update statistics display
            updateChartStatisticsDisplay(uptimeData);
        }
    } catch (error) {
        console.error('Error updating chart with new data:', error);
    }
}

/**
 * Enhanced number animation with better easing
 */
function animateNumberUpdate(element, startValue, endValue, suffix = '') {
    if (!element || startValue === endValue) {
        if (element) element.textContent = endValue + suffix;
        return;
    }

    const duration = 800;
    const startTime = performance.now();
    const difference = endValue - startValue;

    function updateNumber(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Use ease-out-cubic for smoother animation
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const currentValue = Math.round(startValue + (difference * easeProgress));

        element.textContent = currentValue + suffix;

        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        }
    }

    requestAnimationFrame(updateNumber);
}

/**
 * PERBAIKAN: Enhanced date handling functions dengan proper event handling
 */
function toggleDateMethod(method) {
    const presetOptions = document.getElementById('preset-options');
    const customOptions = document.getElementById('custom-options');

    if (!presetOptions || !customOptions) {
        console.error('Date method elements not found');
        return;
    }

    // Smooth transition
    const hideElement = (el) => {
        el.style.opacity = '0';
        setTimeout(() => el.classList.add('hidden'), 150);
    };

    const showElement = (el) => {
        el.classList.remove('hidden');
        setTimeout(() => el.style.opacity = '1', 10);
        el.style.transition = 'opacity 0.15s ease-in-out';
    };

    if (method === 'preset') {
        hideElement(customOptions);
        setTimeout(() => {
            showElement(presetOptions);
            // Update preview setelah transition selesai
            setTimeout(updatePdfPreviewStats, 200);
        }, 100);
    } else {
        hideElement(presetOptions);
        setTimeout(() => {
            showElement(customOptions);
            updateCustomDatePreview();
            // Update preview setelah transition selesai
            setTimeout(updatePdfPreviewStats, 200);
        }, 100);
    }
}

/**
 * PERBAIKAN: Enhanced quick date setting dengan proper event handling
 */
function setQuickDate(period) {
    const today = new Date();
    const startDateInput = document.querySelector('input[name="start_date"]');
    const endDateInput = document.querySelector('input[name="end_date"]');
    const customRadio = document.querySelector('input[name="dateMethod"][value="custom"]');

    if (!startDateInput || !endDateInput || !customRadio) {
        console.error('Date input elements not found');
        return;
    }

    let startDate, endDate;

    switch(period) {
        case 'today':
            startDate = endDate = today;
            break;
        case 'thisWeek':
            const dayOfWeek = today.getDay();
            const startOfWeek = new Date(today.getTime() - (dayOfWeek * 24 * 60 * 60 * 1000));
            startDate = startOfWeek;
            endDate = today;
            break;
        case 'thisMonth':
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            endDate = today;
            break;
        case 'lastMonth':
            const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
            startDate = lastMonth;
            endDate = lastMonthEnd;
            break;
        default:
            console.warn('Unknown period:', period);
            return;
    }

    // Animate radio selection
    customRadio.checked = true;
    toggleDateMethod('custom');

    // Set dates with smooth transition
    setTimeout(() => {
        startDateInput.value = startDate.toISOString().split('T')[0];
        endDateInput.value = endDate.toISOString().split('T')[0];

        updateCustomDatePreview();
        updatePdfPreviewStats();
    }, 300); // Increased delay to ensure UI is ready
}

/**
 * PERBAIKAN: Enhanced date change handler dengan validation
 */
function handleDateChange(type) {
    const startDateInput = document.querySelector('input[name="start_date"]');
    const endDateInput = document.querySelector('input[name="end_date"]');

    if (!startDateInput || !endDateInput) return;

    // Auto-correct dates if needed
    if (type === 'start' && endDateInput.value < startDateInput.value) {
        endDateInput.value = startDateInput.value;
    } else if (type === 'end' && startDateInput.value > endDateInput.value) {
        startDateInput.value = endDateInput.value;
    }

    // Update min/max constraints
    endDateInput.min = startDateInput.value;

    // Validate date range
    const startDate = new Date(startDateInput.value);
    const endDate = new Date(endDateInput.value);

    if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
        const daysDiff = Math.ceil((endDate - startDate) / (1000 * 3600 * 24)) + 1;

        if (daysDiff > PDF_CONFIG.MAX_DATE_RANGE) {
            showNotification(`Periode maksimal ${PDF_CONFIG.MAX_DATE_RANGE} hari. Periode saat ini: ${daysDiff} hari`, 'warning');
            return;
        }
    }

    // Update previews with debounced calls
    setTimeout(() => {
        updateCustomDatePreview();
        updatePdfPreviewStats();
    }, 100);
}

/**
 * PERBAIKAN: Enhanced custom date preview dengan proper error handling
 */
function updateCustomDatePreview() {
    const startDateInput = document.querySelector('input[name="start_date"]');
    const endDateInput = document.querySelector('input[name="end_date"]');
    const previewStartDate = document.getElementById('preview-start-date');
    const previewEndDate = document.getElementById('preview-end-date');
    const previewTotalDays = document.getElementById('preview-total-days');

    if (!startDateInput || !endDateInput || !previewStartDate) return;

    try {
        const startDate = new Date(startDateInput.value);
        const endDate = new Date(endDateInput.value);

        if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
            const startFormatted = formatDateDisplay(startDateInput.value);
            const endFormatted = formatDateDisplay(endDateInput.value);
            const daysDiff = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1);

            // Animate updates
            animateTextUpdate(previewStartDate, startFormatted);
            animateTextUpdate(previewEndDate, endFormatted);
            animateTextUpdate(previewTotalDays, `${daysDiff} hari`);

            // Update period preview
            const previewPeriodEl = document.getElementById('preview-period');
            if (previewPeriodEl) {
                const currentPeriod = parseInt(previewPeriodEl.textContent) || 0;
                animateNumberUpdate(previewPeriodEl, currentPeriod, daysDiff);
            }
        } else {
            // Show placeholder if dates are invalid
            previewStartDate.textContent = 'Pilih tanggal mulai';
            previewEndDate.textContent = 'Pilih tanggal akhir';
            previewTotalDays.textContent = '- hari';
        }
    } catch (error) {
        console.error('Error updating date preview:', error);
        ['preview-start-date', 'preview-end-date', 'preview-total-days'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = 'Error';
        });
    }
}

/**
 * Quick export function for convenience
 */
function quickExportPdf() {
    exportPdfReportOptimized({
        period: '30',
        quarter: 'IV',
        year: new Date().getFullYear().toString(),
        format: 'download',
        report_type: 'kpi'
    });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('PDF Export module loaded');
    });
} else {
    console.log('PDF Export module loaded');
}

// Export functions to global scope with error handling
try {
    // Main export functions
    window.showPdfExportModal = showPdfExportModal;
    window.handlePdfExport = handlePdfExport;
    window.exportPdfReportOptimized = exportPdfReportOptimized;
    window.exportHistory = exportHistory;
    window.quickExportPdf = quickExportPdf;
    window.initializeChartPreview = initializeChartPreview;
    window.showChartPreviewInModal = showChartPreviewInModal;
    window.generateUptimeChart = generateUptimeChart;

    // Helper functions
    window.closePdfModal = closePdfModal;
    window.toggleDateMethod = toggleDateMethod;
    window.setQuickDate = setQuickDate;
    window.setupDateEventListeners = setupDateEventListeners;
    window.updateCustomDatePreview = updateCustomDatePreview;
    window.updatePdfPreviewStats = updatePdfPreviewStats;
    window.downloadBlob = downloadBlob;
    window.animateNumberUpdate = animateNumberUpdate;

    console.log('PDF export functions loaded successfully');

} catch (error) {
    console.error('Error loading PDF export functions:', error);
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('PDF export module initialized');
    });
} else {
    console.log('PDF export module initialized');
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
                    node_name: node?.name || endpoint,
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

// Phone Monitoring Class - Updated with real uptime calculation
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
        return nodes.map(node => {
            const uptimeData = getUptimeDisplay(node.endpoint, '24h');

            return {
                id: node.id,
                name: node.name,
                ip: node.ip,
                endpoint: node.endpoint,
                status: node.status || 'offline',
                lastSeen: node.last_ping_raw ? new Date(node.last_ping_raw) : new Date(),
                downtime: this.calculateDowntime(node.last_ping_raw),
                uptime: uptimeData.uptimePercentage,
                uptimeData: uptimeData,
                responseTime: node.response_time_raw || 'N/A'
            };
        });
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

        // Determine uptime color based on percentage
        const uptimeColor = phone.uptime >= 95 ? 'text-green-600' :
                           phone.uptime >= 80 ? 'text-yellow-600' : 'text-red-600';
        const uptimeBgColor = phone.uptime >= 95 ? 'bg-green-50' :
                             phone.uptime >= 80 ? 'bg-yellow-50' : 'bg-red-50';

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
                        <span class="text-gray-700 font-medium">${formatDateTime(phone.lastSeen.toISOString(), 'short')}</span>
                    </div>

                    <!-- Enhanced Uptime Display with Real Calculation -->
                    <div class="flex justify-between items-center text-xs">
                        <span class="text-gray-500">24h Uptime:</span>
                        <div class="flex items-center gap-2">
                            <span class="${uptimeColor} font-bold px-2 py-1 ${uptimeBgColor} rounded-full">
                                ${phone.uptime}%
                            </span>
                            ${!phone.uptimeData.dataAvailable ?
                                '<span class="text-xs text-orange-500">(No data)</span>' :
                                phone.uptimeData.assumption ?
                                '<span class="text-xs text-blue-500" title="' + phone.uptimeData.assumption + '">(Est.)</span>' : ''
                            }
                        </div>
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

                    <!-- Uptime Breakdown -->
                    ${phone.uptimeData.dataAvailable ? `
                        <div class="text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
                            <div class="flex justify-between">
                                <span>Online: ${formatDuration(phone.uptimeData.onlineMinutes)}</span>
                                <span>Offline: ${formatDuration(phone.uptimeData.offlineMinutes)}</span>
                            </div>
                            ${phone.uptimeData.logsProcessed ? `
                                <div class="text-center mt-1 text-blue-500">
                                    ${phone.uptimeData.logsProcessed} events processed
                                </div>
                            ` : ''}
                        </div>
                    ` : ''}

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
window.calculateRealUptime = calculateRealUptime;
window.calculateUptimeForAllPeriods = calculateUptimeForAllPeriods;
window.getUptimeDisplay = getUptimeDisplay;

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
    formatRelativeTime,
    calculateRealUptime,
    calculateUptimeForAllPeriods,
    getUptimeDisplay
});
