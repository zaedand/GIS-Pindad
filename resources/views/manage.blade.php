
<x-app-layout>

    <x-slot name="header">
        <h2 class="font-bold text-xl text-gray-800 leading-tight">
            Phone Monitoring System - Selamat datang {{ Auth::user()->name }}
        </h2>
    </x-slot>


        <!-- Main Content -->
        <main class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">


            <!-- Grid Layout -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <!-- Map Section -->
                <div class="lg:col-span-2 bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-lg">
                    <div class="flex justify-between mb-6">
                        <h2 class="text-xl font-semibold text-gray-800 flex items-center gap-2">
                            <i class="fas fa-map-marker-alt text-indigo-500"></i>
                            Peta Gedung & Status Telepon
                        </h2>
                        <button class="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-300 hover:-translate-y-1 text-sm" onclick="openAddModal()">
                            <i class="fas fa-plus"></i>
                            Tambah Node
                        </button>
                        <button onclick="refreshMap()" class="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-300 hover:-translate-y-1 text-sm">
                            <i class="fas fa-sync-alt mr-2"></i>
                            Refresh
                        </button>
                    </div>

                    <div id="map" class="h-96 rounded-xl overflow-hidden shadow-inner"></div>

                    <div class="flex flex-wrap gap-4 mt-4 text-sm">
                        <div class="flex items-center gap-2">
                            <div class="w-3 h-3 bg-green-500 rounded-full shadow-lg"></div>
                            <span class="text-gray-700 font-medium">Online</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <div class="w-3 h-3 bg-red-500 rounded-full shadow-lg"></div>
                            <span class="text-gray-700 font-medium">Offline</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <div class="w-3 h-3 bg-yellow-500 rounded-full shadow-lg"></div>
                            <span class="text-gray-700 font-medium">Partial</span>
                        </div>
                    </div>
                </div>

                <!-- Draw action    4 -->
                <div class="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-lg">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <i class="fas fa-list text-indigo-500"></i>
                        Tambahkan Lokasi
                    </h3>

                    <div class="space-y-2 max-h-96 overflow-y-auto" id="phone-status-list">
                        <!-- Phone status items will be populated here -->
                        <div class="flex items-center gap-4 p-3 rounded-xl hover:bg-indigo-50 transition-all duration-300 cursor-pointer">
                            <div class="w-3 h-3 bg-green-500 rounded-full shadow-lg animate-pulse"></div>
                            <div class="flex-1">
                                <div class="font-semibold text-gray-800">Gedung A</div>
                                <div class="text-sm text-gray-600">192.168.1.101</div>
                                <div class="text-xs text-gray-500">Last ping: 2s ago</div>
                            </div>
                            <div class="text-right text-xs text-gray-500">
                                <div class="font-medium">42ms</div>
                                <div>99.8%</div>
                            </div>
                        </div>

                        <div class="flex items-center gap-4 p-3 rounded-xl hover:bg-indigo-50 transition-all duration-300 cursor-pointer">
                            <div class="w-3 h-3 bg-red-500 rounded-full shadow-lg animate-blink"></div>
                            <div class="flex-1">
                                <div class="font-semibold text-gray-800">Gedung B</div>
                                <div class="text-sm text-gray-600">192.168.1.102</div>
                                <div class="text-xs text-gray-500">Last ping: 5m ago</div>
                            </div>
                            <div class="text-right text-xs text-gray-500">
                                <div class="font-medium text-red-500">Timeout</div>
                                <div>85.2%</div>
                            </div>
                        </div>

                        <div class="flex items-center gap-4 p-3 rounded-xl hover:bg-indigo-50 transition-all duration-300 cursor-pointer">
                            <div class="w-3 h-3 bg-green-500 rounded-full shadow-lg animate-pulse"></div>
                            <div class="flex-1">
                                <div class="font-semibold text-gray-800">Gedung C</div>
                                <div class="text-sm text-gray-600">192.168.1.103</div>
                                <div class="text-xs text-gray-500">Last ping: 1s ago</div>
                            </div>
                            <div class="text-right text-xs text-gray-500">
                                <div class="font-medium">38ms</div>
                                <div>99.9%</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            <!-- Nodes Management Table -->
            <div class="bg-white rounded-xl shadow-sm p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <i class="fas fa-table text-blue-600 mr-2"></i>
                    Manajemen Node
                </h3>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Gedung</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Koordinat</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uptime</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody id="nodes-table-body" class="bg-white divide-y divide-gray-200">
                            <!-- Table rows will be populated here -->
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    </div>

    <!-- Modal -->
    <div id="nodeModal" class="fixed inset-0 bg-black bg-opacity-50 z-50 hidden">
        <div class="flex items-center justify-center min-h-screen p-4">
            <div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                <div class="flex items-center justify-between mb-6">
                    <h3 id="modal-title" class="text-lg font-semibold text-gray-900">Tambah Node Baru</h3>
                    <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <form id="nodeForm">
                    <div class="space-y-4">
                        <div>
                            <label for="nodeName" class="block text-sm font-medium text-gray-700 mb-1">Nama Gedung</label>
                            <input type="text" id="nodeName" name="name" required
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        </div>

                        <div>
                            <label for="nodeIP" class="block text-sm font-medium text-gray-700 mb-1">IP Address</label>
                            <input type="text" id="nodeIP" name="ip" required pattern="^(\d{1,3}\.){3}\d{1,3}$"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        </div>

                        <div>
                            <label for="nodeStatus" class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select id="nodeStatus" name="status" required
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                <option value="online">Online</option>
                                <option value="offline">Offline</option>
                                <option value="partial">Partial</option>
                            </select>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label for="nodeLatitude" class="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                                <input type="number" id="nodeLatitude" name="latitude" step="any" required
                                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            </div>
                            <div>
                                <label for="nodeLongitude" class="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                                <input type="number" id="nodeLongitude" name="longitude" step="any" required
                                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            </div>
                        </div>
                    </div>

                    <div class="flex justify-end space-x-3 mt-6">
                        <button type="button" onclick="closeModal()"
                                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                            Batal
                        </button>
                        <button type="submit"
                                class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700">
                            Simpan
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>

     @push('scripts')
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.css"/>


     <script>
        // Global variables
        let map;
        let markers = [];
        let nodes = [ ];

const apiHeaders = {
    'Content-Type': 'application/json',
    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
};

// Fetch data dari server
   fetch('http://localhost:8000/api/nodes')
       .then(response => response.json())
       .then(data => {
           console.log(data); // Tampilkan data di konsol
           // Lakukan sesuatu dengan data, misalnya menampilkannya di UI
       })
       .catch(error => console.error('Error:', error));


async function fetchNodes() {
    const response = await fetch('/api/nodes'); // Ganti dengan endpoint yang sesuai
    nodes = await response.json();
    updateAll(); // Memperbarui tampilan setelah data diambil
}


        let editingNodeId = null;
        let nextNodeId = 4;

        // Initialize map
        function initMap() {
    map = L.map('map').setView([-8.173358, 112.684885], 17);

    //OpenStreetMap layer
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 20,
        attribution: '© OpenStreetMap contributors'
    });

    //Google Satellite layer (requires valid API key)
    const googleLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}&key=YOUR_API_KEY', {
        maxZoom: 20,
        attribution: 'Map data © Google'
    });

    // Tambahkan salah satu sebagai default
    osmLayer.addTo(map);

    //Pilihan basemap
    const baseMaps = {
        "OpenStreetMap": osmLayer,
        "Google Satellite": googleLayer
    };
    L.control.layers(baseMaps).addTo(map);

    // draw
    var drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    var drawControl = new L.Control.Draw({
        edit: {
            featureGroup: drawnItems
        },
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
    var layer = e.layer;
    drawnItems.addLayer(layer);

    var geojson = layer.toGeoJSON();

    // Deteksi jenis layer
    if (layer instanceof L.Circle) {
        var latlng = layer.getLatLng();
        var radius = layer.getRadius();

        // Isi form otomatis
        document.getElementById('nodeLatitude').value = latlng.lat.toFixed(6);
        document.getElementById('nodeLongitude').value = latlng.lng.toFixed(6);

        // Misal tambahkan di field deskripsi atau IP sementara:
        document.getElementById('nodeIP').value = `Radius: ${radius.toFixed(2)} meter`;

        openAddModal(); // Munculkan form
    } else if (layer instanceof L.Polyline && !(layer instanceof L.Polygon)) {
        var latlngs = layer.getLatLngs();
        var totalDistance = 0;

        for (let i = 1; i < latlngs.length; i++) {
            totalDistance += latlngs[i - 1].distanceTo(latlngs[i]);
        }

        // Gunakan titik pertama sebagai referensi koordinat
        document.getElementById('nodeLatitude').value = latlngs[0].lat.toFixed(6);
        document.getElementById('nodeLongitude').value = latlngs[0].lng.toFixed(6);
        document.getElementById('nodeIP').value = `Length: ${totalDistance.toFixed(2)} meter`;

        openAddModal(); // Munculkan form
    } else if (layer instanceof L.Marker) {
        var latlng = layer.getLatLng();
        document.getElementById('nodeLatitude').value = latlng.lat.toFixed(6);
        document.getElementById('nodeLongitude').value = latlng.lng.toFixed(6);
        openAddModal();
    }

    console.log('GeoJSON hasil gambar:', JSON.stringify(geojson));
});


    updateMapMarkers();
}


        // Update map markers
        function updateMapMarkers() {
            // Clear existing markers
            markers.forEach(marker => map.removeLayer(marker));
            markers = [];

            // Add new markers
            nodes.forEach(function(node) {
                const color = getStatusColor(node.status);

                const marker = L.circleMarker(node.coords, {
                    radius: 12,
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.8,
                    weight: 3
                }).addTo(map);

                const popupContent = `
                    <div style="font-family: sans-serif; padding: 10px; min-width: 200px;">
                        <h4 style="margin: 0 0 10px 0; color: #374151;">${node.name}</h4>
                        <div style="display: grid; gap: 5px; font-size: 13px;">
                            <div style="display: flex; justify-content: space-between;">
                                <span>Status:</span>
                                <span style="font-weight: bold; color: ${color};">${node.status}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span>IP:</span>
                                <span style="font-family: monospace;">${node.ip}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span>Last Ping:</span>
                                <span>${node.lastPing}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span>Uptime:</span>
                                <span style="font-weight: bold;">${node.uptime}</span>
                            </div>
                        </div>
                        <div style="margin-top: 10px; display: flex; gap: 5px;">
                            <button onclick="editNode(${node.id})" style="padding: 5px 10px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 12px;">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button onclick="deleteNode(${node.id})" style="padding: 5px 10px; background: #ef4444; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 12px;">
                                <i class="fas fa-trash"></i> Hapus
                            </button>
                        </div>
                    </div>
                `;

                marker.bindPopup(popupContent);
                markers.push(marker);
            });
        }

        // Get status color
        function getStatusColor(status) {
            switch(status) {
                case 'online': return '#10b981';
                case 'offline': return '#ef4444';
                case 'partial': return '#f59e0b';
                default: return '#6b7280';
            }
        }

        async function createNode(nodeData) {
    const response = await fetch('/api/nodes', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(nodeData),
    });
    const newNode = await response.json();
    nodes.push(newNode);
    updateAll();
    alert('Node berhasil ditambahkan!');
}

async function updateNode(id, nodeData) {
    const response = await fetch(`/api/nodes/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(nodeData),
    });
    const updatedNode = await response.json();
    const nodeIndex = nodes.findIndex(node => node.id === id);
    if (nodeIndex !== -1) {
        nodes[nodeIndex] = updatedNode;
        updateAll();
        alert('Node berhasil diperbarui!');
    }
}

async function deleteNode(id) {
    if (confirm('Yakin ingin menghapus node ini?')) {
        await fetch(`/api/nodes/${id}`, {
            method: 'DELETE',
        });
        nodes = nodes.filter(node => node.id !== id);
        updateAll();
        alert('Node berhasil dihapus!');
    }
}

        // Update status list
        function updateStatusList() {
            const statusList = document.getElementById('phone-status-list');
            statusList.innerHTML = '';

            nodes.forEach(function(node) {
                const statusItem = document.createElement('div');
                statusItem.className = 'status-item';
                statusItem.onclick = () => focusOnNode(node.id);

                const statusClass = node.status === 'online' ? 'online animate-pulse' :
                                  node.status === 'offline' ? 'offline' : 'partial';

                statusItem.innerHTML = `
                    <div class="status-dot ${statusClass}"></div>
                    <div style="flex: 1;">
                        <div style="font-weight: bold; color: #374151;">${node.name}</div>
                        <div style="font-size: 12px; color: #6b7280;">${node.ip}</div>
                        <div style="font-size: 11px; color: #9ca3af;">Last ping: ${node.lastPing}</div>
                    </div>
                    <div style="text-align: right; font-size: 11px; color: #6b7280;">
                        <div style="font-weight: bold;">${node.status === 'offline' ? 'Timeout' : '42ms'}</div>
                        <div>${node.uptime}</div>
                    </div>
                `;

                statusList.appendChild(statusItem);
            });
        }

        // Update nodes table
        function updateNodesTable() {
    const tableBody = document.getElementById('nodes-table-body');
    tableBody.innerHTML = '';

    nodes.forEach(function(node) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${node.name}</td>
            <td style="font-family: monospace;">${node.ip}</td>
            <td>
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style="background-color: ${getStatusColor(node.status)}20; color: ${getStatusColor(node.status)};">
                    <div class="w-2 h-2 rounded-full mr-1.5" style="background-color: ${getStatusColor(node.status)};"></div>
                    ${node.status}
                </span>
            </td>
            <td style="font-family: monospace; font-size: 12px;">${node.coords[0].toFixed(4)}, ${node.coords[1].toFixed(4)}</td>
            <td>${node.uptime}</td>
            <td>
                <div class="flex space-x-2">
                    <button onclick="editNode(${node.id})" class="text-indigo-600 hover:text-indigo-900">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteNode(${node.id})" class="text-red-600 hover:text-red-900">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button onclick="focusOnNode(${node.id})" class="text-green-600 hover:text-green-900">
                        <i class="fas fa-search"></i>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function updateStatusList() {
    const statusList = document.getElementById('phone-status-list');
    statusList.innerHTML = '';

    nodes.forEach(function(node) {
        const statusItem = document.createElement('div');
        statusItem.className = 'flex items-center gap-4 p-3 rounded-xl hover:bg-indigo-50 transition-all duration-300 cursor-pointer';
        statusItem.onclick = () => focusOnNode(node.id);

        const statusClass = node.status === 'online' ? 'bg-green-500 animate-pulse' :
                          node.status === 'offline' ? 'bg-red-500' : 'bg-yellow-500';

        statusItem.innerHTML = `
            <div class="w-3 h-3 ${statusClass} rounded-full shadow-lg"></div>
            <div class="flex-1">
                <div class="font-semibold text-gray-800">${node.name}</div>
                <div class="text-sm text-gray-600">${node.ip}</div>
                <div class="text-xs text-gray-500">Last ping: ${node.lastPing}</div>
            </div>
            <div class="text-right text-xs text-gray-500">
                <div class="font-medium">${node.responseTime}</div>
                <div>${node.uptime}</div>
            </div>
        `;

        statusList.appendChild(statusItem);
    });
}


        // CRUD Operations

        // Create node
        function createNode(nodeData) {
            const newNode = {
                id: nextNodeId++,
                name: nodeData.name,
                coords: [parseFloat(nodeData.latitude), parseFloat(nodeData.longitude)],
                status: nodeData.status,
                ip: nodeData.ip,
                lastPing: nodeData.status === 'online' ? '1s ago' : '5m ago',
                uptime: nodeData.status === 'online' ? '99.9%' : '85.2%'
            };

            nodes.push(newNode);
            updateAll();

            // Show success message
            alert('Node berhasil ditambahkan!');
        }

        // Read/Find node
        function findNode(id) {
            return nodes.find(node => node.id === id);
        }

        // Update node
        function updateNode(id, nodeData) {
            const nodeIndex = nodes.findIndex(node => node.id === id);
            if (nodeIndex !== -1) {
                nodes[nodeIndex] = {
                    ...nodes[nodeIndex],
                    name: nodeData.name,
                    coords: [parseFloat(nodeData.latitude), parseFloat(nodeData.longitude)],
                    status: nodeData.status,
                    ip: nodeData.ip,
                    lastPing: nodeData.status === 'online' ? '1s ago' : '5m ago',
                    uptime: nodeData.status === 'online' ? '99.9%' : '85.2%'
                };
                updateAll();
                alert('Node berhasil diperbarui!');
            }
        }

        // Delete node
        function deleteNode(id) {
            if (confirm('Yakin ingin menghapus node ini?')) {
                const nodeIndex = nodes.findIndex(node => node.id === id);
                if (nodeIndex !== -1) {
                    nodes.splice(nodeIndex, 1);
                    updateAll();
                    alert('Node berhasil dihapus!');
                }
            }
        }

        // Modal functions
        function openAddModal() {
            document.getElementById('modal-title').textContent = 'Tambah Node Baru';
            document.getElementById('nodeForm').reset();
            editingNodeId = null;
            document.getElementById('nodeModal').style.display = 'block';
        }

        function editNode(id) {
            const node = findNode(id);
            if (node) {
                document.getElementById('modal-title').textContent = 'Edit Node';
                document.getElementById('nodeName').value = node.name;
                document.getElementById('nodeIP').value = node.ip;
                document.getElementById('nodeStatus').value = node.status;
                document.getElementById('nodeLatitude').value = node.coords[0];
                document.getElementById('nodeLongitude').value = node.coords[1];
                editingNodeId = id;
                document.getElementById('nodeModal').style.display = 'block';
            }
        }

        function closeModal() {
            document.getElementById('nodeModal').style.display = 'none';
            editingNodeId = null;
        }

        // Focus on node
        function focusOnNode(id) {
            const node = findNode(id);
            if (node) {
                map.setView(node.coords, 18);
                const marker = markers.find(m => m.getLatLng().lat === node.coords[0] && m.getLatLng().lng === node.coords[1]);
                if (marker) {
                    marker.openPopup();
                }
            }
        }

        // Update all displays
        function updateAll() {
            updateMapMarkers();
            updateStatusList();
            updateNodesTable();
        }

        // Refresh map
        function refreshMap() {
            // Simulate status updates
            nodes.forEach(node => {
                if (Math.random() > 0.8) { // 20% chance to change status
                    const statuses = ['online', 'offline', 'partial'];
                    node.status = statuses[Math.floor(Math.random() * statuses.length)];
                    node.lastPing = node.status === 'online' ?
                        Math.floor(Math.random() * 5) + 's ago' :
                        Math.floor(Math.random() * 10) + 'm ago';
                }
            });
            updateAll();
        }

        // Form submission
        document.getElementById('nodeForm').addEventListener('submit', function(e) {
            e.preventDefault();

            const formData = new FormData(e.target);
            const nodeData = {
                name: formData.get('name'),
                ip: formData.get('ip'),
                status: formData.get('status'),
                latitude: formData.get('latitude'),
                longitude: formData.get('longitude')
            };

            if (editingNodeId) {
                updateNode(editingNodeId, nodeData);
            } else {
                createNode(nodeData);
            }

            closeModal();
        });

        // Close modal when clicking outside
        document.getElementById('nodeModal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });

        // Initialize everything when page loads
        document.addEventListener('DOMContentLoaded', function() {
            initMap();
            updateStatusList();
            updateNodesTable();

            // Auto refresh every 30 seconds
            setInterval(refreshMap, 30000);
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeModal();
            }
        });
    </script>
    @endpush
</x-app-layout>
