// resources/js/dashMap.js
let map;

document.addEventListener('DOMContentLoaded', async function () {
    map = L.map('map').setView([-8.173358, 112.684885], 17);

    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 20,
        attribution: '© OpenStreetMap contributors'
    });
    osmLayer.addTo(map);

    // Ambil node dari API
    const response = await fetch('/api/nodes');
    const nodes = await response.json();

    nodes.forEach(node => {
        const [lat, lng] = node.coords;
        if (!isNaN(lat) && !isNaN(lng)) {
            const color = getStatusColor(node.status);
            L.circleMarker([lat, lng], {
                radius: 12,
                color,
                fillColor: color,
                fillOpacity: 0.8,
                weight: 3
            }).addTo(map).bindPopup(`
                <strong>${node.name}</strong><br>
                IP: ${node.ip}<br>
                Status: ${node.status}<br>
                Last Ping: ${node.lastPing}
            `);
        }
    });
});

function getStatusColor(status) {
    switch (status) {
        case 'online': return '#10b981';
        case 'offline': return '#ef4444';
        case 'partial': return '#f59e0b';
        default: return '#6b7280';
    }
}
