
class DeviceHistoryTracker {
    constructor() {
        this.previousStates = new Map(); // Store previous status of each endpoint
        this.historyCache = new Map();   // Cache history data
        this.init();
    }

    init() {
        console.log('Device History Tracker initialized');
    }

    /**
     * Track status change and send to backend
     */
    async handleStatusChange(endpoint, newStatus, timestamp = null) {
        try {
            const previousStatus = this.previousStates.get(endpoint);
            const currentTimestamp = timestamp || new Date().toISOString();

            // Only process if status actually changed
            if (previousStatus !== newStatus) {
                console.log(`Status change detected for ${endpoint}: ${previousStatus} → ${newStatus}`);

                // Send to backend
                await this.sendStatusUpdate(endpoint, newStatus, currentTimestamp);

                // Update our local state
                this.previousStates.set(endpoint, newStatus);

                // Trigger UI updates
                this.onStatusChanged(endpoint, previousStatus, newStatus, currentTimestamp);
            }
        } catch (error) {
            console.error('Error handling status change:', error);
        }
    }

    /**
     * Send status update to backend
     */
    async sendStatusUpdate(endpoint, status, timestamp) {
        try {
            const response = await fetch('/api/history/update-status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
                },
                body: JSON.stringify({
                    endpoint: endpoint,
                    status: status,
                    timestamp: timestamp
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Status update sent successfully:', result);
        } catch (error) {
            console.error('Error sending status update:', error);
            // Optionally queue for retry
            this.queueRetry(endpoint, status, timestamp);
        }
    }

    /**
     * Queue failed requests for retry
     */
    queueRetry(endpoint, status, timestamp) {
        // Simple retry mechanism
        setTimeout(() => {
            this.sendStatusUpdate(endpoint, status, timestamp);
        }, 5000);
    }

    /**
     * Get history for specific endpoint
     */
    async getHistory(endpoint, limit = 50) {
        try {
            const cacheKey = `${endpoint}_${limit}`;

            // Check cache first
            if (this.historyCache.has(cacheKey)) {
                const cached = this.historyCache.get(cacheKey);
                // Cache for 5 minutes
                if (Date.now() - cached.timestamp < 300000) {
                    return cached.data;
                }
            }

            const response = await fetch(`/api/history/endpoint/${endpoint}?limit=${limit}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Cache the result
            this.historyCache.set(cacheKey, {
                data: data,
                timestamp: Date.now()
            });

            return data;
        } catch (error) {
            console.error('Error fetching history:', error);
            return { endpoint, history: [], total: 0 };
        }
    }

    /**
     * Get statistics for endpoint
     */
    async getStats(endpoint, days = 7) {
        try {
            const response = await fetch(`/api/history/endpoint/${endpoint}/stats?days=${days}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching stats:', error);
            return null;
        }
    }

    /**
     * Get all currently offline devices
     */
    async getCurrentOfflineDevices() {
        try {
            const response = await fetch('/api/history/offline');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching offline devices:', error);
            return { offline_devices: [], count: 0 };
        }
    }

    /**
     * Initialize previous states from current nodes
     */
    initializePreviousStates(nodes) {
        nodes.forEach(node => {
            if (node.endpoint) {
                this.previousStates.set(node.endpoint, normalizeStatus(node.status));
            }
        });
        console.log('Initialized previous states for', this.previousStates.size, 'endpoints');
    }

    /**
     * Callback when status changes - override this for custom behavior
     */
    onStatusChanged(endpoint, previousStatus, newStatus, timestamp) {
        // Default implementation - you can override this
        console.log(`Device ${endpoint} status changed: ${previousStatus} → ${newStatus} at ${timestamp}`);

        // Update activity log
        this.updateActivityLog(endpoint, previousStatus, newStatus, timestamp);

        // Show notification for critical changes
        if (newStatus === 'offline' && previousStatus === 'online') {
            this.showNotification(`Device ${endpoint} went offline`, 'warning');
        } else if (newStatus === 'online' && previousStatus === 'offline') {
            this.showNotification(`Device ${endpoint} came back online`, 'success');
        }
    }

    /**
     * Update activity log with status change
     */
    updateActivityLog(endpoint, previousStatus, newStatus, timestamp) {
        const logEntry = {
            endpoint: endpoint,
            previousStatus: previousStatus,
            newStatus: newStatus,
            timestamp: timestamp,
            description: this.getStatusChangeDescription(previousStatus, newStatus)
        };

        // Add to existing activity log system
        if (typeof addToActivityLog === 'function') {
            addToActivityLog(logEntry);
        }

        // Trigger activity log re-render
        if (typeof renderActivityLog === 'function') {
            renderActivityLog();
        }
    }

    /**
     * Get human-readable description of status change
     */
    getStatusChangeDescription(previousStatus, newStatus) {
        if (!previousStatus) {
            return `Device initialized as ${newStatus}`;
        }

        if (previousStatus === 'online' && newStatus === 'offline') {
            return 'Device went offline';
        }

        if (previousStatus === 'offline' && newStatus === 'online') {
            return 'Device came back online';
        }

        if (newStatus === 'partial') {
            return 'Device is now in use';
        }

        return `Status changed from ${previousStatus} to ${newStatus}`;
    }

    /**
     * Show notification to user
     */
    showNotification(message, type = 'info') {
        // Use existing notification system if available
        if (typeof showMessage === 'function') {
            showMessage(message, type);
            return;
        }

        // Fallback notification
        console.log(`[${type.toUpperCase()}] ${message}`);
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.historyCache.clear();
        console.log('History cache cleared');
    }
}

// Initialize global history tracker
let deviceHistoryTracker;

// Integration with existing socket handling
function integrateHistoryWithSocket() {
    // Initialize history tracker
    deviceHistoryTracker = new DeviceHistoryTracker();

    // Initialize previous states when nodes are loaded
    if (typeof nodes !== 'undefined' && nodes.length > 0) {
        deviceHistoryTracker.initializePreviousStates(nodes);
    }

    // Hook into existing socket handler
    const originalHandleStatusUpdate = handleStatusUpdate;

    if (typeof handleStatusUpdate === 'function') {
        handleStatusUpdate = function(statusData) {
            // Call original handler
            originalHandleStatusUpdate(statusData);

            // Process each status update for history tracking
            if (Array.isArray(statusData)) {
                statusData.forEach(update => {
                    const normalizedStatus = normalizeStatus(update.status);
                    deviceHistoryTracker.handleStatusChange(
                        update.endpoint,
                        normalizedStatus,
                        update.timestamp
                    );
                });
            }
        };
    }

    // Hook into fetchNodes to initialize states
    const originalFetchNodes = fetchNodes;
    if (typeof fetchNodes === 'function') {
        fetchNodes = async function() {
            await originalFetchNodes();
            if (typeof nodes !== 'undefined') {
                deviceHistoryTracker.initializePreviousStates(nodes);
            }
        };
    }
}

// History UI Functions
class HistoryUI {
    constructor() {
        this.currentEndpoint = null;
        this.currentPage = 1;
    }

    /**
     * Show history modal for specific endpoint
     */
    async showHistoryModal(endpoint) {
        this.currentEndpoint = endpoint;

        try {
            const [history, stats] = await Promise.all([
                deviceHistoryTracker.getHistory(endpoint, 50),
                deviceHistoryTracker.getStats(endpoint, 7)
            ]);

            this.renderHistoryModal(endpoint, history, stats);
        } catch (error) {
            console.error('Error loading history:', error);
            this.showError('Failed to load history data');
        }
    }

    /**
     * Render history modal
     */
    renderHistoryModal(endpoint, historyData, statsData) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden">
                <div class="p-6 border-b border-gray-200">
                    <div class="flex justify-between items-center">
                        <h2 class="text-xl font-bold">History for Endpoint ${endpoint}</h2>
                        <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                </div>

                <div class="p-6 overflow-y-auto max-h-[70vh]">
                    ${this.renderStats(statsData)}
                    ${this.renderHistoryTable(historyData.history)}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    /**
     * Render statistics section
     */
    renderStats(stats) {
        if (!stats) return '<p class="text-red-500">Failed to load statistics</p>';

        return `
            <div class="mb-6">
                <h3 class="text-lg font-semibold mb-4">7-Day Statistics</h3>
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="bg-blue-50 p-4 rounded-lg">
                        <div class="text-sm text-blue-600">Total Offline Events</div>
                        <div class="text-2xl font-bold text-blue-800">${stats.total_offline_events}</div>
                    </div>
                    <div class="bg-red-50 p-4 rounded-lg">
                        <div class="text-sm text-red-600">Total Offline Time</div>
                        <div class="text-2xl font-bold text-red-800">${stats.total_offline_formatted}</div>
                    </div>
                    <div class="bg-green-50 p-4 rounded-lg">
                        <div class="text-sm text-green-600">Uptime</div>
                        <div class="text-2xl font-bold text-green-800">${stats.uptime_percentage}%</div>
                    </div>
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <div class="text-sm text-gray-600">Current Status</div>
                        <div class="text-2xl font-bold ${stats.currently_offline ? 'text-red-800' : 'text-green-800'}">
                            ${stats.currently_offline ? 'Offline' : 'Online'}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render history table
     */
    renderHistoryTable(history) {
        if (!history || history.length === 0) {
            return '<p class="text-gray-500 text-center py-8">No history data available</p>';
        }

        const rows = history.map(record => `
            <tr class="border-b border-gray-200 hover:bg-gray-50">
                <td class="py-3 px-4">${new Date(record.jam_off).toLocaleString('id-ID')}</td>
                <td class="py-3 px-4">
                    ${record.jam_on ? new Date(record.jam_on).toLocaleString('id-ID') : '<span class="text-red-500">Still offline</span>'}
                </td>
                <td class="py-3 px-4">
                    <span class="px-2 py-1 rounded-full text-xs ${record.jam_on ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}">
                        ${record.formatted_duration || 'N/A'}
                    </span>
                </td>
            </tr>
        `).join('');

        return `
            <div>
                <h3 class="text-lg font-semibold mb-4">Offline History</h3>
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-gray-100">
                            <tr>
                                <th class="py-3 px-4 text-left">Offline Time</th>
                                <th class="py-3 px-4 text-left">Online Time</th>
                                <th class="py-3 px-4 text-left">Duration</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    /**
     * Show error message
     */
    showError(message) {
        alert('Error: ' + message); // Replace with better notification system
    }
}

// Initialize history UI
const historyUI = new HistoryUI();

// Global functions for accessing history
window.showDeviceHistory = function(endpoint) {
    historyUI.showHistoryModal(endpoint);
};

window.refreshHistoryCache = function() {
    if (deviceHistoryTracker) {
        deviceHistoryTracker.clearCache();
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for other scripts to initialize
    setTimeout(() => {
        integrateHistoryWithSocket();
        console.log('History tracking integrated successfully');
    }, 1000);
});

// Export for external access
Object.assign(window, {
    deviceHistoryTracker,
    historyUI,
    integrateHistoryWithSocket
});
