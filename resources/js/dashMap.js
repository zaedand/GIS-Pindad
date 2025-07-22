import { io } from 'socket.io-client';

let map;
let markers = {};
let nodes = [];

document.addEventListener('DOMContentLoaded', async function () {
    map = L.map('map').setView([-8.173358, 112.684885], 17);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 20,
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    const response = await fetch('/api/nodes');
    nodes = await response.json();

    nodes.forEach(node => {
        const [lat, lng] = node.coords;
        if (!isNaN(lat) && !isNaN(lng)) {
            const color = getStatusColor(node.status);

            const marker = L.circleMarker([lat, lng], {
                radius: 12,
                color,
                fillColor: color,
                fillOpacity: 0.8,
                weight: 3
            }).addTo(map).bindPopup(getPopupContent(node, color));

            markers[node.endpoint] = marker;
        }
    });

    setupSocket();
});

document.addEventListener('DOMContentLoaded', () => {
    socket.on("device-status", statusData => {
        latestStatus = statusData;
        applyLiveStatus();
        updateNodesTable();
        updateStatusList();
        updateRealtimeStats(statusData);
    });
});

function updateStatusCountsFromArray(statusArray) {
    const total = statusArray.length;
    const online = statusArray.filter(n => normalizeStatus(n.status) === 'online').length;
    const offline = statusArray.filter(n => normalizeStatus(n.status) === 'offline').length;
    const inUse = statusArray.filter(n => normalizeStatus(n.status) === 'in use').length;

    document.getElementById('total-phones').textContent = total;
    document.getElementById('online-phones').textContent = online;
    document.getElementById('offline-phones').textContent = offline;
    document.getElementById('in-use-phones').textContent = inUse;

    console.log({ total, online, offline, inUse });
}


function setupSocket() {
    const socket = io('http://localhost:3000');

    socket.on('device-status', statusData => {
        console.log("Status real-time:", statusData);

        statusData.forEach(update => {
            let node = nodes.find(n => n.endpoint === update.endpoint);

            if (!node) {
                node = {
                    name: 'Unknown',
                    ip: update.contact || '-',
                    endpoint: update.endpoint,
                    status: normalizeStatus(update.status),
                    lastPing: new Date().toLocaleTimeString(),
                    coords: [-8.173358, 112.684885],
                    description: '-'
                };
                nodes.push(node);
            }

            node.status = normalizeStatus(update.status);
            node.lastPing = new Date().toLocaleTimeString();
            const color = getStatusColor(node.status);

            if (markers[update.endpoint]) {
                markers[update.endpoint].setStyle({
                    color,
                    fillColor: color
                });
                markers[update.endpoint].setPopupContent(getPopupContent(node, color));
            } else {
                const marker = L.circleMarker(node.coords, {
                    radius: 12,
                    color,
                    fillColor: color,
                    fillOpacity: 0.8,
                    weight: 3
                }).addTo(map).bindPopup(getPopupContent(node, color));

                markers[update.endpoint] = marker;
            }
        });

        updateStatusCountsFromArray(statusData);
    });
}



function normalizeStatus(status) {
    status = status.toLowerCase();
    if (status.includes('online')) return 'online';
    if (status.includes('partial')) return 'partial';
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

function getPopupContent(node, color) {
    return `
        <strong>${node.name}</strong><br>
        IP: ${node.ip}<br>
        Endpoint: ${node.endpoint}<br>
        Status: <strong style="color:${color};">${node.status}</strong><br>
        Last Ping: ${node.lastPing}<br>
        Keterangan: ${node.description}
    `;
}
