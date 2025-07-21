import { io } from 'socket.io-client';

let map;
let markers = [];
let nodes = [];
let editingNodeId = null;
let latestStatus = []; // akan diisi dari server socket.io

const apiHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
};



function getStatusColor(status) {
  switch (status) {
    case 'online': return '#10b981';    // hijau
    case 'offline': return '#ef4444';   // merah
    case 'partial': return '#f59e0b';   // kuning
    default: return '#6b7280';          // abu-abu
  }
}


// Sesuaikan URL dengan Node.js server kamu
const socket = io("http://localhost:3000");


socket.on("connect", () => {
    console.log("Terhubung ke server Socket.IO:", socket.id);
});

// Versi benar dan efisien
socket.on("device-status", (statusData) => {
    latestStatus = statusData;
    applyLiveStatus();     // update status di array nodes
    updateNodesTable();    // render ulang tabel HTML
});

async function fetchNodes() {
    const response = await fetch('/api/nodes');
    nodes = await response.json();
    applyLiveStatus();     // pastikan status langsung sinkron
    updateNodesTable();
    updateMapMarkers();
}

function normalizeStatus(rawStatus) {
  if (!rawStatus) return 'unknown';

  const lower = rawStatus.toLowerCase();

  if (lower.includes('unavailable')) return 'offline';
  if (lower.includes('not in use')) return 'online';
  if (lower.includes('in use')) return 'partial';

  return 'unknown';
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
  nodes.forEach(node => {
    const found = latestStatus.find(item => item.endpoint === node.endpoint);
    if (found) {
      node.status = normalizeStatus(found.status);      // e.g. 'offline'
    }
  });
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

        // Buat ID unik, bisa pakai timestamp atau counter
        const deviceId = 'device-' + Date.now();

        // Simpan id di options agar mudah dipanggil kembali
        layer.options.deviceId = deviceId;

        // Tambahkan id ke elemen SVG saat layer ditambahkan ke map
        layer.on('add', function () {
            const el = layer.getElement(); // Ini akan ambil elemen SVG atau marker DOM
            if (el) {
                el.setAttribute('id', deviceId);
                el.setAttribute('data-device-id', deviceId);
                el.classList.add('device-shape'); // opsional: class untuk semua device
            }
        });

        if (layer instanceof L.Circle) {
            const latlng = layer.getLatLng();
            const radius = layer.getRadius();
            fillFormAndOpenModal(latlng.lat, latlng.lng, `Radius: ${radius.toFixed(2)} meter`, deviceId);
        } else if (layer instanceof L.Polyline && !(layer instanceof L.Polygon)) {
            const latlngs = layer.getLatLngs();
            let totalDistance = 0;
            for (let i = 1; i < latlngs.length; i++) {
                totalDistance += latlngs[i - 1].distanceTo(latlngs[i]);
            }
            fillFormAndOpenModal(latlngs[0].lat, latlngs[0].lng, `Length: ${totalDistance.toFixed(2)} meter`, deviceId);
        } else if (layer instanceof L.Marker) {
            const latlng = layer.getLatLng();
            fillFormAndOpenModal(latlng.lat, latlng.lng, '', deviceId);
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
            return;
        }

        const color = getStatusColor(node.status);
        const statusText = formatDisplayStatus(node.status);

        const marker = L.circleMarker([lat, lng], {
            radius: 12,
            color,
            fillColor: color,
            fillOpacity: 0.8,
            weight: 3
        });

        // ✅ Tambahkan ID ke elemen path sebelum addTo(map)
        marker.on('add', function () {
            const el = marker.getElement();
            if (el) {
                el.setAttribute('id', `device-${node.id}`);
                el.setAttribute('data-device-id', node.id);
            }
        });

        marker.addTo(map);

        const popupContent = `
            <div style="font-family: sans-serif; padding: 10px;">
                <h4>${node.name}</h4>
                <div>Device Id : ${node.id}</div>
                <div>Endpoint : ${node.endpoint}</div>
                <div>Status: <strong style="color:${color};">${statusText}</strong></div>
                <div>IP: <code>${node.ip}</code></div>
                <div>Last Ping: ${node.lastPing}</div>
                <div>Uptime: ${node.uptime}</div>
                <div>Keterangan : ${node.description}</div>
                <div style="margin-top: 10px;">
                    <button onclick="editNode(${node.id})" class="text-blue-600 text-xs">✏ Edit</button>
                    <button onclick="deleteNode(${node.id})" class="text-red-600 text-xs ml-2">🗑 Delete</button>
                </div>
            </div>`;
        marker.bindPopup(popupContent);
        markers.push(marker);
    });
}


// Toast function 
function showToast(message, type = 'success') {
    const styles = {
        success: {
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#ffffff',
            icon: '✅'
        },
        error: {
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: '#ffffff',
            icon: '❌'
        },
        warning: {
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: '#ffffff',
            icon: '⚠️'
        },
        info: {
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            color: '#ffffff',
            icon: 'ℹ️'
        }
    };

    const style = styles[type] || styles.success;

    Toastify({
        text: `${style.icon} ${message}`,
        duration: 3000,
        close: true,
        gravity: "top",
        position: "right",
        style: {
            background: style.background,
            color: style.color,
            borderRadius: "12px",
            padding: "16px 20px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.1)",
            fontSize: "14px",
            fontWeight: "500",
            border: "none",
            minWidth: "300px",
            maxWidth: "400px",
            backdropFilter: "blur(10px)",
        },
        onClick: function(){} // Dismiss on click
    }).showToast();
}

// Modal konfirmasi dengan styling modern
function showConfirmModal(message, onConfirm, onCancel = null) {
    // Buat overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(5px);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.2s ease-out;
    `;

    // Buat modal
    const modal = document.createElement('div');
    modal.style.cssText = `
        background: white;
        border-radius: 16px;
        padding: 24px;
        max-width: 400px;
        width: 90%;
        box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease-out;
        position: relative;
    `;

    modal.innerHTML = `
        <div style="text-align: center;">
            <div style="
                width: 64px;
                height: 64px;
                background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
                border-radius: 50%;
                margin: 0 auto 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
            ">⚠️</div>

            <h3 style="
                margin: 0 0 8px 0;
                font-size: 18px;
                font-weight: 600;
                color: #1f2937;
            ">Konfirmasi</h3>

            <p style="
                margin: 0 0 24px 0;
                color: #6b7280;
                font-size: 14px;
                line-height: 1.5;
            ">${message}</p>

            <div style="
                display: flex;
                gap: 12px;
                justify-content: center;
            ">
                <button id="cancelBtn" style="
                    padding: 10px 20px;
                    border: 2px solid #e5e7eb;
                    background: white;
                    color: #6b7280;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    transition: all 0.2s;
                    min-width: 80px;
                ">Batal</button>

                <button id="confirmBtn" style="
                    padding: 10px 20px;
                    border: none;
                    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                    color: white;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    transition: all 0.2s;
                    min-width: 80px;
                ">Hapus</button>
            </div>
        </div>
    `;

    // Tambahkan keyframes untuk animasi
    if (!document.getElementById('modal-keyframes')) {
        const style = document.createElement('style');
        style.id = 'modal-keyframes';
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideIn {
                from { transform: translateY(-50px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    // Event listeners
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

    // Function untuk menutup modal
    function closeModal() {
        overlay.style.animation = 'fadeOut 0.2s ease-out';
        setTimeout(() => {
            document.body.removeChild(overlay);
        }, 200);
    }

    // Event handlers
    confirmBtn.addEventListener('click', () => {
        closeModal();
        if (onConfirm) onConfirm();
    });

    cancelBtn.addEventListener('click', () => {
        closeModal();
        if (onCancel) onCancel();
    });

    // Tutup modal ketika click overlay
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeModal();
            if (onCancel) onCancel();
        }
    });

    // Tutup modal dengan ESC
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

// Fungsi CRUD yang diperbaiki
async function createNode(nodeData) {
    try {
        const response = await fetch('/api/nodes', {
            method: 'POST',
            headers: apiHeaders,
            body: JSON.stringify(nodeData),
        });

        if (!response.ok) {
            const text = await response.text();
            console.error('Gagal create device:', response.status, text);
            showToast('Gagal menambahkan device!', 'error');
            return;
        }

        const newNode = await response.json();
        nodes.push(newNode);
        updateAll();
        showToast('Device berhasil ditambahkan!', 'success');
    } catch (error) {
        console.error('Error saat create device:', error);
        showToast('Terjadi kesalahan saat menambahkan device!', 'error');
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
            const text = await response.text();
            console.error('Gagal update device:', response.status, text);
            showToast('Gagal memperbarui device!', 'error');
            return;
        }

        const updatedNode = await response.json();
        const index = nodes.findIndex(node => node.id === id);
        if (index !== -1) {
            nodes[index] = updatedNode;
            updateAll();
        }

        showToast('Device berhasil diperbarui!', 'success');
    } catch (error) {
        console.error('Error saat update device:', error);
        showToast('Terjadi kesalahan saat memperbarui device!', 'error');
    }
}

async function deleteNode(id) {
    showConfirmModal(
        'Yakin ingin menghapus device ini? Tindakan ini tidak dapat dibatalkan.',
        async () => {
            try {
                const response = await fetch(`/api/nodes/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                    }
                });

                if (!response.ok) {
                    const text = await response.text();
                    console.error('Gagal delete device:', response.status, text);
                    showToast('Gagal menghapus device!', 'error');
                    return;
                }

                // Hapus node dari array lokal
                nodes = nodes.filter(node => node.id !== id);
                updateAll();

                showToast('Device berhasil dihapus!', 'success');
            } catch (error) {
                console.error('Error saat delete device:', error);
                showToast('Terjadi kesalahan saat menghapus device!', 'error');
            }
        }
    );
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
        const statusText = formatDisplayStatus(node.status);

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${node.name}</td>
            <td style="font-family: monospace; text-align: center">${node.ip}</td>
            <td style="font-family: monospace; text-align: center">${node.endpoint}</td>
            <td>
                <span class=" text-align: center inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style="background-color:${color}20; color:${color};">
                    <div class="w-2 h-2 rounded-full mr-1.5" style="background-color:${color};"></div>
                    ${statusText}
                </span>
            </td>
            <td style="ext-align: center">${lat.toFixed(4)}, ${lng.toFixed(4)}</td>
            <td style="font-family: monospace; text-align: left">${node.description}</td>
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
    document.getElementById('modal-title').textContent = 'Tambah Device Baru';
    document.getElementById('nodeForm').reset();
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
    document.getElementById('nodeDescription').value = node.description;
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

const modal = document.getElementById('nodeModal');
if (modal) {
    modal.addEventListener('click', function (e) {
        if (e.target === this) closeModal();
    });
}


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
        endpoint: formData.get('endpoint'),
        status: formData.get('status'),
        latitude: lat,
        longitude: lng,
        description: formData.get('description'),
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
    closeModal,
    refreshMap
});

