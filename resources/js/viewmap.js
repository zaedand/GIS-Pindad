// resources/js/viewmap.js
import L from 'leaflet';

let map;
let markers = [];

async function fetchNodes() {
    const response = await fetch('/api/nodes');
    const nodes = await response.json();
    addMarkers(nodes);
}

function initMap() {
    map = L.map('map').setView([-8.173358, 112.684885], 17);

    const google = L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}&key=YOUR_API_KEY', {
        maxZoom: 20,
        attribution: 'Map data © Google'
    });

    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 20,
        attribution: '© OpenStreetMap contributors'
    });

    google.addTo(map); // Default: Google
    L.control.layers({ "Google Satellite": google, "OpenStreetMap": osm }).addTo(map);
}

function addMarkers(nodes) {
    markers.forEach(m => map.removeLayer(m));
    markers = [];

    nodes.forEach(node => {
        const [lat, lng] = node.coords;
        if (isNaN(lat) || isNaN(lng)) return;

        const color = getStatusColor(node.status);
        const marker = L.circleMarker([lat, lng], {
            radius: 10,
            color,
            fillColor: color,
            fillOpacity: 0.8,
        }).bindPopup(`
            <b>${node.name}</b><br>
            IP: ${node.ip}<br>
            Status: <span style="color:${color}">${node.status}</span><br>
            Last Ping: ${node.lastPing}<br>
            Uptime: ${node.uptime}
        `);

        marker.addTo(map);
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

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    fetchNodes();
    setInterval(fetchNodes, 30000); // Refresh tiap 30 detik
});
