// resources/js/dashboard.js - FIXED CONNECTION VERSION
import { io } from 'socket.io-client';

// Global state management
const state = {
    map: null,
    markers: new Map(),
    nodes: [],
    socket: null,
    latestStatus: [],
    isInitialized: false,
    syncInProgress: false
};

// Performance optimization: Debounce and throttle utilities
const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
};

const throttle = (func, limit) => {
    let inThrottle;
    return (...args) => {
        if (!inThrottle) {
            func.apply(null, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

// FIXED: Token management - consistent strategy
function getAuthToken() {
    // Priority 1: App config token (from blade template)
    if (window.AppConfig?.authToken) {
        console.log('Using App config token:', window.AppConfig.authToken);
        return window.AppConfig.authToken;
    }

    // Priority 2: Legacy window.userToken
    if (window.userToken) {
        console.log('Using legacy window.userToken:', window.userToken);
        return window.userToken;
    }

    // Priority 3: Stored tokens (untuk persistence)
    const storedToken = localStorage.getItem('auth_token') ||
                       sessionStorage.getItem('auth_token') ||
                       document.querySelector('meta[name="auth-token"]')?.getAttribute('content');

    if (storedToken) {
        console.log('Using stored token');
        return storedToken;
    }

    // Priority 4: Fallback untuk development
    const fallbackToken = 'pindad_123';
    console.warn('Using fallback token:', fallbackToken);

    return fallbackToken;
}

// Token storage dan persistence
function storeAuthToken(token) {
    if (!token) return;
    sessionStorage.setItem('auth_token', token);
    console.log('Token stored in sessionStorage');
}

function clearAuthToken() {
    sessionStorage.removeItem('auth_token');
    localStorage.removeItem('auth_token');
    console.log('Auth tokens cleared');
}

// FIXED: API configuration dengan token yang konsisten
function getAPIConfig() {
    const token = getAuthToken();
    return {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        'Authorization': `Bearer ${token}`
    };
}

// FIXED: Socket configuration dengan better token handling
function getSocketConfig() {
    const token = getAuthToken();
    return {
        url: "http://localhost:3000",
        options: {
            transports: ['websocket', 'polling'],
            auth: {
                token: token,
                userId: window.AppConfig?.userId || null,
                userName: window.AppConfig?.userName || 'unknown'
            },
            timeout: 20000,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            forceNew: false,
            upgrade: true,
            rememberUpgrade: false
        }
    };
}

const MAP_CONFIG = {
    center: [-8.173358, 112.684885],
    zoom: 17,
    maxZoom: 20
};

const STATUS_CONFIG = {
    colors: {
        online: '#10b981',
        offline: '#ef4444',
        partial: '#f59e0b',
        unknown: '#6b7280'
    },
    displayNames: {
        online: 'Online',
        offline: 'Offline',
        partial: 'In Use',
        unknown: 'Unknown'
    }
};

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeDashboard);

async function initializeDashboard() {
    if (state.isInitialized) return;

    try {
        console.log('=== DASHBOARD INITIALIZATION ===');

        // Validate authentication
        if (window.AppConfig && !window.AppConfig.isAuthenticated) {
            console.error('User not authenticated, redirecting...');
            window.location.href = '/login';
            return;
        }

        // Store token for persistence
        const authToken = getAuthToken();
        storeAuthToken(authToken);

        console.log('Auth token validated:', authToken);

        // Initialize components in optimal order
        await Promise.all([
            initializeMap(),
            fetchNodes()
        ]);

        // Initialize socket after basic setup
        initializeSocket();

        state.isInitialized = true;
        console.log('Dashboard initialized successfully');

    } catch (error) {
        console.error('Dashboard initialization error:', error);
        showToast('Failed to initialize dashboard', 'error');
    }
}

function initializeMap() {
    return new Promise((resolve) => {
        try {
            // Initialize Leaflet map
            state.map = L.map('map', {
                center: MAP_CONFIG.center,
                zoom: MAP_CONFIG.zoom,
                zoomControl: true,
                attributionControl: true,
                preferCanvas: true
            });

            // Tile layers with error handling
            const tileLayerOptions = {
                maxZoom: MAP_CONFIG.maxZoom,
                attribution: '© OpenStreetMap contributors',
                errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
            };

            const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', tileLayerOptions);
            const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                ...tileLayerOptions,
                attribution: '© Esri'
            });

            osmLayer.addTo(state.map);

            // Layer control
            const baseMaps = {
                "OpenStreetMap": osmLayer,
                "Satellite": satelliteLayer
            };
            L.control.layers(baseMaps).addTo(state.map);

            console.log('Map initialized successfully');
            resolve();
        } catch (error) {
            console.error('Map initialization failed:', error);
            resolve(); // Don't block initialization
        }
    });
}

// FIXED: Socket initialization dengan proper error handling dan logging
function initializeSocket() {
    if (state.socket?.connected) {
        console.log('Socket already connected');
        return;
    }
    const socketConfig = getSocketConfig();
    console.log('Socket URL:', socketConfig.url);
    console.log('Auth info:', {
        token: socketConfig.options.auth.token,
        userId: socketConfig.options.auth.userId,
        userName: socketConfig.options.auth.userName
    });

    try {
        state.socket = io(socketConfig.url, socketConfig.options);

        // Connection events
        state.socket.on("connect", () => {
            console.log("✅ Connected to Socket.IO server:", state.socket.id);
            console.log("Socket transport:", state.socket.io.engine.transport.name);
            showToast('Real-time connection established', 'success');
        });

        state.socket.on("disconnect", (reason) => {
            console.log("❌ Disconnected from Socket.IO server:", reason);

            // Different handling based on disconnect reason
            if (reason === 'io server disconnect') {
                showToast('Server disconnected the connection', 'error');
            } else if (reason === 'io client disconnect') {
                showToast('Client disconnected', 'info');
            } else {
                showToast('Connection lost. Attempting to reconnect...', 'warning');
            }
        });

        state.socket.on("connect_error", (error) => {
            console.error("❌ Socket connection error:", error);
            console.error("Error message:", error.message);
            console.error("Error description:", error.description);
            console.error("Error type:", error.type);

            // Specific error handling
            if (error.message.includes('Unauthorized') ||
                error.message.includes('Authentication') ||
                error.message.includes('Invalid token')) {
                showToast('Authentication failed. Refreshing...', 'error');
                setTimeout(() => {
                    window.location.reload();
                }, 3000);
            } else if (error.message.includes('timeout')) {
                showToast('Connection timeout. Check server availability.', 'error');
            } else {
                showToast(`Connection failed: ${error.message}`, 'error');
            }
        });

        // Reconnection events
        state.socket.on("reconnect", (attemptNumber) => {
            console.log(`✅ Reconnected after ${attemptNumber} attempts`);
            showToast('Connection restored', 'success');
        });

        state.socket.on("reconnect_attempt", (attemptNumber) => {
            console.log(`🔄 Reconnection attempt #${attemptNumber}`);
        });

        state.socket.on("reconnect_error", (error) => {
            console.error("❌ Reconnection error:", error);
        });

        state.socket.on("reconnect_failed", () => {
            console.error("❌ Reconnection failed - max attempts reached");
            showToast('Unable to reconnect to server', 'error');
        });

        // Server info event (sesuai dengan server.js)
        state.socket.on("server-info", (data) => {
            console.log("📋 Server info received:", data);
            if (data.message) {
                showToast(data.message, 'info');
            }
        });

        // Server error event (sesuai dengan server.js)
        state.socket.on("server-error", (errorData) => {
            console.error("⚠️ Server error received:", errorData);
            showToast(errorData.message || 'Server error occurred', 'error');
        });

        // FIXED: Handle device status updates sesuai dengan server.js
        state.socket.on("device-status", (statusData) => {
            console.log('📊 Received device status update:', statusData);
            console.log('Status data type:', typeof statusData);
            console.log('Status data length:', Array.isArray(statusData) ? statusData.length : 'Not array');

            handleStatusUpdate(statusData);
        });

        // Debug: Log all events
        state.socket.onAny((eventName, ...args) => {
            console.log(`🔊 Socket event '${eventName}':`, args);
        });

        console.log('Socket initialization completed');

    } catch (error) {
        console.error('Failed to initialize socket:', error);
        showToast('Failed to initialize real-time connection', 'error');
    }
}

// ENHANCED: Fetch dengan consistent API config dan 401 handling
async function fetchWithRetry(url, options = {}, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(url, {
                headers: getAPIConfig(), // Use consistent API config
                ...options,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                // Handle authentication errors
                if (response.status === 401) {
                    console.error('Authentication failed, clearing tokens');
                    clearAuthToken();
                    showToast('Authentication expired, please login again', 'error');
                    setTimeout(() => {
                        window.location.href = '/login';
                    }, 2000);
                    return null;
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.warn(`Fetch attempt ${i + 1} failed:`, error.message);
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
}

async function fetchNodes() {
    try {
        console.log('Fetching nodes from API...');

        const fetchedNodes = await fetchWithRetry('/api/nodes');

        if (!fetchedNodes) {
            throw new Error('No data received from API');
        }

        console.log(`Fetched ${fetchedNodes.length} nodes from server`);

        // Use array like map.js for consistency
        state.nodes = fetchedNodes.filter(node => isValidNode(node));

        console.log(`Processed ${state.nodes.length} valid nodes`);

        // Apply any existing status updates
        applyLiveStatus();

        // Update UI components
        updateAllComponents();

    } catch (error) {
        console.error('Error fetching nodes:', error);

        // Create some dummy nodes for testing connection
        console.log('Using dummy nodes for testing...');
        state.nodes = [
            {
                id: 1,
                name: 'Test Device 1',
                ip: '192.168.1.100',
                endpoint: 'test-device-1',
                coords: [-8.173358, 112.684885],
                status: 'offline',
                description: 'Test device for connection'
            },
            {
                id: 2,
                name: 'Test Device 2',
                ip: '192.168.1.101',
                endpoint: 'test-device-2',
                coords: [-8.173858, 112.685385],
                status: 'offline',
                description: 'Another test device'
            }
        ];

        updateAllComponents();
        showToast('Using test data - check API connection', 'warning');
    }
}

function isValidNode(node) {
    return node.endpoint &&
           node.coords &&
           Array.isArray(node.coords) &&
           node.coords.length === 2 &&
           !isNaN(parseFloat(node.coords[0])) &&
           !isNaN(parseFloat(node.coords[1]));
}

// FIXED: Handle status updates exactly like server.js format
function handleStatusUpdate(statusData) {
    console.log('=== HANDLING STATUS UPDATE ===');
    console.log('Raw status data:', statusData);
    console.log('Data type:', typeof statusData);
    console.log('Is array:', Array.isArray(statusData));

    if (!Array.isArray(statusData)) {
        console.warn('Status data is not an array:', statusData);
        return;
    }

    if (statusData.length === 0) {
        console.warn('Empty status data array');
        return;
    }

    if (state.syncInProgress) {
        console.log('Sync in progress, queuing status update');
        setTimeout(() => handleStatusUpdate(statusData), 100);
        return;
    }

    state.syncInProgress = true;

    try {
        console.log(`Processing ${statusData.length} status updates`);

        // Store latest status data
        state.latestStatus = statusData;

        // Log each status update for debugging
        statusData.forEach((update, index) => {
            console.log(`Status ${index + 1}:`, {
                endpoint: update.endpoint,
                status: update.status,
                timestamp: update.timestamp
            });
        });

        // Apply status updates to nodes
        applyLiveStatus();

        // Update UI components
        requestAnimationFrame(() => {
            updateAllComponents();
            state.syncInProgress = false;
            console.log('Status update completed');
        });

    } catch (error) {
        console.error('Error handling status update:', error);
        state.syncInProgress = false;
    }

    console.log('=== END STATUS UPDATE ===');
}

// FIXED: Apply live status updates sesuai format server
function applyLiveStatus() {
    if (!state.latestStatus || state.latestStatus.length === 0) {
        console.log('No latest status to apply');
        return;
    }

    console.log(`Applying live status to ${state.nodes.length} nodes`);

    let updatedCount = 0;

    state.latestStatus.forEach(update => {
        console.log(`Processing update for endpoint: ${update.endpoint}`);

        // Find node by endpoint (sesuai dengan format server)
        const node = state.nodes.find(n => {
            // Hapus prefix "Endpoint " jika ada (sesuai server logic)
            const cleanEndpoint = update.endpoint.replace(/^Endpoint\s*/i, '');
            const nodeEndpoint = n.endpoint.replace(/^Endpoint\s*/i, '');

            return nodeEndpoint === cleanEndpoint ||
                   n.endpoint === update.endpoint ||
                   n.endpoint.includes(update.endpoint) ||
                   update.endpoint.includes(n.endpoint);
        });

        if (!node) {
            console.warn(`No node found for endpoint: ${update.endpoint}`);
            console.log('Available nodes:', state.nodes.map(n => n.endpoint));
            return;
        }

        const oldStatus = node.status;
        const newStatus = normalizeStatus(update.status);

        // Update node status
        node.status = newStatus;
        node.last_ping_raw = update.timestamp || new Date().toISOString();
        node.lastPing = new Date(node.last_ping_raw).toLocaleTimeString('id-ID');

        // Log status changes
        console.log(`Node ${node.endpoint} status updated: ${oldStatus} → ${newStatus} (original: "${update.status}")`);
        updatedCount++;
    });

    console.log(`Updated ${updatedCount} nodes with new status`);
}

// Status normalization sesuai dengan server data format
function normalizeStatus(status) {
    if (!status) return 'offline';

    const statusStr = status.toString().toLowerCase().trim();

    console.log(`Normalizing status: "${statusStr}"`);

    // Handle "unavailable" or "0 of X" patterns - OFFLINE
    if (statusStr.includes('unavailable') ||
        statusStr.includes('0 of') ||
        statusStr === 'offline') {
        console.log(`→ Mapped to: offline`);
        return 'offline';
    }

    // Handle "not in use" patterns - ONLINE (available)
    if (statusStr.includes('not in use')) {
        console.log(`→ Mapped to: online`);
        return 'online';
    }

    // Handle "in use" patterns - PARTIAL (busy)
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

// Optimized marker management
function updateMapMarkers() {
    if (!state.map) return;

    // Clear existing markers
    state.markers.forEach(marker => {
        state.map.removeLayer(marker);
    });
    state.markers.clear();

    // Create markers for all nodes
    const markersCreated = [];
    state.nodes.forEach(node => {
        const marker = createOptimizedMarker(node);
        if (marker) {
            markersCreated.push(marker);
        }
    });

    console.log(`Updated ${markersCreated.length} map markers`);
}

function createOptimizedMarker(node) {
    const [lat, lng] = getLatLngFromCoords(node.coords);

    if (isNaN(lat) || isNaN(lng)) {
        console.warn(`Invalid coordinates for node ${node.endpoint}:`, node.coords);
        return null;
    }

    const color = STATUS_CONFIG.colors[node.status] || STATUS_CONFIG.colors.unknown;

    const marker = L.circleMarker([lat, lng], {
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

    // Lazy load popup content
    marker.bindPopup(() => getPopupContent(node, color), {
        maxWidth: 300,
        className: 'device-popup'
    });

    // Add click event
    marker.on('click', () => {
        console.log('Clicked on device:', node.endpoint);
    });

    marker.addTo(state.map);
    state.markers.set(node.endpoint, marker);

    return marker;
}

// Utility function to get lat/lng from coords
function getLatLngFromCoords(coords) {
    if (Array.isArray(coords) && coords.length >= 2) {
        return [parseFloat(coords[0]), parseFloat(coords[1])];
    }
    if (coords && coords.coordinates && Array.isArray(coords.coordinates)) {
        return [parseFloat(coords.coordinates[1]), parseFloat(coords.coordinates[0])]; // GeoJSON format
    }
    return [MAP_CONFIG.center[0], MAP_CONFIG.center[1]]; // Default coordinates
}

// Debounced UI updates
const debouncedUpdateStatusCounts = debounce(updateStatusCounts, 100);
const debouncedUpdateStatusList = debounce(updateStatusList, 150);

function updateAllComponents() {
    requestAnimationFrame(() => {
        updateMapMarkers();
        debouncedUpdateStatusCounts();
        debouncedUpdateStatusList();
    });
}

function updateStatusCounts() {
    const stats = { total: 0, online: 0, offline: 0, partial: 0 };

    state.nodes.forEach(node => {
        stats.total++;
        const normalizedStatus = normalizeStatus(node.status);
        stats[normalizedStatus] = (stats[normalizedStatus] || 0) + 1;
    });

    // Batch DOM updates
    const updates = [
        ['total-phones', stats.total],
        ['online-phones', stats.online],
        ['offline-phones', stats.offline],
        ['in-use-phones', stats.partial]
    ];

    updates.forEach(([id, value]) => updateElement(id, value));

    console.log('Status counts updated:', stats);
}

function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element && element.textContent !== String(value)) {
        element.textContent = value;
        element.classList.add('updated');
        setTimeout(() => element.classList.remove('updated'), 1000);
    }
}

function updateStatusList() {
    const statusListContainer = document.getElementById('status-list');
    if (!statusListContainer) return;

    // Sort nodes by status priority (like map.js)
    const sortedNodes = [...state.nodes].sort((a, b) => {
        const statusOrder = { 'online': 0, 'partial': 1, 'offline': 2, 'unknown': 3 };
        const aOrder = statusOrder[normalizeStatus(a.status)] || 3;
        const bOrder = statusOrder[normalizeStatus(b.status)] || 3;

        if (aOrder !== bOrder) return aOrder - bOrder;
        return a.name.localeCompare(b.name);
    });

    // Use DocumentFragment for efficient DOM manipulation
    const fragment = document.createDocumentFragment();
    sortedNodes.forEach(node => {
        const itemElement = createStatusListElement(node);
        fragment.appendChild(itemElement);
    });

    statusListContainer.replaceChildren(fragment);
}

function createStatusListElement(node) {
    const div = document.createElement('div');
    div.className = 'status-item flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow';
    div.dataset.endpoint = node.endpoint;

    const normalizedStatus = normalizeStatus(node.status);
    const color = STATUS_CONFIG.colors[normalizedStatus];
    const displayStatus = STATUS_CONFIG.displayNames[normalizedStatus];
    const lastPing = node.lastPing || (node.last_ping_raw ?
        new Date(node.last_ping_raw).toLocaleTimeString('id-ID') :
        'Never');

    div.innerHTML = `
        <div class="flex items-center gap-3">
            <div class="w-3 h-3 rounded-full" style="background-color: ${color}"></div>
            <div>
                <div class="font-semibold text-gray-800">${escapeHtml(node.name)}</div>
                <div class="text-sm text-gray-500">${escapeHtml(node.ip)} • ${escapeHtml(node.endpoint)}</div>
            </div>
        </div>
        <div class="text-right">
            <div class="text-sm font-medium" style="color: ${color}">${displayStatus}</div>
            <div class="text-xs text-gray-500">${lastPing}</div>
        </div>
    `;

    // Add click event to focus on map
    div.addEventListener('click', () => {
        focusOnNode(node);
    });

    return div;
}

// Focus on node in map
function focusOnNode(node) {
    if (!state.map) return;

    const [lat, lng] = getLatLngFromCoords(node.coords);
    state.map.setView([lat, lng], 18);

    const marker = state.markers.get(node.endpoint);
    if (marker) {
        marker.openPopup();
    }
}

// Security helper
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getPopupContent(node, color) {
    const normalizedStatus = normalizeStatus(node.status);
    const status = STATUS_CONFIG.displayNames[normalizedStatus];
    const lastPing = node.lastPing || (node.last_ping_raw ?
        new Date(node.last_ping_raw).toLocaleString('id-ID') :
        'Never');
    const uptime = node.uptime_percentage ? `${node.uptime_percentage}%` : 'N/A';

    return `
        <div class="device-popup-content">
            <div class="font-bold text-lg mb-2">${escapeHtml(node.name)}</div>
            <div class="space-y-1 text-sm">
                <div><strong>IP:</strong> ${escapeHtml(node.ip)}</div>
                <div><strong>Endpoint:</strong> ${escapeHtml(node.endpoint)}</div>
                <div><strong>Status:</strong> <span style="color:${color}; font-weight: bold;">${status}</span></div>
                <div><strong>Last Ping:</strong> ${lastPing}</div>
                <div><strong>Uptime:</strong> ${uptime}</div>
                <div><strong>Description:</strong> ${escapeHtml(node.description || '-')}</div>
            </div>
        </div>
    `;
}

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

    const toast = document.createElement('div');
    toast.className = `
        fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 transition-all duration-300 transform translate-x-full
        ${colors[type] || colors.info}
    `;

    toast.innerHTML = `
        <i class="fas fa-${icons[type] || icons.info} text-lg"></i>
        <span class="text-sm font-medium">${escapeHtml(message)}</span>
    `;

    document.body.appendChild(toast);

    setTimeout(() => toast.classList.remove('translate-x-full'), 50);

    setTimeout(() => {
        toast.classList.add('translate-x-full');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 4000);
}

// Optimized utility functions
const debouncedRefreshData = debounce(refreshData, 2000);

function refreshMap() {
    updateAllComponents();
    console.log('Map refreshed manually');
    showToast('Map refreshed', 'success');
}

async function refreshData() {
    if (state.syncInProgress) {
        console.log('Sync already in progress, skipping refresh');
        return;
    }

    console.log('Refreshing data...');
    showToast('Refreshing data...', 'info');

    try {
        await fetchNodes();
        showToast('Data refreshed successfully', 'success');
    } catch (error) {
        console.error('Error refreshing data:', error);
        showToast('Failed to refresh data', 'error');
    }
}

// ENHANCED: Debug functions dengan lebih banyak informasi koneksi
function debugNodeData() {
    const stats = {
        totalNodes: state.nodes.length,
        latestStatusCount: state.latestStatus.length,
        statusBreakdown: { online: 0, offline: 0, partial: 0, unknown: 0 },
        socketInfo: {
            connected: state.socket?.connected || false,
            id: state.socket?.id || null,
            transport: state.socket?.io?.engine?.transport?.name || null,
            pingInterval: state.socket?.io?.engine?.pingInterval || null,
            pingTimeout: state.socket?.io?.engine?.pingTimeout || null
        }
    };

    state.nodes.forEach(node => {
        const normalizedStatus = normalizeStatus(node.status);
        stats.statusBreakdown[normalizedStatus] = (stats.statusBreakdown[normalizedStatus] || 0) + 1;
    });

    console.log('=== DASHBOARD DEBUG INFO ===');
    console.log('Stats:', stats);
    console.log('Auth token:', getAuthToken());
    console.log('Socket config:', getSocketConfig());
    console.log('Markers count:', state.markers.size);
    console.log('Latest status data:', state.latestStatus);
    console.log('Node endpoints:', state.nodes.map(n => n.endpoint));
    console.log('Socket events:', state.socket?._callbacks || {});
    console.log('=== END DEBUG INFO ===');

    return stats;
}

// ENHANCED: Token debug function
function debugTokenInfo() {
    const tokenInfo = {
        appConfigToken: window.AppConfig?.authToken || null,
        legacyToken: window.userToken || null,
        sessionToken: sessionStorage.getItem('auth_token'),
        localToken: localStorage.getItem('auth_token'),
        metaToken: document.querySelector('meta[name="auth-token"]')?.getAttribute('content'),
        currentToken: getAuthToken(),
        userInfo: {
            id: window.AppConfig?.userId,
            name: window.AppConfig?.userName,
            authenticated: window.AppConfig?.isAuthenticated
        }
    };

    console.log('=== TOKEN DEBUG INFO ===');
    console.table(tokenInfo);
    console.log('API Headers:', getAPIConfig());
    console.log('Socket Auth:', getSocketConfig().options.auth);
    console.log('=== END TOKEN DEBUG ===');

    return tokenInfo;
}

// ENHANCED: Connection test function
function testConnection() {
    console.log('=== TESTING CONNECTION ===');

    // Test token first
    debugTokenInfo();

    // Test socket connection
    if (state.socket) {
        console.log('Socket status:', {
            connected: state.socket.connected,
            disconnected: state.socket.disconnected,
            id: state.socket.id,
            transport: state.socket.io?.engine?.transport?.name
        });

        // Emit test event
        state.socket.emit('test-connection', {
            timestamp: new Date().toISOString(),
            token: getAuthToken(),
            userId: window.AppConfig?.userId,
            message: 'Test from dashboard'
        });
    } else {
        console.log('Socket not initialized');
    }

    // Test API connection
    fetch('/api/nodes', { headers: getAPIConfig() })
        .then(response => {
            console.log('API test response:', response.status, response.statusText);
            console.log('Request headers:', getAPIConfig());
            return response.json();
        })
        .then(data => {
            console.log('API test data:', data.length, 'nodes');
        })
        .catch(error => {
            console.error('API test error:', error);
        });

    console.log('=== END CONNECTION TEST ===');
}

// ENHANCED: Force reconnect function
function forceReconnect() {
    console.log('Forcing socket reconnection with token refresh...');

    if (state.socket) {
        state.socket.disconnect();
    }

    // Clear cached tokens and re-store
    clearAuthToken();
    storeAuthToken(getAuthToken());

    setTimeout(() => {
        initializeSocket();
    }, 1000);

    showToast('Reconnecting with refreshed token...', 'info');
}

// Export functions for global access
Object.assign(window, {
    refreshMap,
    refreshData: debouncedRefreshData,
    debugNodeData,
    testConnection,
    forceReconnect,

    // Debug access to state
    getDashboardState: () => ({ ...state }),

    // Token utilities
    getAuthToken,
    debugTokenInfo,
    clearAuthToken,
    storeAuthToken,
    getAPIConfig,
    getSocketConfig,

    // Utility functions
    applyLiveStatus,
    normalizeStatus,
    focusOnNode,

    // Socket management
    getSocket: () => state.socket,
    initializeSocket
});

// Add optimized CSS styles
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

    .device-marker {
        transition: all 0.2s ease;
    }

    .device-marker:hover {
        transform: scale(1.1);
    }

    .status-item {
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .status-item:hover {
        background-color: #f0f9ff;
        transform: translateX(2px);
    }
`;
document.head.appendChild(style);

// Auto connection monitoring
let connectionCheckInterval;

function startConnectionMonitoring() {
    // Check connection every 30 seconds
    connectionCheckInterval = setInterval(() => {
        if (state.socket && !state.socket.connected) {
            console.log('Connection lost detected, attempting to reconnect...');
            forceReconnect();
        }
    }, 30000);

    console.log('Connection monitoring started');
}

function stopConnectionMonitoring() {
    if (connectionCheckInterval) {
        clearInterval(connectionCheckInterval);
        connectionCheckInterval = null;
        console.log('Connection monitoring stopped');
    }
}

// Enhanced cleanup on page unload
window.addEventListener('beforeunload', () => {
    console.log('Dashboard unloading, cleaning up...');

    if (state.socket) {
        console.log('Disconnecting socket...');
        state.socket.disconnect();
    }

    // Stop monitoring
    stopConnectionMonitoring();

    // Clear intervals and timeouts
    state.markers.clear();
    state.nodes.length = 0;
    state.latestStatus.length = 0;

    console.log('Cleanup completed');
});

// Optimized error handling
window.addEventListener('error', throttle((event) => {
    console.error('Unhandled error:', event.error);
    showToast('An unexpected error occurred', 'error');

    // Check connection if error is network related
    if (event.error.message && event.error.message.includes('fetch')) {
        testConnection();
    }
}, 5000));

window.addEventListener('unhandledrejection', throttle((event) => {
    console.error('Unhandled promise rejection:', event.reason);

    // Check if it's a connection issue
    if (event.reason && event.reason.message) {
        if (event.reason.message.includes('fetch') ||
            event.reason.message.includes('network') ||
            event.reason.message.includes('timeout')) {
            showToast('Connection issue detected', 'warning');
            testConnection();
        } else {
            showToast('A network error occurred', 'error');
        }
    }
}, 5000));

// Start monitoring after initialization
setTimeout(() => {
    if (state.isInitialized) {
        startConnectionMonitoring();
    }
}, 5000);

console.log('✅ Fixed Dashboard.js loaded successfully - Connection focused version');
console.log('🔑 Available debug functions:');
console.log('  - testConnection() - Test socket and API connection');
console.log('  - forceReconnect() - Force socket reconnection');
console.log('  - debugNodeData() - Debug dashboard state');
console.log('  - debugTokenInfo() - Debug token information');
console.log('  - clearAuthToken() - Clear stored tokens');
console.log('🔍 Expected server token: pindad_123 (or from AppConfig)');
