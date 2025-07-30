// resources/js/map.js - Optimized Version with Pagination & Enhanced Search
import { io } from 'socket.io-client';

// Global variables
let map;
let markers = {};
let nodes = [];
let filteredNodes = []; // For search functionality
let socket;
let editingNodeId = null;
let latestStatus = [];
let drawnItems;

// Pagination variables
let currentPage = 1;
let itemsPerPage = 10;
let totalPages = 1;

// Search variables
let searchTimeout = null;
let lastSearchQuery = '';

// API configuration
const apiHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
};

// Constants
const MAP_CONFIG = {
    center: [-8.173358, 112.684885],
    zoom: 17,
    maxZoom: 20
};

const STATUS_COLORS = {
    online: '#10b981',    // Green
    offline: '#ef4444',   // Red
    partial: '#f59e0b',   // Yellow
    unknown: '#6b7280'    // Gray
};

const STATUS_DISPLAY = {
    online: 'Online',
    offline: 'Offline',
    partial: 'In Use',
    unknown: 'Unknown'
};

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        initializeMap();
        await fetchNodes();
        initializeSocket();
        setupEventListeners();
        setupPagination();
        setupSearch();

        // Auto refresh every 30 seconds
        setInterval(refreshData, 30000);

        console.log('Map initialized successfully');
    } catch (error) {
        console.error('Map initialization error:', error);
        showToast('Failed to initialize map', 'error');
    }
});

// Socket.IO connection
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

// Handle real-time status updates
function handleStatusUpdate(statusData) {
    if (!Array.isArray(statusData) || statusData.length === 0) {
        console.warn('Invalid status data received:', statusData);
        return;
    }

    latestStatus = statusData;
    applyLiveStatus();
    updateUI();
}

// Fetch nodes from API
async function fetchNodes() {
    try {
        const response = await fetch('/api/nodes', { headers: apiHeaders });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        nodes = await response.json();
        filteredNodes = [...nodes]; // Initialize filtered nodes
        console.log('Fetched nodes:', nodes);

        applyLiveStatus();
        updateUI();

    } catch (error) {
        console.error('Error fetching nodes:', error);
        showToast('Failed to load device data', 'error');
    }
}

// Initialize Leaflet map
function initializeMap() {
    // Create map
    map = L.map('map').setView(MAP_CONFIG.center, MAP_CONFIG.zoom);

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

    // Drawing controls
    setupDrawingControls();

    console.log('Map initialized');
}

// Setup drawing controls
function setupDrawingControls() {
    drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    const drawControl = new L.Control.Draw({
        edit: {
            featureGroup: drawnItems,
            remove: true
        },
        draw: {
            polygon: true,
            polyline: true,
            rectangle: true,
            circle: true,
            marker: true,
            circlemarker: false
        }
    });

    map.addControl(drawControl);

    // Handle drawing events
    map.on('draw:created', handleDrawCreated);
    map.on('draw:edited', handleDrawEdited);
    map.on('draw:deleted', handleDrawDeleted);
}

// Handle draw created event
function handleDrawCreated(e) {
    const layer = e.layer;
    const type = e.layerType;

    drawnItems.addLayer(layer);

    let lat, lng, description = '';

    if (type === 'marker') {
        const latlng = layer.getLatLng();
        lat = latlng.lat;
        lng = latlng.lng;
    } else if (type === 'circle') {
        const latlng = layer.getLatLng();
        const radius = layer.getRadius();
        lat = latlng.lat;
        lng = latlng.lng;
        description = `Circle - Radius: ${radius.toFixed(2)}m`;
    } else if (type === 'rectangle' || type === 'polygon') {
        const bounds = layer.getBounds();
        const center = bounds.getCenter();
        lat = center.lat;
        lng = center.lng;
        description = `${type.charAt(0).toUpperCase() + type.slice(1)} Area`;
    } else if (type === 'polyline') {
        const latlngs = layer.getLatLngs();
        lat = latlngs[0].lat;
        lng = latlngs[0].lng;

        // Calculate total distance
        let totalDistance = 0;
        for (let i = 1; i < latlngs.length; i++) {
            totalDistance += latlngs[i - 1].distanceTo(latlngs[i]);
        }
        description = `Line - Length: ${totalDistance.toFixed(2)}m`;
    }

    // Open modal with pre-filled coordinates
    openAddModal(lat, lng, description);
}

// Handle draw edited event
function handleDrawEdited(e) {
    console.log('Shapes edited:', e.layers);
}

// Handle draw deleted event
function handleDrawDeleted(e) {
    console.log('Shapes deleted:', e.layers);
}

// Status normalization function
function normalizeStatus(status) {
    if (!status) return 'offline';

    const statusStr = status.toString().toLowerCase().trim();

    // Handle "unavailable" or "0 of X" patterns - OFFLINE
    if (statusStr.includes('unavailable') ||
        statusStr.includes('0 of') ||
        statusStr === 'offline') {
        return 'offline';
    }

    // Handle "not in use" patterns - ONLINE (available)
    if (statusStr.includes('not in use')) {
        return 'online';
    }

    // Handle "in use" patterns - PARTIAL (busy)
    if (statusStr.includes('in use')) {
        return 'partial';
    }

    // Handle other patterns
    if (statusStr.includes('available') || statusStr === 'online') {
        return 'online';
    }

    if (statusStr.includes('partial') || statusStr.includes('busy')) {
        return 'partial';
    }

    return 'offline';
}

// Apply live status updates
function applyLiveStatus() {
    if (!latestStatus || latestStatus.length === 0) return;

    latestStatus.forEach(update => {
        const node = nodes.find(n => n.endpoint === update.endpoint);
        if (!node) return;

        const oldStatus = node.status;
        const newStatus = normalizeStatus(update.status);

        node.status = newStatus;
        node.last_ping_raw = update.timestamp || new Date().toISOString();

        // Update marker if exists
        const marker = markers[node.endpoint];
        if (marker) {
            const color = STATUS_COLORS[newStatus];
            marker.setStyle({
                color: color,
                fillColor: color
            });
            marker.setPopupContent(getPopupContent(node));
        }

        // Log status changes
        if (oldStatus !== newStatus) {
            console.log(`Node ${node.endpoint} status: ${oldStatus} → ${newStatus}`);
        }
    });

    // Update filtered nodes if search is active
    if (lastSearchQuery) {
        performSearch(lastSearchQuery);
    }
}

// Enhanced Search Functionality
function setupSearch() {
    const searchInput = document.getElementById('deviceSearch');
    const searchButton = document.querySelector('button[onclick="filterDevices()"]');
    const clearButton = createClearButton();
    
    if (!searchInput) return;

    // Insert clear button after search input
    searchInput.parentNode.insertBefore(clearButton, searchButton);

    // Real-time search with debouncing
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        
        // Clear previous timeout
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        // Show/hide clear button
        clearButton.style.display = query ? 'block' : 'none';

        // Debounce search
        searchTimeout = setTimeout(() => {
            performSearch(query);
        }, 300);
    });

    // Handle Enter key
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            performSearch(e.target.value.trim());
        }
    });

    // Clear search
    clearButton.addEventListener('click', () => {
        searchInput.value = '';
        clearButton.style.display = 'none';
        performSearch('');
        searchInput.focus();
    });
}

function createClearButton() {
    const clearButton = document.createElement('button');
    clearButton.type = 'button';
    clearButton.className = 'bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition ml-2';
    clearButton.style.display = 'none';
    clearButton.innerHTML = '<i class="fas fa-times"></i>';
    clearButton.title = 'Clear search';
    return clearButton;
}

function performSearch(query) {
    lastSearchQuery = query;

    if (!query) {
        // Reset to show all nodes
        filteredNodes = [...nodes];
        updateSearchResults();
        return;
    }

    const searchTerm = query.toLowerCase();
    
    // Advanced search across multiple fields
    filteredNodes = nodes.filter(node => {
        const searchFields = [
            node.name?.toLowerCase() || '',
            node.ip?.toLowerCase() || '',
            node.endpoint?.toLowerCase() || '',
            node.description?.toLowerCase() || '',
            STATUS_DISPLAY[node.status]?.toLowerCase() || '',
            `${node.coords?.[0] || ''} ${node.coords?.[1] || ''}` // coordinates
        ];

        return searchFields.some(field => field.includes(searchTerm));
    });

    updateSearchResults();
}

function updateSearchResults() {
    // Reset to first page when search changes
    currentPage = 1;
    updatePagination();
    updateNodesTable();
    
    // Update search results info
    updateSearchInfo();
}

function updateSearchInfo() {
    const searchInfo = document.getElementById('search-info');
    if (!searchInfo) return;

    const total = nodes.length;
    const filtered = filteredNodes.length;
    
    if (lastSearchQuery) {
        searchInfo.textContent = `Showing ${filtered} of ${total} devices`;
        searchInfo.className = 'text-sm text-gray-600 mb-4';
    } else {
        searchInfo.textContent = '';
    }
}

// Pagination Setup
function setupPagination() {
    createPaginationControls();
    updatePagination();
}

function createPaginationControls() {
    const tableContainer = document.querySelector('.overflow-x-auto');
    if (!tableContainer) return;

    // Create pagination container
    const paginationContainer = document.createElement('div');
    paginationContainer.id = 'pagination-container';
    paginationContainer.className = 'flex items-center justify-between mt-6 p-4 bg-gray-50 rounded-lg';

    // Items per page selector
    const itemsPerPageContainer = document.createElement('div');
    itemsPerPageContainer.className = 'flex items-center gap-2';
    itemsPerPageContainer.innerHTML = `
        <label class="text-sm text-gray-700">Items per page:</label>
        <select id="items-per-page-select" class="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 text-sm">
            <option value="5">5</option>
            <option value="10" selected>10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
        </select>
    `;

    // Pagination info
    const paginationInfo = document.createElement('div');
    paginationInfo.id = 'pagination-info';
    paginationInfo.className = 'text-sm text-gray-700';

    // Pagination buttons
    const paginationButtons = document.createElement('div');
    paginationButtons.id = 'pagination-buttons';
    paginationButtons.className = 'flex items-center gap-2';

    // Search info
    const searchInfo = document.createElement('div');
    searchInfo.id = 'search-info';
    searchInfo.className = 'text-sm text-gray-600 mb-4';

    paginationContainer.appendChild(itemsPerPageContainer);
    paginationContainer.appendChild(paginationInfo);
    paginationContainer.appendChild(paginationButtons);

    // Insert before table container
    tableContainer.parentNode.insertBefore(searchInfo, tableContainer);
    tableContainer.parentNode.insertBefore(paginationContainer, tableContainer.nextSibling);

    // Event listeners
    document.getElementById('items-per-page-select').addEventListener('change', (e) => {
        itemsPerPage = parseInt(e.target.value);
        currentPage = 1;
        updatePagination();
        updateNodesTable();
    });
}

function updatePagination() {
    const totalItems = filteredNodes.length;
    totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    
    // Ensure current page is valid
    if (currentPage > totalPages) {
        currentPage = totalPages;
    }

    updatePaginationInfo();
    updatePaginationButtons();
}

function updatePaginationInfo() {
    const paginationInfo = document.getElementById('pagination-info');
    if (!paginationInfo) return;

    const totalItems = filteredNodes.length;
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    paginationInfo.textContent = `Showing ${startItem}-${endItem} of ${totalItems} results`;
}

function updatePaginationButtons() {
    const buttonsContainer = document.getElementById('pagination-buttons');
    if (!buttonsContainer) return;

    buttonsContainer.innerHTML = '';

    // Previous button
    const prevButton = createPaginationButton(
        '<i class="fas fa-chevron-left"></i>',
        currentPage > 1,
        () => changePage(currentPage - 1)
    );
    buttonsContainer.appendChild(prevButton);

    // Page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // First page + ellipsis
    if (startPage > 1) {
        buttonsContainer.appendChild(createPaginationButton('1', true, () => changePage(1)));
        if (startPage > 2) {
            buttonsContainer.appendChild(createEllipsis());
        }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
        buttonsContainer.appendChild(createPaginationButton(
            i.toString(),
            true,
            () => changePage(i),
            i === currentPage
        ));
    }

    // Last page + ellipsis
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            buttonsContainer.appendChild(createEllipsis());
        }
        buttonsContainer.appendChild(createPaginationButton(
            totalPages.toString(),
            true,
            () => changePage(totalPages)
        ));
    }

    // Next button
    const nextButton = createPaginationButton(
        '<i class="fas fa-chevron-right"></i>',
        currentPage < totalPages,
        () => changePage(currentPage + 1)
    );
    buttonsContainer.appendChild(nextButton);
}

function createPaginationButton(text, enabled, onClick, isActive = false) {
    const button = document.createElement('button');
    button.innerHTML = text;
    button.className = `px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
        isActive 
            ? 'bg-indigo-600 text-white font-semibold shadow-md'
            : enabled 
                ? 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 hover:shadow-sm'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
    }`;
    
    if (enabled && !isActive) {
        button.addEventListener('click', onClick);
        button.style.cursor = 'pointer';
    }

    return button;
}

function createEllipsis() {
    const ellipsis = document.createElement('span');
    ellipsis.textContent = '...';
    ellipsis.className = 'px-2 py-2 text-gray-500';
    return ellipsis;
}

function changePage(page) {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
        currentPage = page;
        updatePagination();
        updateNodesTable();
        
        // Scroll to table top
        document.querySelector('.overflow-x-auto').scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Update all UI components
function updateUI() {
    updateMapMarkers();
    updateNodesTable();
    updateStatusList();
    updateRealtimeStats();
    updatePagination();
    updateSearchInfo();
}

// Update map markers
function updateMapMarkers() {
    // Clear existing markers
    Object.values(markers).forEach(marker => {
        if (map.hasLayer(marker)) {
            map.removeLayer(marker);
        }
    });
    markers = {};

    // Create new markers for all nodes (not just filtered ones)
    nodes.forEach(node => {
        createMarkerForNode(node);
    });

    console.log(`Updated ${Object.keys(markers).length} markers`);
}

// Create marker for node
function createMarkerForNode(node) {
    const [lat, lng] = getLatLngFromCoords(node.coords);

    if (isNaN(lat) || isNaN(lng)) {
        console.warn(`Invalid coordinates for node ${node.id}:`, node.coords);
        return;
    }

    const color = STATUS_COLORS[node.status] || STATUS_COLORS.unknown;

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

    // Bind popup
    marker.bindPopup(getPopupContent(node), {
        maxWidth: 350,
        className: 'device-popup'
    });

    // Add click event
    marker.on('click', () => {
        console.log('Clicked on device:', node.endpoint);
    });

    marker.addTo(map);
    markers[node.endpoint] = marker;
}

// Get popup content for marker
function getPopupContent(node) {
    const color = STATUS_COLORS[node.status] || STATUS_COLORS.unknown;
    const statusText = STATUS_DISPLAY[node.status] || STATUS_DISPLAY.unknown;
    const lastPing = node.last_ping_raw ?
        new Date(node.last_ping_raw).toLocaleString('id-ID') :
        'Never';

    return `
        <div class="device-popup-content" style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; min-width: 250px; margin: 10px;">
            <div style="border-bottom: 2px solid ${color}; padding-bottom: 8px; margin-bottom: 12px;">
                <h4 style="margin: 0; font-size: 16px; font-weight: 600; color: #1f2937;">${node.name}</h4>
            </div>

            <div style="space-y: 8px; font-size: 14px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                    <span style="color: #6b7280;">Device ID:</span>
                    <span style="font-weight: 500;">${node.id}</span>
                </div>

                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                    <span style="color: #6b7280;">Endpoint:</span>
                    <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 12px;">${node.endpoint}</code>
                </div>

                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                    <span style="color: #6b7280;">Status:</span>
                    <span style="color: ${color}; font-weight: 600;">${statusText}</span>
                </div>

                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                    <span style="color: #6b7280;">IP Address:</span>
                    <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 12px;">${node.ip}</code>
                </div>

                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                    <span style="color: #6b7280;">Last Ping:</span>
                    <span style="font-size: 12px;">${lastPing}</span>
                </div>

                <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                    <span style="color: #6b7280;">Description:</span>
                    <span style="font-size: 12px; max-width: 120px; text-align: right;">${node.description || '-'}</span>
                </div>
            </div>

            <div style="border-top: 1px solid #e5e7eb; padding-top: 8px; display: flex; gap: 8px; justify-content: center;">
                <button onclick="editNode(${node.id})" style="
                    background: #3b82f6;
                    color: white;
                    border: none;
                    padding: 6px 12px;
                    border-radius: 6px;
                    font-size: 12px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                ">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button onclick="deleteNode(${node.id})" style="
                    background: #ef4444;
                    color: white;
                    border: none;
                    padding: 6px 12px;
                    border-radius: 6px;
                    font-size: 12px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                ">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `;
}

// Update nodes table with pagination
function updateNodesTable() {
    const tableBody = document.getElementById('nodes-table-body');
    if (!tableBody) return;

    // Show loading state
    tableBody.innerHTML = '<tr><td colspan="8" class="text-center py-8"><div class="loading">Loading...</div></td></tr>';

    // Simulate small delay for better UX
    setTimeout(() => {
        tableBody.innerHTML = '';

        // Calculate pagination bounds
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedNodes = filteredNodes.slice(startIndex, endIndex);

        if (paginatedNodes.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `
                <td colspan="8" class="px-4 py-8 text-center text-gray-500">
                    <div class="flex flex-col items-center gap-3">
                        <i class="fas fa-search text-3xl text-gray-300"></i>
                        <div>
                            <div class="font-medium">No devices found</div>
                            <div class="text-sm">Try adjusting your search criteria</div>
                        </div>
                    </div>
                </td>
            `;
            tableBody.appendChild(emptyRow);
            return;
        }

        paginatedNodes.forEach((node, index) => {
            const [lat, lng] = getLatLngFromCoords(node.coords);
            const color = STATUS_COLORS[node.status] || STATUS_COLORS.unknown;
            const statusText = STATUS_DISPLAY[node.status] || STATUS_DISPLAY.unknown;
            const lastPing = node.last_ping_raw ?
                new Date(node.last_ping_raw).toLocaleString('id-ID') :
                'Never';

            const row = document.createElement('tr');
            row.className = `hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`;
            row.innerHTML = `
                <td class="px-4 py-3 text-sm font-medium text-gray-900">${node.name}</td>
                <td class="px-4 py-3 text-sm font-mono text-gray-600">${node.ip}</td>
                <td class="px-4 py-3 text-sm font-mono text-gray-600">${node.endpoint}</td>
                <td class="px-4 py-3 text-sm">
                    <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                          style="background-color: ${color}20; color: ${color};">
                        <div class="w-2 h-2 rounded-full mr-1.5" style="background-color: ${color};"></div>
                        ${statusText}
                    </span>
                </td>
                <td class="px-4 py-3 text-sm text-gray-600">${lat.toFixed(6)}, ${lng.toFixed(6)}</td>
                <td class="px-4 py-3 text-sm text-gray-600">${node.description || '-'}</td>
                <td class="px-4 py-3 text-sm text-gray-500">${lastPing}</td>
                <td class="px-4 py-3 text-sm">
                    <div class="flex space-x-2">
                        <button onclick="editNode(${node.id})"
                                class="text-indigo-600 hover:text-indigo-900 transition-colors"
                                title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deleteNode(${node.id})"
                                class="text-red-600 hover:text-red-900 transition-colors"
                                title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                        <button onclick="focusOnNode(${node.id})"
                                class="text-green-600 hover:text-green-900 transition-colors"
                                title="Focus on Map">
                            <i class="fas fa-search-location"></i>
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }, 100);
}

// Update status list
function updateStatusList() {
    const statusList = document.getElementById('phone-status-list');
    if (!statusList) return;

    statusList.innerHTML = '';

    // Sort nodes by status priority
    const sortedNodes = [...nodes].sort((a, b) => {
        const statusOrder = { online: 0, partial: 1, offline: 2, unknown: 3 };
        const aOrder = statusOrder[a.status] || 3;
        const bOrder = statusOrder[b.status] || 3;
        if (aOrder !== bOrder) return aOrder - bOrder;
        return a.name.localeCompare(b.name);
    });

    sortedNodes.forEach(node => {
        const color = STATUS_COLORS[node.status] || STATUS_COLORS.unknown;
        const lastPing = node.last_ping_raw ?
            new Date(node.last_ping_raw).toLocaleString('id-ID') :
            'Never';

        const statusItem = document.createElement('div');
        statusItem.className = 'flex items-center gap-4 p-3 rounded-xl hover:bg-indigo-50 transition-all cursor-pointer border border-transparent hover:border-indigo-200';
        statusItem.onclick = () => focusOnNode(node.id);

        statusItem.innerHTML = `
            <div class="w-3 h-3 rounded-full shadow-sm" style="background: ${color};"></div>
            <div class="flex-1 min-w-0">
                <div class="font-semibold text-gray-800 truncate">${node.name}</div>
                <div class="text-sm text-gray-600 truncate">${node.ip}</div>
                <div class="text-xs text-gray-500">${node.endpoint}</div>
            </div>
            <div class="text-right text-xs">
                <div class="font-medium text-gray-700">${node.uptime || '99%'}</div>
                <div class="text-gray-500">${lastPing}</div>
            </div>
        `;

        statusList.appendChild(statusItem);
    });
}

// Update real-time statistics
function updateRealtimeStats() {
    const total = nodes.length;
    const online = nodes.filter(n => n.status === 'online').length;
    const offline = nodes.filter(n => n.status === 'offline').length;
    const inUse = nodes.filter(n => n.status === 'partial').length;

    updateElement('total-phones', total);
    updateElement('online-phones', online);
    updateElement('offline-phones', offline);
    updateElement('in-use-phones', inUse);

    console.log('Stats updated:', { total, online, offline, inUse });
}

// Update DOM element with animation
function updateElement(id, value) {
    const element = document.getElementById(id);
    if (!element) return;

    if (element.textContent !== value.toString()) {
        element.textContent = value;
        element.classList.add('updated');
        setTimeout(() => element.classList.remove('updated'), 1000);
    }
}

// Utility functions
function getLatLngFromCoords(coords) {
    if (Array.isArray(coords) && coords.length >= 2) {
        return [parseFloat(coords[0]), parseFloat(coords[1])];
    }
    if (coords && coords.coordinates && Array.isArray(coords.coordinates)) {
        return [parseFloat(coords.coordinates[1]), parseFloat(coords.coordinates[0])]; // GeoJSON format
    }
    return [MAP_CONFIG.center[0], MAP_CONFIG.center[1]]; // Default coordinates
}

// Setup event listeners
function setupEventListeners() {
    // Modal events
    const modal = document.getElementById('nodeModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    // Form submission
    const nodeForm = document.getElementById('nodeForm');
    if (nodeForm) {
        nodeForm.addEventListener('submit', handleFormSubmit);
    }

    // Keyboard events
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
        
        // Pagination keyboard shortcuts
        if (e.ctrlKey && e.key === 'ArrowLeft') {
            e.preventDefault();
            if (currentPage > 1) changePage(currentPage - 1);
        }
        if (e.ctrlKey && e.key === 'ArrowRight') {
            e.preventDefault();
            if (currentPage < totalPages) changePage(currentPage + 1);
        }
        
        // Focus search with Ctrl+F
        if (e.ctrlKey && e.key === 'f') {
            e.preventDefault();
            const searchInput = document.getElementById('deviceSearch');
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }
    });
}

// Handle form submission
function handleFormSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const lat = parseFloat(formData.get('latitude'));
    const lng = parseFloat(formData.get('longitude'));

    if (isNaN(lat) || isNaN(lng)) {
        showToast('Invalid coordinates', 'error');
        return;
    }

    const nodeData = {
        name: formData.get('name'),
        ip: formData.get('ip'),
        endpoint: formData.get('endpoint'),
        status: formData.get('status') || 'offline',
        latitude: lat,
        longitude: lng,
        description: formData.get('description'),
        coords: [lat, lng]
    };

    if (editingNodeId) {
        updateNode(editingNodeId, nodeData);
    } else {
        createNode(nodeData);
    }

    closeModal();
}

// CRUD Operations
async function createNode(nodeData) {
    try {
        const response = await fetch('/api/nodes', {
            method: 'POST',
            headers: apiHeaders,
            body: JSON.stringify(nodeData),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const newNode = await response.json();
        nodes.push(newNode);
        
        // Update filtered nodes if search is active
        if (lastSearchQuery) {
            performSearch(lastSearchQuery);
        } else {
            filteredNodes = [...nodes];
        }
        
        updateUI();
        showToast('Device added successfully!', 'success');

    } catch (error) {
        console.error('Error creating node:', error);
        showToast('Failed to add device', 'error');
    }
}

async function updateNode(id, nodeData) {
    try {
        const response = await fetch(`/api/nodes/${id}`, {
            method: 'PUT',
            headers: apiHeaders,
            body: JSON.stringify(nodeData),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const updatedNode = await response.json();
        const index = nodes.findIndex(node => node.id === id);
        if (index !== -1) {
            nodes[index] = updatedNode;
            
            // Update filtered nodes if search is active
            if (lastSearchQuery) {
                performSearch(lastSearchQuery);
            } else {
                filteredNodes = [...nodes];
            }
            
            updateUI();
        }

        showToast('Device updated successfully!', 'success');

    } catch (error) {
        console.error('Error updating node:', error);
        showToast('Failed to update device', 'error');
    }
}

async function deleteNode(id) {
    showConfirmModal(
        'Are you sure you want to delete this device? This action cannot be undone.',
        async () => {
            try {
                const response = await fetch(`/api/nodes/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                nodes = nodes.filter(node => node.id !== id);
                
                // Update filtered nodes if search is active
                if (lastSearchQuery) {
                    performSearch(lastSearchQuery);
                } else {
                    filteredNodes = [...nodes];
                }
                
                // Adjust current page if necessary
                const newTotalPages = Math.ceil(filteredNodes.length / itemsPerPage) || 1;
                if (currentPage > newTotalPages) {
                    currentPage = newTotalPages;
                }
                
                updateUI();
                showToast('Device deleted successfully!', 'success');

            } catch (error) {
                console.error('Error deleting node:', error);
                showToast('Failed to delete device', 'error');
            }
        }
    );
}

// Enhanced Filter Functions
function filterDevices() {
    const searchInput = document.getElementById('deviceSearch');
    if (searchInput) {
        performSearch(searchInput.value.trim());
    }
}

function resetFilters() {
    const searchInput = document.getElementById('deviceSearch');
    const clearButton = document.querySelector('button[onclick="clearSearch()"]');
    
    if (searchInput) {
        searchInput.value = '';
    }
    if (clearButton) {
        clearButton.style.display = 'none';
    }
    
    performSearch('');
}

// Advanced search with filters
function setupAdvancedSearch() {
    // Create advanced search panel
    const searchContainer = document.querySelector('#deviceSearch').parentNode;
    
    const advancedToggle = document.createElement('button');
    advancedToggle.type = 'button';
    advancedToggle.className = 'text-sm text-indigo-600 hover:text-indigo-800 ml-2';
    advancedToggle.innerHTML = '<i class="fas fa-filter"></i> Advanced';
    advancedToggle.onclick = toggleAdvancedSearch;
    
    searchContainer.appendChild(advancedToggle);
    
    // Advanced search panel
    const advancedPanel = document.createElement('div');
    advancedPanel.id = 'advanced-search-panel';
    advancedPanel.className = 'hidden mt-4 p-4 bg-gray-50 rounded-lg border';
    advancedPanel.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select id="status-filter" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="">All Status</option>
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                    <option value="partial">In Use</option>
                    <option value="unknown">Unknown</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">IP Range</label>
                <input type="text" id="ip-filter" placeholder="e.g., 192.168.1" 
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Last Ping</label>
                <select id="ping-filter" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="">Any time</option>
                    <option value="1">Last hour</option>
                    <option value="24">Last 24 hours</option>
                    <option value="168">Last week</option>
                </select>
            </div>
        </div>
        <div class="mt-4 flex gap-2">
            <button onclick="applyAdvancedFilters()" 
                    class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
                Apply Filters
            </button>
            <button onclick="clearAdvancedFilters()" 
                    class="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400">
                Clear
            </button>
        </div>
    `;
    
    searchContainer.parentNode.insertBefore(advancedPanel, searchContainer.nextSibling);
}

function toggleAdvancedSearch() {
    const panel = document.getElementById('advanced-search-panel');
    if (panel) {
        panel.classList.toggle('hidden');
    }
}

function applyAdvancedFilters() {
    const statusFilter = document.getElementById('status-filter')?.value;
    const ipFilter = document.getElementById('ip-filter')?.value;
    const pingFilter = document.getElementById('ping-filter')?.value;
    
    filteredNodes = nodes.filter(node => {
        // Status filter
        if (statusFilter && node.status !== statusFilter) {
            return false;
        }
        
        // IP filter
        if (ipFilter && !node.ip.includes(ipFilter)) {
            return false;
        }
        
        // Ping filter (hours)
        if (pingFilter && node.last_ping_raw) {
            const lastPing = new Date(node.last_ping_raw);
            const hoursAgo = new Date(Date.now() - (parseInt(pingFilter) * 60 * 60 * 1000));
            if (lastPing < hoursAgo) {
                return false;
            }
        }
        
        return true;
    });
    
    // Also apply text search if active
    const searchQuery = document.getElementById('deviceSearch')?.value;
    if (searchQuery) {
        const searchTerm = searchQuery.toLowerCase();
        filteredNodes = filteredNodes.filter(node => {
            const searchFields = [
                node.name?.toLowerCase() || '',
                node.ip?.toLowerCase() || '',
                node.endpoint?.toLowerCase() || '',
                node.description?.toLowerCase() || ''
            ];
            return searchFields.some(field => field.includes(searchTerm));
        });
    }
    
    currentPage = 1;
    updateUI();
    showToast(`Found ${filteredNodes.length} devices`, 'info');
}

function clearAdvancedFilters() {
    document.getElementById('status-filter').value = '';
    document.getElementById('ip-filter').value = '';
    document.getElementById('ping-filter').value = '';
    
    filteredNodes = [...nodes];
    currentPage = 1;
    updateUI();
}

// Modal functions
function openAddModal(lat = null, lng = null, description = '') {
    document.getElementById('modal-title').textContent = 'Add New Device';
    document.getElementById('nodeForm').reset();

    if (lat !== null && lng !== null) {
        setTimeout(() => {
            document.getElementById('nodeLatitude').value = lat.toFixed(6);
            document.getElementById('nodeLongitude').value = lng.toFixed(6);
            if (description) {
                document.getElementById('nodeDescription').value = description;
            }
        }, 100);
    }

    editingNodeId = null;
    document.getElementById('nodeModal').style.display = 'block';
}

function editNode(id) {
    const node = nodes.find(n => n.id === id);
    if (!node) return;

    const [lat, lng] = getLatLngFromCoords(node.coords);

    document.getElementById('modal-title').textContent = 'Edit Device';
    document.getElementById('nodeName').value = node.name;
    document.getElementById('nodeIP').value = node.ip;
    document.getElementById('nodeEndpoint').value = node.endpoint || '';
    document.getElementById('nodeDescription').value = node.description || '';
    document.getElementById('nodeStatus').value = node.status;
    document.getElementById('nodeLatitude').value = lat.toFixed(6);
    document.getElementById('nodeLongitude').value = lng.toFixed(6);

    editingNodeId = id;
    document.getElementById('nodeModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('nodeModal').style.display = 'none';
    editingNodeId = null;
}

function focusOnNode(id) {
    const node = nodes.find(n => n.id === id);
    if (!node) return;

    const [lat, lng] = getLatLngFromCoords(node.coords);
    map.setView([lat, lng], 18);

    const marker = markers[node.endpoint];
    if (marker) {
        marker.openPopup();
    }
}

// Utility functions
function refreshData() {
    fetchNodes();
}

function refreshMap() {
    refreshData();
    showToast('Map refreshed', 'success');
}

// Export functions for global access and backward compatibility
function clearSearch() {
    resetFilters();
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


// Confirmation modal
function showConfirmModal(message, onConfirm, onCancel = null) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(5px);
        z-index: 10000; display: flex; align-items: center; justify-content: center;
        animation: fadeIn 0.2s ease-out;
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
        background: white; border-radius: 16px; padding: 24px; max-width: 400px;
        width: 90%; box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease-out;
    `;

    modal.innerHTML = `
        <div style="text-align: center;">
            <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #fee2e2, #fecaca);
                        border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center;
                        justify-content: center; font-size: 24px;">⚠️</div>
            <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #1f2937;">Confirmation</h3>
            <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 14px; line-height: 1.5;">${message}</p>
            <div style="display: flex; gap: 12px; justify-content: center;">
                <button id="cancelBtn" style="padding: 10px 20px; border: 2px solid #e5e7eb; background: white;
                                              color: #6b7280; border-radius: 8px; cursor: pointer; font-size: 14px;
                                              font-weight: 500; transition: all 0.2s; min-width: 80px;">Cancel</button>
                <button id="confirmBtn" style="padding: 10px 20px; border: none;
                                               background: linear-gradient(135deg, #ef4444, #dc2626); color: white;
                                               border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500;
                                               transition: all 0.2s; min-width: 80px;">Delete</button>
            </div>
        </div>
    `;

    // Add keyframes for animations if not exists
    if (!document.getElementById('modal-keyframes')) {
        const style = document.createElement('style');
        style.id = 'modal-keyframes';
        style.textContent = `
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideIn { from { transform: translateY(-50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
        `;
        document.head.appendChild(style);
    }

    const confirmBtn = modal.querySelector('#confirmBtn');
    const cancelBtn = modal.querySelector('#cancelBtn');

    // Hover effects
    confirmBtn.addEventListener('mouseenter', () => {
        confirmBtn.style.transform = 'translateY(-1px)';
        confirmBtn.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.4)';
    });

    confirmBtn.addEventListener('mouseleave', () => {
        confirmBtn.style.transform = 'translateY(0)';
        confirmBtn.style.boxShadow = 'none';
    });

    cancelBtn.addEventListener('mouseenter', () => {
        cancelBtn.style.background = '#f9fafb';
        cancelBtn.style.borderColor = '#d1d5db';
        cancelBtn.style.transform = 'translateY(-1px)';
    });

    cancelBtn.addEventListener('mouseleave', () => {
        cancelBtn.style.background = 'white';
        cancelBtn.style.borderColor = '#e5e7eb';
        cancelBtn.style.transform = 'translateY(0)';
    });

    function closeModal() {
        overlay.style.animation = 'fadeOut 0.2s ease-out';
        setTimeout(() => {
            if (document.body.contains(overlay)) {
                document.body.removeChild(overlay);
            }
        }, 200);
    }

    confirmBtn.addEventListener('click', () => {
        closeModal();
        if (onConfirm) onConfirm();
    });

    cancelBtn.addEventListener('click', () => {
        closeModal();
        if (onCancel) onCancel();
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeModal();
            if (onCancel) onCancel();
        }
    });

    document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
            closeModal();
            if (onCancel) onCancel();
            document.removeEventListener('keydown', escHandler);
        }
    });

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
}

// Add CSS for animations and styling
function addCustomStyles() {
    if (document.getElementById('map-custom-styles')) return;

    const style = document.createElement('style');
    style.id = 'map-custom-styles';
    style.textContent = `
        /* Animation for updated elements */
        .updated {
            animation: pulse-update 1s ease-in-out;
        }

        @keyframes pulse-update {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); color: #3b82f6; }
            100% { transform: scale(1); }
        }

        /* Device popup styling */
        .device-popup .leaflet-popup-content {
            margin: 0;
            padding: 0;
        }

        .device-popup .leaflet-popup-content-wrapper {
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        }

        /* Map marker animations */
        .marker-online {
            animation: pulse-online 2s infinite;
        }

        .marker-offline {
            animation: pulse-offline 3s infinite;
        }

        .marker-partial {
            animation: pulse-partial 2.5s infinite;
        }

        @keyframes pulse-online {
            0%, 100% { opacity: 0.8; }
            50% { opacity: 1; }
        }

        @keyframes pulse-offline {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 0.9; }
        }

        @keyframes pulse-partial {
            0%, 100% { opacity: 0.7; }
            50% { opacity: 1; }
        }

        /* Table row hover effects */
        .nodes-table tbody tr:hover {
            background-color: #f8fafc;
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            transition: all 0.2s ease;
        }

        /* Status list animations */
        .status-item {
            transition: all 0.2s ease;
        }

        .status-item:hover {
            transform: translateX(4px);
        }

        /* Modal overlay improvements */
        .modal-overlay {
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
        }

        /* Loading states */
        .loading {
            position: relative;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #6b7280;
        }

        .loading::after {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
            animation: loading-shimmer 1.5s infinite;
        }

        @keyframes loading-shimmer {
            0% { left: -100%; }
            100% { left: 100%; }
        }

        /* Pagination styling */
        #pagination-container {
            border: 1px solid #e5e7eb;
        }

        #pagination-buttons button:hover:not(:disabled) {
            transform: translateY(-1px);
        }

        /* Search enhancements */
        #deviceSearch:focus {
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        /* Advanced search panel */
        #advanced-search-panel {
            transition: all 0.3s ease;
        }

        /* Responsive improvements */
        @media (max-width: 768px) {
            .device-popup-content {
                min-width: 200px !important;
            }

            .confirmation-modal {
                margin: 20px;
                max-width: calc(100vw - 40px);
            }

            #pagination-container {
                flex-direction: column;
                gap: 16px;
            }

            #pagination-buttons {
                justify-content: center;
            }
        }
    `;
    document.head.appendChild(style);
}

// Initialize advanced search
function initializeAdvancedFeatures() {
    setupAdvancedSearch();
}

// Export functions for global access
Object.assign(window, {
    // Modal functions
    openAddModal,
    editNode,
    closeModal,
    focusOnNode,
    deleteNode,

    // Search and filter functions
    filterDevices,
    clearSearch,
    resetFilters,
    applyAdvancedFilters,
    clearAdvancedFilters,
    toggleAdvancedSearch,

    // Pagination functions
    changePage,

    // Utility functions
    refreshData,
    refreshMap,
    updateUI,

    // Debug functions
    getNodes: () => nodes,
    getFilteredNodes: () => filteredNodes,
    getMarkers: () => markers,
    getSocket: () => socket,
    getMap: () => map,
    getCurrentPage: () => currentPage,
    getTotalPages: () => totalPages
});

// Initialize custom styles
addCustomStyles();

// Initialize advanced features after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initializeAdvancedFeatures, 500);
});

// Performance monitoring
const performanceMonitor = {
    startTime: Date.now(),
    markers: 0,
    updates: 0,
    searches: 0,

    logUpdate() {
        this.updates++;
        if (this.updates % 10 === 0) {
            console.log(`Performance: ${this.updates} updates, ${this.markers} markers, ${this.searches} searches, ${Date.now() - this.startTime}ms total`);
        }
    },

    logMarkerCreation() {
        this.markers++;
    },

    logSearch() {
        this.searches++;
    }
};

// Memory cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (socket) {
        socket.disconnect();
    }

    // Clear markers
    Object.values(markers).forEach(marker => {
        if (map.hasLayer(marker)) {
            map.removeLayer(marker);
        }
    });

    // Clear drawn items
    if (drawnItems) {
        drawnItems.clearLayers();
    }

    // Clear timeouts
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }

    console.log('Cleaned up resources');
});

// Error boundary for unhandled errors
window.addEventListener('error', (event) => {
    console.error('Unhandled error in map.js:', event.error);
    showToast('An unexpected error occurred', 'error');
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection in map.js:', event.reason);
    showToast('A network error occurred', 'error');
});