# Dokumentasi Backend - Sistem Informasi Geografis PT PINDAD

## Deskripsi Sistem

**SIMIRA**

Sistem ini merupakan aplikasi web berbasis geografis yang dirancang untuk memantau dan melaporkan status telepon IP PBX secara real-time. Sistem menggunakan arsitektur microservice dengan dua komponen utama: aplikasi web Laravel sebagai frontend dan backend utama, serta server Express.js sebagai API server dan WebSocket handler untuk komunikasi real-time.

### Arsitektur Sistem

```
┌─────────────────┐    WebSocket    ┌─────────────────┐    HTTP/API    ┌─────────────────┐
│   Laravel App   │ ←──────────────→ │  Express Server │ ──────────────→ │   IP PBX Nodes  │
│   (Frontend)    │                 │   (WebSocket)   │                │   (Endpoints)   │
└─────────────────┘                 └─────────────────┘                └─────────────────┘
         │                                     │
         ▼                                     ▼
┌─────────────────┐                 ┌─────────────────┐
│   MySQL DB      │                 │   Monitoring    │
│   (Laravel)     │                 │   & Logging     │
└─────────────────┘                 └─────────────────┘
```

## Prerequisite & Tools

### Software Requirements
- **VSCode** - Code Editor
- **Node.js** (v16+) - JavaScript Runtime
- **PHP** (v8.1+) - Server-side scripting
- **Composer** - PHP Dependency Manager
- **MySQL** (v8.0+) - Database Management System
- **Git** - Version Control

### Libraries & Frameworks
- **Laravel** (v10+) - PHP Web Framework
- **Tailwind CSS** - Utility-first CSS Framework
- **Vite** - Build Tool & Asset Bundler
- **Express.js** - Node.js Web Framework
- **Socket.IO** - Real-time Communication
- **Leaflet.js** - Interactive Maps
- **Chart.js** - Data Visualization
- **Laravel DomPDF** - PDF Generation

## Setup & Installation

### 1. Clone Repositories

```bash
# Clone Laravel application
git clone https://github.com/yourusername/GIS-Pindad.git
cd GIS-Pindad

# Clone Express server (dalam terminal terpisah)
git clone https://github.com/yourusername/servesGIS.git
cd servesGIS
```

### 2. Setup Laravel Application (GIS-Pindad)

```bash
# Navigate to Laravel project
cd GIS-Pindad

# Install PHP dependencies
composer install

# Install Node.js dependencies
npm install

# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate
```

#### Configure Environment (.env)
```env
APP_NAME="GIS Pindad Monitoring"
APP_ENV=local
APP_KEY=base64:generated_key_here
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=gis_pindad
DB_USERNAME=your_username
DB_PASSWORD=your_password

# WebSocket Server Configuration
WEBSOCKET_HOST=127.0.0.1
WEBSOCKET_PORT=3000

# API Server Configuration
API_SERVER_URL=http://localhost:3000

BROADCAST_DRIVER=log
CACHE_DRIVER=file
FILESYSTEM_DISK=local
QUEUE_CONNECTION=sync
SESSION_DRIVER=file
SESSION_LIFETIME=120
```

#### Database Setup
```bash
# Create database
mysql -u root -p
CREATE DATABASE gis_pindad;
exit

# Run migrations
php artisan migrate

# Seed initial data (optional)
php artisan db:seed
```

#### Build Assets
```bash
# Development build
npm run dev

# Production build
npm run build
```

### 3. Setup Express Server (servesGIS)

```bash
# Navigate to Express project
cd servesGIS

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

#### Configure Environment (.env)
```env
NODE_ENV=development
PORT=3000

# Database Configuration
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=gis_pindad
DB_USER=your_username
DB_PASSWORD=your_password

# CORS Configuration
CORS_ORIGIN=http://localhost:8000

# Monitoring Configuration
PING_INTERVAL=30000
RETRY_COUNT=3
TIMEOUT=5000
```

#### Install PM2 (Production)
```bash
npm install -g pm2
```

### 4. Database Schema

#### Tabel `nodes`
```sql
CREATE TABLE nodes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    building_name VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    status ENUM('online', 'offline', 'in_use') DEFAULT 'offline',
    description TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP NULL DEFAULT NULL,
    INDEX idx_status (status),
    INDEX idx_ip_address (ip_address)
);
```

#### Tabel `device_history`
```sql
CREATE TABLE device_history (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    node_id BIGINT UNSIGNED NOT NULL,
    building_name VARCHAR(255) NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    previous_status ENUM('online', 'offline', 'in_use'),
    current_status ENUM('online', 'offline', 'in_use') NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    duration BIGINT UNSIGNED DEFAULT 0,
    FOREIGN KEY (node_id) REFERENCES nodes(id) ON DELETE CASCADE,
    INDEX idx_node_id (node_id),
    INDEX idx_timestamp (timestamp),
    INDEX idx_status_change (previous_status, current_status)
);
```

#### Tabel `users` (Laravel default dengan modifikasi)
```sql
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified_at TIMESTAMP NULL DEFAULT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    remember_token VARCHAR(100),
    created_at TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP NULL DEFAULT NULL,
    INDEX idx_role (role)
);
```

## Running the Application

### 1. Start Laravel Application
```bash
cd GIS-Pindad

# Development server
php artisan serve
# Aplikasi akan berjalan di http://localhost:8000

# Untuk production dengan Apache/Nginx
# Configure virtual host ke public directory
```

### 2. Start Express Server

#### Development Mode
```bash
cd servesGIS
npm run dev
# atau
node server.js
```

#### Production Mode
```bash
cd servesGIS
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### PM2 Configuration (ecosystem.config.js)
```javascript
module.exports = {
  apps: [{
    name: 'gis-websocket-server',
    script: './server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

## Fitur & Functionality

### 1. Dashboard
- **Statistik Real-time**: Menampilkan jumlah device online/offline/in use
- **Peta Interaktif**: Menggunakan Leaflet.js untuk visualisasi geografis
- **Status Monitoring**: Titik lingkaran dengan kode warna:
  - 🟢 **Hijau**: Online
  - 🔴 **Merah**: Offline  
  - 🟡 **Kuning**: In Use
- **Real-time Updates**: WebSocket untuk pembaruan status langsung

### 2. Manage
- **CRUD Operations**: Tambah/Edit/Hapus node device
- **Data Management**: 
  - Nama gedung
  - Alamat IP
  - Endpoint
  - Status
  - Keterangan
  - Koordinat geografis
- **Monitoring Integration**: Sama seperti dashboard dengan fungsi management

### 3. Logs
- **Event Monitoring**: Pencatatan perubahan status
- **History Tracking**: Menyimpan ke tabel `device_history`
- **Uptime Calculation**: Kalkulasi berdasarkan periode waktu
- **PDF Reports**: Ekspor laporan dengan:
  - Diagram lingkaran uptime/downtime
  - Tabel uptime per endpoint
  - Ranking endpoint dengan downtime tertinggi
  - Header dan footer customizable

### 4. Users Management
- **Role-based Access**: Admin dan User
- **CRUD Users**: Manajemen akses pengguna
- **Permission Control**:
  - **Admin**: Dashboard, Manage, Logs, Users
  - **User**: Dashboard, Logs

## WebSocket Events & Communication

### Event Flow
```
Server → Client: server:welcome    (Koneksi pertama)
Client → Server: client:ping       (Heartbeat)
Server → Client: server:pong       (Response heartbeat)
Client ⇄ Server: device:update     (Broadcast status)
```

### Implementation Example

#### Express Server (servesGIS)
```javascript
// Socket connection handler
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Welcome message
    socket.emit('server:welcome', {
        message: 'Connected to GIS monitoring server',
        timestamp: new Date().toISOString()
    });
    
    // Handle client ping
    socket.on('client:ping', () => {
        socket.emit('server:pong', {
            timestamp: new Date().toISOString()
        });
    });
    
    // Handle device updates
    socket.on('device:update', (data) => {
        // Broadcast to all clients
        io.emit('device:update', data);
    });
});
```

#### Laravel Client
```javascript
// WebSocket client connection
const socket = io('http://localhost:3000');

socket.on('server:welcome', (data) => {
    console.log('Connected to server:', data);
});

socket.on('device:update', (data) => {
    updateMapMarker(data.nodeId, data.status);
    updateStatistics();
});
```

## Monitoring Mechanism

### 1. Device Status Polling
Express server melakukan polling ke setiap endpoint yang terdaftar di database dengan interval tertentu:

```javascript
// Monitoring function
async function monitorDevices() {
    const nodes = await getNodesFromDatabase();
    
    for (const node of nodes) {
        try {
            const response = await axios.get(node.endpoint, {
                timeout: 5000
            });
            
            const newStatus = determineStatus(response);
            
            if (newStatus !== node.status) {
                await updateNodeStatus(node.id, newStatus);
                
                // Log to device_history
                await logStatusChange(node, node.status, newStatus);
                
                // Broadcast via WebSocket
                io.emit('device:update', {
                    nodeId: node.id,
                    status: newStatus,
                    timestamp: new Date().toISOString()
                });
            }
        } catch (error) {
            // Handle offline status
            await updateNodeStatus(node.id, 'offline');
        }
    }
}

// Run monitoring every 30 seconds
setInterval(monitorDevices, 30000);
```

### 2. Status Determination Logic
```javascript
function determineStatus(response) {
    if (response.status === 200) {
        // Check if device is in use based on response data
        if (response.data.in_call || response.data.active_calls > 0) {
            return 'in_use';
        }
        return 'online';
    }
    return 'offline';
}
```

## Uptime Calculation

### Algorithm
```php
// Laravel - Calculate uptime percentage
public function calculateUptime($nodeId, $startDate, $endDate) {
    $histories = DeviceHistory::where('node_id', $nodeId)
        ->whereBetween('timestamp', [$startDate, $endDate])
        ->orderBy('timestamp')
        ->get();
    
    $totalTime = strtotime($endDate) - strtotime($startDate);
    $uptimeSeconds = 0;
    
    foreach ($histories as $index => $history) {
        if ($history->previous_status === 'online' || 
            $history->previous_status === 'in_use') {
            
            $startTime = strtotime($history->timestamp);
            $endTime = isset($histories[$index + 1]) ? 
                strtotime($histories[$index + 1]->timestamp) : 
                strtotime($endDate);
            
            $uptimeSeconds += ($endTime - $startTime);
        }
    }
    
    return ($uptimeSeconds / $totalTime) * 100;
}
```

## Troubleshooting

### Common Issues

#### 1. WebSocket Connection Failed
```bash
# Check if Express server is running
pm2 status
# atau
netstat -an | grep :3000

# Check firewall
sudo ufw allow 3000
```

#### 2. Database Connection Error
```bash
# Test MySQL connection
mysql -u username -p -h localhost

# Check Laravel database configuration
php artisan config:cache
php artisan migrate:status
```

#### 3. Asset Building Issues
```bash
# Clear cache and rebuild
npm run build
php artisan view:clear
php artisan config:clear
```

#### 4. Permission Issues
```bash
# Laravel permissions
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache
```

### Performance Optimization

#### 1. Database Indexing
```sql
-- Add indexes for better performance
ALTER TABLE device_history ADD INDEX idx_composite (node_id, timestamp, current_status);
ALTER TABLE nodes ADD INDEX idx_location (latitude, longitude);
```

#### 2. Caching Strategy
```php
// Laravel - Cache frequently accessed data
Cache::remember('node_statistics', 300, function () {
    return [
        'online' => Node::where('status', 'online')->count(),
        'offline' => Node::where('status', 'offline')->count(),
        'in_use' => Node::where('status', 'in_use')->count(),
    ];
});
```

#### 3. WebSocket Optimization
```javascript
// Limit broadcast frequency
const throttledBroadcast = throttle((data) => {
    io.emit('device:update', data);
}, 1000); // Max 1 broadcast per second
```

## Deployment Checklist

### Pre-deployment
- [ ] Environment files configured
- [ ] Database migrations run
- [ ] Assets compiled (`npm run build`)
- [ ] Dependencies installed
- [ ] SSL certificates configured (production)

### Laravel Deployment
- [ ] Set `APP_ENV=production`
- [ ] Set `APP_DEBUG=false`
- [ ] Configure web server (Apache/Nginx)
- [ ] Set proper file permissions
- [ ] Configure cron jobs for Laravel scheduler

### Express Server Deployment
- [ ] PM2 configured
- [ ] Process monitoring setup
- [ ] Log rotation configured
- [ ] Firewall rules configured

### Post-deployment
- [ ] Test WebSocket connections
- [ ] Verify database connectivity
- [ ] Test all CRUD operations
- [ ] Verify PDF generation
- [ ] Test user authentication
- [ ] Monitor application logs

## Maintenance

### Regular Tasks
1. **Database Cleanup**: Archive old device_history records
2. **Log Rotation**: Manage application and server logs
3. **Performance Monitoring**: Check response times and resource usage
4. **Backup Strategy**: Regular database backups
5. **Security Updates**: Keep dependencies updated

### Monitoring Commands
```bash
# Check PM2 processes
pm2 status
pm2 logs gis-websocket-server

# Check Laravel logs
tail -f storage/logs/laravel.log

# Check system resources
top
df -h
free -m
```

---

## Kesimpulan

Sistem ini menyediakan solusi monitoring real-time untuk telepon IP PBX dengan antarmuka geografis yang intuitif. Dengan arsitektur microservice dan komunikasi WebSocket, sistem dapat menangani pembaruan status secara real-time sambil tetap menjaga performa dan skalabilitas.

Untuk informasi lebih lanjut atau troubleshooting, silakan merujuk ke dokumentasi Laravel dan Express.js official, atau hubungi tim pengembang.
