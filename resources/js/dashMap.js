// resources/js/dashboard.js
import { io } from 'socket.io-client';

let map;
let markers = {};
let nodes = [];
let socket;
let latestStatus = [];

const apiHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
};

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', async function () {
    try {
        // Initialize map
        initializeMap();

        // Fetch initial nodes data
        await fetchNodes();

        // Setup real-time socket connection
        initializeSocket();

        console.log('Dashboard initialized successfully');
    } catch (error) {
        console.error('Dashboard initialization error:', error);
    }
});

const MAP_CONFIG = {
    center: [-8.173358, 112.684885],
    zoom: 17,
    maxZoom: 20
};

function initializeMap() {
    // Initialize Leaflet map centered on your location
    map = L.map('map').setView([-8.173358, 112.684885], 17);

    // Add tile layers
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: MAP_CONFIG.maxZoom,
        attribution: '© OpenStreetMap contributors'
    });

    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: MAP_CONFIG.maxZoom,
        attribution: '© Esri'
    });

    // Add default layer
    osmLayer.addTo(map);

    // Layer control
    const baseMaps = {
        "OpenStreetMap": osmLayer,
        "Satellite": satelliteLayer
    };
    L.control.layers(baseMaps).addTo(map);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 20,
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    console.log('Map initialized');
}

async function fetchNodes() {
    try {
        const response = await fetch('/api/nodes', { headers: apiHeaders });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        nodes = await response.json();
        console.log('Fetched nodes:', nodes);

        // Create initial markers
        updateMapMarkers();

        // Update initial status counts
        updateStatusCounts();

    } catch (error) {
        console.error('Error fetching nodes:', error);
        // Show error message to user
        showErrorMessage('Failed to load phone data. Please refresh the page.');
    }
}

function initializeSocket() {
    socket = io("http://localhost:3000", {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
    });

    socket.on("connect", () => {
        console.log("Connected to Socket.IO server:", socket.id);
        showToast('Real-time connection established', 'success');
    });

    socket.on("disconnect", (reason) => {
        console.log("Disconnected from Socket.IO server:", reason);
        showToast('Connection lost. Reconnecting...', 'warning');
    });

    socket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        showToast('Failed to connect server', 'error');
    });

    socket.on("device-status", (statusData) => {
        console.log('Received device status update:', statusData);
        handleStatusUpdate(statusData);
    });
}

function handleStatusUpdate(statusData) {
    if (!Array.isArray(statusData)) {
        console.warn('Invalid status data received:', statusData);
        return;
    }

    latestStatus = statusData;

    // Update each device status
    statusData.forEach(update => {
        updateNodeStatus(update);
    });

    // Update UI components
    updateMapMarkers();
    updateStatusCounts();
    updateStatusList();
}

function updateNodeStatus(statusUpdate) {
    const { endpoint, status, timestamp } = statusUpdate;

    console.log(`Processing status update for ${endpoint}: "${status}"`);

    // Find existing node
    let node = nodes.find(n => n.endpoint === endpoint);

    if (!node) {
        // Create new node if not found (for dynamic devices)
        node = {
            id: nodes.length + 1,
            name: `Device ${endpoint}`,
            ip: statusUpdate.contact || 'Unknown',
            endpoint: endpoint,
            status: 'offline',
            coords: [-8.173358, 112.684885], // Default coordinates
            lastPing: timestamp || new Date().toISOString(),
            uptime: '0%',
            responseTime: 'N/A',
            description: 'Dynamically discovered device',
            last_ping_raw: timestamp || new Date().toISOString(),
            uptime_percentage: '0',
            response_time_raw: 0
        };
        nodes.push(node);
        console.log('Added new node:', node);
    }

    // Update node status
    const oldStatus = node.status;
    const newStatus = normalizeStatus(status);

    node.status = newStatus;
    node.last_ping_raw = timestamp || new Date().toISOString();
    node.lastPing = new Date(node.last_ping_raw).toLocaleTimeString('id-ID');

    // Log status changes with more detail
    if (oldStatus !== newStatus) {
        console.log(`Node ${endpoint} status changed: ${oldStatus} → ${newStatus} (original: "${status}")`);
    }
}

function updateMapMarkers() {
    // Clear existing markers
    Object.values(markers).forEach(marker => {
        if (map.hasLayer(marker)) {
            map.removeLayer(marker);
        }
    });
    markers = {};

    // Create new markers for all nodes
    nodes.forEach(node => {
        createMarkerForNode(node);
    });

    console.log(`Updated ${Object.keys(markers).length} map markers`);
}


// Toast notification system
function showToast(message, type = 'info') {
    const colors = {
        success: 'bg-white text-green-500',
        error: 'bg-white text-red-500',
        warning: 'bg-white text-yellow-600',
        info: 'bg-white text-blue-500'
    };

    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };

    // Buat elemen toast
    const toast = document.createElement('div');
    toast.className = `
        fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 transition-all duration-300 transform translate-x-full
        ${colors[type] || colors.info}
    `;

    toast.innerHTML = `
        <i class="fas fa-${icons[type] || icons.info} text-lg"></i>
        <span class="text-sm font-medium">${message}</span>
    `;

    document.body.appendChild(toast);

    // Animasi masuk
    setTimeout(() => {
        toast.classList.remove('translate-x-full');
    }, 50);

    // Hapus setelah 4 detik
    setTimeout(() => {
        toast.classList.add('translate-x-full');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 4000);
}


function createMarkerForNode(node) {
    const [lat, lng] = node.coords;

    // Validate coordinates
    if (isNaN(parseFloat(lat)) || isNaN(parseFloat(lng))) {
        console.warn(`Invalid coordinates for node ${node.endpoint}:`, node.coords);
        return;
    }

    const color = getStatusColor(node.status);

    // Create circle marker
    const marker = L.circleMarker([parseFloat(lat), parseFloat(lng)], {
        radius: 12,
        color: color,
        fillColor: color,
        fillOpacity: 0.8,
        weight: 3,
        className: `marker-${node.status}`
    });

    // Add device ID to marker element
    marker.on('add', function () {
        const element = marker.getElement();
        if (element) {
            element.setAttribute('id', `device-${node.id}`);
            element.setAttribute('data-device-id', node.id);
            element.setAttribute('data-endpoint', node.endpoint);
        }
    });

    // Bind popup with device information
    marker.bindPopup(getPopupContent(node, color), {
        maxWidth: 300,
        className: 'device-popup'
    });

    // Add click event for additional interactions
    marker.on('click', function() {
        console.log('Clicked on device:', node.endpoint);
        // You can add more interactions here
    });

    // Add marker to map and store reference
    marker.addTo(map);
    markers[node.endpoint] = marker;
}

function updateStatusCounts() {
    const total = nodes.length;
    const online = nodes.filter(n => normalizeStatus(n.status) === 'online').length;
    const offline = nodes.filter(n => normalizeStatus(n.status) === 'offline').length;
    const inUse = nodes.filter(n => normalizeStatus(n.status) === 'partial').length;

    // Update DOM elements safely
    updateElement('total-phones', total);
    updateElement('online-phones', online);
    updateElement('offline-phones', offline);
    updateElement('in-use-phones', inUse);

    console.log('Status counts updated:', { total, online, offline, inUse });
}

function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;

        // Add animation effect
        element.classList.add('updated');
        setTimeout(() => element.classList.remove('updated'), 1000);
    } else {
        console.warn(`Element with ID '${id}' not found`);
    }
}

function updateStatusList() {
    const statusListContainer = document.getElementById('status-list');
    if (!statusListContainer) return;

    // Sort nodes by status (online first, then by name)
    const sortedNodes = [...nodes].sort((a, b) => {
        const statusOrder = { 'online': 0, 'partial': 1, 'offline': 2 };
        const aOrder = statusOrder[normalizeStatus(a.status)] || 3;
        const bOrder = statusOrder[normalizeStatus(b.status)] || 3;

        if (aOrder !== bOrder) return aOrder - bOrder;
        return a.name.localeCompare(b.name);
    });

    statusListContainer.innerHTML = sortedNodes.map(node => createStatusListItem(node)).join('');
}

function createStatusListItem(node) {
    const status = normalizeStatus(node.status);
    const color = getStatusColor(status);
    const displayStatus = formatDisplayStatus(status);
    const lastPing = node.lastPing || new Date(node.last_ping_raw).toLocaleTimeString('id-ID');

    return `
        <div class="status-item flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow" data-endpoint="${node.endpoint}">
            <div class="flex items-center gap-3">
                <div class="w-3 h-3 rounded-full" style="background-color: ${color}"></div>
                <div>
                    <div class="font-semibold text-gray-800">${node.name}</div>
                    <div class="text-sm text-gray-500">${node.ip} • ${node.endpoint}</div>
                </div>
            </div>
            <div class="text-right">
                <div class="text-sm font-medium" style="color: ${color}">${displayStatus}</div>
                <div class="text-xs text-gray-500">${lastPing}</div>
            </div>
        </div>
    `;
}

// FIXED: Status normalization function - properly handles backend data format
function normalizeStatus(status) {
    if (!status) return 'offline';

    const statusStr = status.toString().toLowerCase().trim();

    console.log(`Normalizing status: "${statusStr}"`);

    // Handle "unavailable" or "0 of X" patterns - these are OFFLINE
    if (statusStr.includes('unavailable') ||
        statusStr.includes('0 of') ||
        statusStr === 'offline') {
        console.log(`→ Mapped to: offline`);
        return 'offline';
    }

    // Handle "not in use" patterns - these are ONLINE (available for calls)
    if (statusStr.includes('not in use')) {
        console.log(`→ Mapped to: online`);
        return 'online';
    }

    // Handle "in use" patterns - these are PARTIAL (busy/occupied)
    if (statusStr.includes('in use')) {
        console.log(`→ Mapped to: partial`);
        return 'partial';
    }

    // Handle other available patterns
    if (statusStr.includes('available') || statusStr === 'online') {
        console.log(`→ Mapped to: online`);
        return 'online';
    }

    // Handle explicit partial status
    if (statusStr.includes('partial') || statusStr.includes('busy')) {
        console.log(`→ Mapped to: partial`);
        return 'partial';
    }

    // Default to offline for unknown status
    console.log(`→ Unknown status, mapped to: offline`);
    return 'offline';
}

function getStatusColor(status) {
    const normalizedStatus = normalizeStatus(status);
    switch (normalizedStatus) {
        case 'online': return '#10b981';    // Green
        case 'offline': return '#ef4444';   // Red
        case 'partial': return '#f59e0b';   // Yellow/Orange
        default: return '#6b7280';          // Gray
    }
}

function formatDisplayStatus(status) {
    const normalizedStatus = normalizeStatus(status);
    switch (normalizedStatus) {
        case 'online': return 'Online';
        case 'offline': return 'Offline';
        case 'partial': return 'In Use';
        default: return 'Unknown';
    }
}

function getPopupContent(node, color) {
    const status = formatDisplayStatus(node.status);
    const lastPing = node.lastPing || new Date(node.last_ping_raw).toLocaleTimeString('id-ID');
    const uptime = node.uptime_percentage ? `${node.uptime_percentage}%` : 'N/A';

    return `
        <div class="device-popup-content">
            <div class="font-bold text-lg mb-2">${node.name}</div>
            <div class="space-y-1 text-sm">
                <div><strong>IP:</strong> ${node.ip}</div>
                <div><strong>Endpoint:</strong> ${node.endpoint}</div>
                <div><strong>Status:</strong> <span style="color:${color}; font-weight: bold;">${status}</span></div>
                <div><strong>Last Ping:</strong> ${lastPing}</div>
                <div><strong>Uptime:</strong> ${uptime}</div>
                <div><strong>Description:</strong> ${node.description || '-'}</div>
            </div>
        </div>
    `;
}

// Utility functions for user feedback
function showSuccessMessage(message) {
    showMessage(message, 'success');
}

function showErrorMessage(message) {
    showMessage(message, 'error');
}

function showWarningMessage(message) {
    showMessage(message, 'warning');
}

function showMessage(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type} fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 transition-all duration-300`;

    const colors = {
        success: 'bg-green-500 text-white',
        error: 'bg-red-500 text-white',
        warning: 'bg-yellow-500 text-black',
        info: 'bg-blue-500 text-white'
    };

    notification.className += ` ${colors[type]}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// Public functions for external access
function refreshMap() {
    updateMapMarkers();
    updateStatusList();
    updateStatusCounts();
    console.log('Map refreshed manually');
}

function refreshData() {
    fetchNodes().then(() => {
        console.log('Data refreshed successfully');
        showSuccessMessage('Data refreshed');
    }).catch(error => {
        console.error('Error refreshing data:', error);
        showErrorMessage('Failed to refresh data');
    });
}

// Export functions for global access
window.refreshMap = refreshMap;
window.refreshData = refreshData;

// Export variables for debugging/external access
Object.assign(window, {
    map,
    markers,
    nodes,
    socket,
    latestStatus
});

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    .updated {
        animation: pulse-update 1s ease-in-out;
    }

    @keyframes pulse-update {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); color: #3b82f6; }
        100% { transform: scale(1); }
    }

    .notification {
        transform: translateX(100%);
    }

    .notification.show {
        transform: translateX(0);
    }

    .device-popup-content {
        min-width: 200px;
    }

    .status-item:hover {
        background-color: #f8fafc;
    }
`;
document.head.appendChild(style);

// Error boundary for unhandled errors
window.addEventListener('error', (event) => {
    console.error('Unhandled error in map.js:', event.error);
    showToast('An unexpected error occurred', 'error');
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection in map.js:', event.reason);
    showToast('A network error occurred', 'error');
});
