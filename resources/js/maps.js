let map;
let markers = [];
let nodes = [];
let editingNodeId = null;

const apiHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
};


async function fetchNodes() {
    const response = await fetch('/api/nodes');
    nodes = await response.json();
    updateAll();
}


function initMap() {
    map = L.map('map').setView([-8.173358, 112.684885], 17);

    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 20,
        attribution: '© OpenStreetMap contributors'
    });

    const googleLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}&key=YOUR_API_KEY', {
        maxZoom: 20,
        attribution: 'Map data © Google'
    });

    osmLayer.addTo(map);

    const baseMaps = {
        "OpenStreetMap": osmLayer,
        "Google Satellite": googleLayer
    };
    L.control.layers(baseMaps).addTo(map);

    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    const drawControl = new L.Control.Draw({
        edit: { featureGroup: drawnItems },
        draw: {
            polygon: true,
            polyline: true,
            rectangle: true,
            circle: false,
            marker: true
        }
    });
    map.addControl(drawControl);

    map.on('draw:created', function (e) {
        const layer = e.layer;
        drawnItems.addLayer(layer);
        const geojson = layer.toGeoJSON();

        if (layer instanceof L.Circle) {
            const latlng = layer.getLatLng();
            const radius = layer.getRadius();
            fillFormAndOpenModal(latlng.lat, latlng.lng, `Radius: ${radius.toFixed(2)} meter`);
        } else if (layer instanceof L.Polyline && !(layer instanceof L.Polygon)) {
            const latlngs = layer.getLatLngs();
            let totalDistance = 0;
            for (let i = 1; i < latlngs.length; i++) {
                totalDistance += latlngs[i - 1].distanceTo(latlngs[i]);
            }
            fillFormAndOpenModal(latlngs[0].lat, latlngs[0].lng, `Length: ${totalDistance.toFixed(2)} meter`);
        } else if (layer instanceof L.Marker) {
            const latlng = layer.getLatLng();
            fillFormAndOpenModal(latlng.lat, latlng.lng);
        }

        console.log('GeoJSON hasil gambar:', JSON.stringify(geojson));
    });

    updateMapMarkers();
}

function fillFormAndOpenModal(lat, lng, ipPlaceholder = '') {
    openAddModal();
    setTimeout(() => {
        document.getElementById('nodeLatitude').value = lat.toFixed(6);
        document.getElementById('nodeLongitude').value = lng.toFixed(6);
        if (ipPlaceholder) {
            document.getElementById('nodeIP').value = ipPlaceholder;
        }
    }, 100);
}


function getLatLngFromCoords(coords) {
    if (Array.isArray(coords)) {
        return [parseFloat(coords[0]), parseFloat(coords[1])];
    } else if (coords && coords.coordinates) {
        return [parseFloat(coords.coordinates[1]), parseFloat(coords.coordinates[0])]; // GeoJSON: [lng, lat]
    }
    return [0, 0];
}

function updateMapMarkers() {
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];

    nodes.forEach(node => {
    const [lat, lng] = node.coords;
    if (isNaN(lat) || isNaN(lng)) {
        console.warn(`Invalid coords for node ID ${node.id}:`, node.coords);
        return; // skip marker jika data tidak valid
    }

    const color = getStatusColor(node.status);
    const marker = L.circleMarker([lat, lng], {
        radius: 12,
        color,
        fillColor: color,
        fillOpacity: 0.8,
        weight: 3
    }).addTo(map);

        const popupContent = `
            <div style="font-family: sans-serif; padding: 10px;">
                <h4>${node.name}</h4>
                <div>Status: <strong style="color:${color};">${node.status}</strong></div>
                <div>IP: <code>${node.ip}</code></div>
                <div>Last Ping: ${node.lastPing}</div>
                <div>Uptime: ${node.uptime}</div>
                <div style="margin-top: 10px;">
                    <button onclick="editNode(${node.id})" class="text-blue-600 text-xs">✏ Edit</button>
                    <button onclick="deleteNode(${node.id})" class="text-red-600 text-xs ml-2">🗑 Delete</button>
                </div>
            </div>`;
        marker.bindPopup(popupContent);
        markers.push(marker);
    });
}

function getStatusColor(status) {
    switch (status) {
        case 'online': return '#10b981';
        case 'offline': return '#ef4444';
        case 'partial': return '#f59e0b';
        default: return '#6b7280';
    }
}

async function createNode(nodeData) {
    const response = await fetch('/api/nodes', {
        method: 'POST',
        headers: apiHeaders,
        body: JSON.stringify(nodeData),
    });
    const newNode = await response.json();
    nodes.push(newNode);
    updateAll();
}

async function updateNode(id, nodeData) {
    const response = await fetch(`/api/nodes/${id}`, {
        method: 'PUT',
        headers: apiHeaders,
        body: JSON.stringify(nodeData),
    });

    if (!response.ok) {
        const text = await response.text();
        console.error('Gagal update node:', response.status, text);
        return;
    }

    const updatedNode = await response.json(); // ✅ hanya dipanggil kalau status OK
    const index = nodes.findIndex(node => node.id === id);
    if (index !== -1) {
        nodes[index] = updatedNode;
        updateAll();
    }
}


async function deleteNode(id) {
    if (confirm('Yakin ingin menghapus node ini?')) {
        const response = await fetch(`/api/nodes/${id}`, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const text = await response.text();
            console.error('Gagal delete node:', response.status, text);
            return;
        }

        nodes = nodes.filter(node => node.id !== id);
        updateAll();
    }
}


function updateStatusList() {
    const statusList = document.getElementById('phone-status-list');
    statusList.innerHTML = '';
    nodes.forEach(node => {
        const [lat, lng] = getLatLngFromCoords(node.coords);
        const statusItem = document.createElement('div');
        statusItem.className = 'flex items-center gap-4 p-3 rounded-xl hover:bg-indigo-50 transition-all cursor-pointer';
        statusItem.onclick = () => focusOnNode(node.id);
        const statusClass = getStatusColor(node.status);
        statusItem.innerHTML = `
            <div class="w-3 h-3 rounded-full shadow-lg" style="background:${statusClass}"></div>
            <div class="flex-1">
                <div class="font-semibold text-gray-800">${node.name}</div>
                <div class="text-sm text-gray-600">${node.ip}</div>
                <div class="text-xs text-gray-500">Last ping: ${node.lastPing}</div>
            </div>
            <div class="text-right text-xs text-gray-500">
                <div class="font-medium">${node.responseTime || '42ms'}</div>
                <div>${node.uptime}</div>
            </div>`;
        statusList.appendChild(statusItem);
    });
}

function updateNodesTable() {
    const tableBody = document.getElementById('nodes-table-body');
    tableBody.innerHTML = '';
    nodes.forEach(node => {
        const [lat, lng] = getLatLngFromCoords(node.coords);
        const color = getStatusColor(node.status);

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${node.name}</td>
            <td style="font-family: monospace;">${node.ip}</td>
            <td>
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style="background-color:${color}20; color:${color};">
                    <div class="w-2 h-2 rounded-full mr-1.5" style="background-color:${color};"></div>
                    ${node.status}
                </span>
            </td>
            <td>${lat.toFixed(4)}, ${lng.toFixed(4)}</td>
            <td>${node.uptime}</td>
            <td>
                <div class="flex space-x-2">
                    <button onclick="editNode(${node.id})" class="text-indigo-600"><i class="fas fa-edit"></i></button>
                    <button onclick="deleteNode(${node.id})" class="text-red-600"><i class="fas fa-trash"></i></button>
                    <button onclick="focusOnNode(${node.id})" class="text-green-600"><i class="fas fa-search"></i></button>
                </div>
            </td>`;
        tableBody.appendChild(row);
    });
}

document.addEventListener('DOMContentLoaded', function () {
    initMap();
    fetchNodes();
    setInterval(refreshMap, 30000);
});

function openAddModal() {
    document.getElementById('modal-title').textContent = 'Tambah Node Baru';
    document.getElementById('nodeForm').reset();
    editingNodeId = null;
    document.getElementById('nodeModal').style.display = 'block';
}

function editNode(id) {
    const node = nodes.find(n => n.id === id);
    if (!node) return;

    const [lat, lng] = getLatLngFromCoords(node.coords);

    document.getElementById('modal-title').textContent = 'Edit Node';
    document.getElementById('nodeName').value = node.name;
    document.getElementById('nodeIP').value = node.ip;
    document.getElementById('nodeStatus').value = node.status;
    document.getElementById('nodeLatitude').value = lat;
    document.getElementById('nodeLongitude').value = lng;
    editingNodeId = id;
    document.getElementById('nodeModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('nodeModal').style.display = 'none';
    editingNodeId = null;
}

function focusOnNode(id) {
    const node = nodes.find(n => n.id === id);
    if (node) {
        const [lat, lng] = getLatLngFromCoords(node.coords);
        map.setView([lat, lng], 18);
        const marker = markers.find(m => m.getLatLng().lat === lat && m.getLatLng().lng === lng);
        if (marker) marker.openPopup();
    }
}

function updateAll() {
    updateMapMarkers();
    updateStatusList();
    updateNodesTable();
}

function refreshMap() {
    nodes.forEach(node => {
        if (Math.random() > 0.8) {
            const statuses = ['online', 'offline', 'partial'];
            node.status = statuses[Math.floor(Math.random() * statuses.length)];
            node.lastPing = node.status === 'online' ?
                Math.floor(Math.random() * 5) + 's ago' :
                Math.floor(Math.random() * 10) + 'm ago';
        }
    });
    updateAll();
}

document.getElementById('nodeModal').addEventListener('click', function (e) {
    if (e.target === this) closeModal();
});

document.getElementById('nodeForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const formData = new FormData(e.target); // ✅ Inisialisasi di sini

    const lat = parseFloat(formData.get('latitude'));
    const lng = parseFloat(formData.get('longitude'));

    if (isNaN(lat) || isNaN(lng)) {
        alert('Koordinat tidak valid.');
        return;
    }

    const nodeData = {
        name: formData.get('name'),
        ip: formData.get('ip'),
        status: formData.get('status'),
        latitude: lat,
        longitude: lng,
        coords: [lat, lng],
        lastPing: '1s ago',
        uptime: '99.9%'
    };

    if (editingNodeId) {
        updateNode(editingNodeId, nodeData);
    } else {
        createNode(nodeData);
    }

    closeModal();
});

document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
});

Object.assign(window, {
    openAddModal,
    editNode,
    focusOnNode,
    deleteNode,
    closeModal
});

