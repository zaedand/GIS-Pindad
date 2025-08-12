/**
 * Export PDF Report with options - Fixed Version
 */

function showPdfExportModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4';

    // Calculate default date ranges
    const today = new Date();
    const lastWeek = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
    const lastMonth = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
    const lastQuarter = new Date(today.getTime() - (90 * 24 * 60 * 60 * 1000));

    modal.innerHTML = `
        <div class="bg-white rounded-2xl w-full max-w-6xl flex flex-col shadow-2xl" style="max-height: 95vh; min-height: 60vh;">
            <!-- Header - Fixed -->
            <div class="flex-shrink-0 p-4 sm:p-6 border-b border-gray-200 bg-red-500 text-white rounded-t-2xl">
                <div class="flex justify-between items-center">
                    <div>
                        <h2 class="text-xl sm:text-2xl font-bold">
                            <i class="fas fa-file-pdf mr-2"></i>Export Laporan PDF
                        </h2>
                        <p class="mt-1 opacity-90 text-sm sm:text-base">Generate laporan KPI status telepon dengan periode custom</p>
                    </div>
                    <button onclick="closePdfModal(this)"
                            class="text-white/80 hover:text-white text-xl sm:text-2xl p-2 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>

            <!-- Content - Scrollable -->
            <div class="flex-1 overflow-y-auto p-4 sm:p-6">
                <form id="pdf-export-form" class="space-y-6 sm:space-y-8">
                    <!-- Date Range Selection Methods -->
                    <div class="bg-gray-50 rounded-xl p-4 sm:p-6 border border-gray-200">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <i class="fas fa-calendar-alt text-indigo-500"></i>
                            Pilih Metode Periode
                        </h3>

                        <!-- Date Range Method Selection -->
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                            <div class="space-y-3">
                                <label class="flex items-center p-3 sm:p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-indigo-300 cursor-pointer transition-colors">
                                    <input type="radio" name="dateMethod" value="preset" checked
                                           class="mr-3 text-indigo-600 focus:ring-indigo-500"
                                           onchange="toggleDateMethod('preset')">
                                    <div>
                                        <div class="font-semibold text-gray-800 text-sm sm:text-base">Periode Preset</div>
                                        <div class="text-xs sm:text-sm text-gray-600">Pilih dari periode yang sudah ditentukan</div>
                                    </div>
                                </label>

                                <label class="flex items-center p-3 sm:p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-indigo-300 cursor-pointer transition-colors">
                                    <input type="radio" name="dateMethod" value="custom"
                                           class="mr-3 text-indigo-600 focus:ring-indigo-500"
                                           onchange="toggleDateMethod('custom')">
                                    <div>
                                        <div class="font-semibold text-gray-800 text-sm sm:text-base">Tanggal Custom</div>
                                        <div class="text-xs sm:text-sm text-gray-600">Pilih tanggal mulai dan akhir sendiri</div>
                                    </div>
                                </label>
                            </div>

                            <!-- Quick preset buttons -->
                            <div class="space-y-2">
                                <div class="text-sm font-medium text-gray-700 mb-2">Quick Select:</div>
                                <div class="grid grid-cols-2 lg:grid-cols-1 gap-2">
                                    <button type="button" onclick="setQuickDate('today')"
                                            class="w-full text-left px-3 py-2 text-xs sm:text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors">
                                        <i class="fas fa-calendar-day mr-2"></i>Hari Ini
                                    </button>
                                    <button type="button" onclick="setQuickDate('thisWeek')"
                                            class="w-full text-left px-3 py-2 text-xs sm:text-sm bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors">
                                        <i class="fas fa-calendar-week mr-2"></i>Minggu Ini
                                    </button>
                                    <button type="button" onclick="setQuickDate('thisMonth')"
                                            class="w-full text-left px-3 py-2 text-xs sm:text-sm bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors">
                                        <i class="fas fa-calendar mr-2"></i>Bulan Ini
                                    </button>
                                    <button type="button" onclick="setQuickDate('lastMonth')"
                                            class="w-full text-left px-3 py-2 text-xs sm:text-sm bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg transition-colors">
                                        <i class="fas fa-calendar-minus mr-2"></i>Bulan Lalu
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Preset Period Options -->
                        <div id="preset-options" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Periode Preset</label>
                                <select name="period" onchange="updatePdfPreviewStats()" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                    <option value="1">1 Hari</option>
                                    <option value="3">3 Hari</option>
                                    <option value="7">7 Hari</option>
                                    <option value="14">14 Hari</option>
                                    <option value="30" selected>30 Hari</option>
                                    <option value="60">60 Hari</option>
                                    <option value="90">90 Hari</option>
                                </select>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Triwulan</label>
                                <select name="quarter" onchange="updatePdfPreviewStats()" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                    <option value="I">Triwulan I</option>
                                    <option value="II">Triwulan II</option>
                                    <option value="III">Triwulan III</option>
                                    <option value="IV" selected>Triwulan IV</option>
                                </select>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Tahun</label>
                                <select name="year" onchange="updatePdfPreviewStats()" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                    <option value="2023">2023</option>
                                    <option value="2024" selected>2024</option>
                                    <option value="2025">2025</option>
                                </select>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Format Waktu</label>
                                <select name="timeframe" onchange="updatePdfPreviewStats()" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                    <option value="days">Hari Terakhir</option>
                                    <option value="from_start">Dari Awal Tahun</option>
                                    <option value="quarter">Per Triwulan</option>
                                </select>
                            </div>
                        </div>

                        <!-- Custom Date Range Options -->
                        <div id="custom-options" class="grid grid-cols-1 lg:grid-cols-2 gap-6 hidden">
                            <div class="space-y-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">
                                        <i class="fas fa-calendar-plus mr-1"></i>Tanggal Mulai
                                    </label>
                                    <input type="date" name="start_date"
                                           value="${lastMonth.toISOString().split('T')[0]}"
                                           max="${today.toISOString().split('T')[0]}"
                                           class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">
                                        <i class="fas fa-calendar-check mr-1"></i>Tanggal Akhir
                                    </label>
                                    <input type="date" name="end_date"
                                           value="${today.toISOString().split('T')[0]}"
                                           max="${today.toISOString().split('T')[0]}"
                                           class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                </div>
                            </div>

                            <!-- Custom date preview -->
                            <div class="bg-white rounded-lg border border-gray-200 p-4">
                                <h4 class="text-sm font-semibold text-gray-800 mb-3">
                                    <i class="fas fa-info-circle text-blue-500 mr-1"></i>Preview Periode
                                </h4>
                                <div id="date-preview" class="space-y-2 text-sm text-gray-600">
                                    <div class="flex justify-between">
                                        <span>Dari:</span>
                                        <span id="preview-start-date" class="font-medium">-</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span>Sampai:</span>
                                        <span id="preview-end-date" class="font-medium">-</span>
                                    </div>
                                    <div class="flex justify-between pt-2 border-t">
                                        <span>Total Hari:</span>
                                        <span id="preview-total-days" class="font-medium text-indigo-600">-</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Report Options -->
                    <div class="bg-white rounded-xl p-4 sm:p-6 border border-gray-200">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <i class="fas fa-cog text-indigo-500"></i>
                            Opsi Laporan
                        </h3>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <!-- Report Type -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-3">Jenis Laporan</label>
                                <div class="space-y-2">
                                    <label class="flex items-center">
                                        <input type="radio" name="report_type" value="summary" checked
                                               class="mr-2 text-indigo-600 focus:ring-indigo-500">
                                        <span class="text-sm">Format laporan</span>
                                    </label>
                                </div>
                            </div>

                            <!-- Additional Options -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-3">Opsi Tambahan</label>
                                <div class="space-y-2">
                                    <label class="flex items-center">
                                        <input type="checkbox" name="include_ranking" checked
                                               class="mr-2 text-indigo-600 focus:ring-indigo-500 rounded">
                                        <span class="text-sm">Rank Endpoint Offline</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Current Statistics Preview -->
                    <div class="bg-blue-100 rounded-xl p-4 sm:p-6 border border-blue-200">
                        <h4 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <i class="fas fa-chart-pie text-blue-600"></i>
                            Preview Statistik yang Akan Dilaporkan
                        </h4>
                        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 text-center">
                            <div class="bg-white rounded-lg p-3 sm:p-4 shadow-sm">
                                <div class="text-lg sm:text-2xl font-bold text-blue-600" id="preview-total">-</div>
                                <div class="text-xs text-gray-600">Total Telepon</div>
                            </div>
                            <div class="bg-white rounded-lg p-3 sm:p-4 shadow-sm">
                                <div class="text-lg sm:text-2xl font-bold text-green-600" id="preview-online">-</div>
                                <div class="text-xs text-gray-600">Online</div>
                            </div>
                            <div class="bg-white rounded-lg p-3 sm:p-4 shadow-sm">
                                <div class="text-lg sm:text-2xl font-bold text-red-600" id="preview-offline">-</div>
                                <div class="text-xs text-gray-600">Offline</div>
                            </div>
                            <div class="bg-white rounded-lg p-3 sm:p-4 shadow-sm">
                                <div class="text-lg sm:text-2xl font-bold text-indigo-600" id="preview-uptime">-</div>
                                <div class="text-xs text-gray-600">Avg Uptime</div>
                            </div>
                            <div class="bg-white rounded-lg p-3 sm:p-4 shadow-sm col-span-2 sm:col-span-1">
                                <div class="text-lg sm:text-2xl font-bold text-purple-600" id="preview-period">-</div>
                                <div class="text-xs text-gray-600">Periode (Hari)</div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>

            <!-- Footer - Fixed -->
            <div class="flex-shrink-0 p-4 sm:p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                <div class="flex flex-col sm:flex-row justify-between items-center gap-3">
                    <div class="text-xs sm:text-sm text-gray-600 flex items-center gap-2 order-2 sm:order-1">
                        <i class="fas fa-clock"></i>
                        <span>Estimasi waktu: ~10-45 detik</span>
                    </div>

                    <div class="flex gap-2 sm:gap-3 order-1 sm:order-2 w-full sm:w-auto">
                        <button type="button" onclick="closePdfModal(this)"
                                class="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm text-gray-600 hover:text-gray-800 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors">
                            <i class="fas fa-times mr-1"></i>Batal
                        </button>
                        <button type="button" onclick="handlePdfExport('view')"
                                class="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm text-blue-600 hover:text-blue-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors">
                            <i class="fas fa-eye mr-1"></i>Preview
                        </button>
                        <button type="button" onclick="handlePdfExport('download')"
                                class="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-lg">
                            <i class="fas fa-download mr-1"></i>Download PDF
                        </button>
                    </div>
                </div>
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

    // Prevent scrolling on body when modal is open
    document.body.style.overflow = 'hidden';

    // Initialize date preview and statistics
    updatePdfPreviewStats();
    updateCustomDatePreview();

    // Setup event listeners for date inputs
    setupDateEventListeners();
}

function closePdfModal(button) {
    const modal = button.closest('.fixed');
    if (modal) {
        modal.remove();
        // Restore body scroll
        document.body.style.overflow = '';
    }
}

function toggleDateMethod(method) {
    const presetOptions = document.getElementById('preset-options');
    const customOptions = document.getElementById('custom-options');

    if (!presetOptions || !customOptions) {
        console.error('Date method elements not found');
        return;
    }

    if (method === 'preset') {
        presetOptions.classList.remove('hidden');
        customOptions.classList.add('hidden');
        // Update stats when switching to preset
        updatePdfPreviewStats();
    } else {
        presetOptions.classList.add('hidden');
        customOptions.classList.remove('hidden');
        updateCustomDatePreview();
        // Update stats when switching to custom
        updatePdfPreviewStats();
    }
}

function setQuickDate(period) {
    const today = new Date();
    const startDateInput = document.querySelector('input[name="start_date"]');
    const endDateInput = document.querySelector('input[name="end_date"]');
    const customRadio = document.querySelector('input[name="dateMethod"][value="custom"]');

    if (!startDateInput || !endDateInput || !customRadio) {
        console.error('Date input elements not found');
        return;
    }

    let startDate, endDate;

    switch(period) {
        case 'today':
            startDate = today;
            endDate = today;
            break;
        case 'thisWeek':
            startDate = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));
            endDate = today;
            break;
        case 'thisMonth':
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            endDate = today;
            break;
        case 'lastMonth':
            const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
            startDate = lastMonth;
            endDate = lastMonthEnd;
            break;
        default:
            console.warn('Unknown period:', period);
            return;
    }

    // Switch to custom mode and set dates
    customRadio.checked = true;
    toggleDateMethod('custom');

    startDateInput.value = startDate.toISOString().split('T')[0];
    endDateInput.value = endDate.toISOString().split('T')[0];

    updateCustomDatePreview();
}

function setupDateEventListeners() {
    const startDateInput = document.querySelector('input[name="start_date"]');
    const endDateInput = document.querySelector('input[name="end_date"]');

    if (startDateInput && endDateInput) {
        startDateInput.addEventListener('change', () => {
            // Ensure end date is not before start date
            if (endDateInput.value < startDateInput.value) {
                endDateInput.value = startDateInput.value;
            }
            endDateInput.min = startDateInput.value;
            updateCustomDatePreview();
            updatePdfPreviewStats(); // Update stats when date changes
        });

        endDateInput.addEventListener('change', () => {
            // Ensure start date is not after end date
            if (startDateInput.value > endDateInput.value) {
                startDateInput.value = endDateInput.value;
            }
            updateCustomDatePreview();
            updatePdfPreviewStats(); // Update stats when date changes
        });
    }
}

function updateCustomDatePreview() {
    const startDateInput = document.querySelector('input[name="start_date"]');
    const endDateInput = document.querySelector('input[name="end_date"]');
    const previewStartDate = document.getElementById('preview-start-date');
    const previewEndDate = document.getElementById('preview-end-date');
    const previewTotalDays = document.getElementById('preview-total-days');

    if (!startDateInput || !endDateInput || !previewStartDate) return;

    try {
        const startDate = new Date(startDateInput.value);
        const endDate = new Date(endDateInput.value);

        if (startDate && endDate && !isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
            // Format dates for display
            const options = {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
            };

            previewStartDate.textContent = startDate.toLocaleDateString('id-ID', options);
            previewEndDate.textContent = endDate.toLocaleDateString('id-ID', options);

            // Calculate total days
            const timeDiff = endDate.getTime() - startDate.getTime();
            const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 to include both dates
            previewTotalDays.textContent = `${daysDiff} hari`;

            // Update preview period in statistics
            const previewPeriodEl = document.getElementById('preview-period');
            if (previewPeriodEl) {
                previewPeriodEl.textContent = daysDiff;
            }
        }
    } catch (error) {
        console.error('Error updating date preview:', error);
        if (previewStartDate) previewStartDate.textContent = 'Error';
        if (previewEndDate) previewEndDate.textContent = 'Error';
        if (previewTotalDays) previewTotalDays.textContent = 'Error';
    }
}

function handlePdfExport(format = 'download') {
    const form = document.getElementById('pdf-export-form');
    if (!form) {
        console.error('PDF export form not found');
        showNotification('Form tidak ditemukan', 'error');
        return;
    }

    try {
        const formData = new FormData(form);
        const dateMethod = formData.get('dateMethod');

        let options = {
            format: format,
            report_type: formData.get('report_type') || 'summary',
            include_charts: formData.get('include_charts') ? 'true' : 'false',
            include_ranking: formData.get('include_ranking') ? 'true' : 'false',
            include_history: formData.get('include_history') ? 'true' : 'false',
            include_recommendations: formData.get('include_recommendations') ? 'true' : 'false'
        };

        if (dateMethod === 'custom') {
            // Custom date range
            const startDate = formData.get('start_date');
            const endDate = formData.get('end_date');

            if (!startDate || !endDate) {
                showNotification('Mohon pilih tanggal mulai dan akhir', 'warning');
                return;
            }

            options.date_method = 'custom';
            options.start_date = startDate;
            options.end_date = endDate;

            // Calculate period in days for backward compatibility
            const startDateObj = new Date(startDate);
            const endDateObj = new Date(endDate);
            const periodDays = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 3600 * 24)) + 1;
            options.period = periodDays.toString();
        } else {
            // Preset period
            options.date_method = 'preset';
            options.period = formData.get('period') || '30';
            options.timeframe = formData.get('timeframe') || 'days';
        }

        // Always include quarter and year for report metadata
        options.quarter = formData.get('quarter') || 'IV';
        options.year = formData.get('year') || new Date().getFullYear().toString();

        // Close modal
        const modal = form.closest('.fixed');
        if (modal) {
            modal.remove();
            document.body.style.overflow = ''; // Restore scroll
        }

        // Show notification based on estimated time
        const estimatedTime = options.report_type === 'detailed' ? '30-45 detik' : '10-30 detik';
        showNotification(`Memproses ${options.report_type} report... Estimasi: ${estimatedTime}`, 'info');

        // Export PDF with enhanced options
        exportPdfReport(options);

    } catch (error) {
        console.error('Error in handlePdfExport:', error);
        showNotification('Terjadi kesalahan saat memproses export PDF', 'error');
    }
}

/**
 * Main PDF export function with proper error handling
 */
async function exportPdfReport(options = {}) {
    try {
        // Default params with validation
        const params = {
            format: options.format || 'download',
            period: options.period || '30',
            quarter: options.quarter || 'IV',
            year: options.year || new Date().getFullYear().toString(),
            report_type: options.report_type || 'summary',
            include_charts: options.include_charts || 'true',
            include_ranking: options.include_ranking || 'true',
            include_history: options.include_history || 'false',
            include_recommendations: options.include_recommendations || 'false',
            date_method: options.date_method || 'preset',
            timeframe: options.timeframe || 'days'
        };

        // Add custom dates if provided
        if (options.start_date) params.start_date = options.start_date;
        if (options.end_date) params.end_date = options.end_date;

        // Generate filename
        const timestamp = new Date().toISOString().split('T')[0];
        params.filename = `phone-status-report-${params.period}days-${timestamp}.pdf`;

        console.log('Export PDF with params:', params);

        // Call the export function
        await exportHistory(params);

    } catch (error) {
        console.error('Error in exportPdfReport:', error);
        showNotification(`Gagal export PDF: ${error.message}`, 'error');
    }
}

async function exportHistory(params = {}) {
    try {
        // Validate required parameters
        if (!params.format) {
            throw new Error('Format parameter is required');
        }

        // Default params
        params.filename = params.filename || 'history-report.pdf';

        // Show loading notification
        showNotification('Mempersiapkan laporan PDF...', 'info');

        // Collect current realtime status data from frontend
        const currentStatusData = collectCurrentStatusData();

        // Prepare request body with both params and realtime data
        const requestBody = {
            ...params,
            current_status_data: currentStatusData
        };

        console.log('Sending PDF request with realtime data:', requestBody);

        // Fetch PDF from server with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

        const response = await fetch('/api/history/export-pdf', {
            method: 'POST', // Change to POST to send body data
            headers: {
                'Accept': 'application/pdf',
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            throw new Error(`Server error: ${response.status} - ${errorText}`);
        }

        // Check if response is actually PDF
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/pdf')) {
            throw new Error('Server did not return a PDF file');
        }

        // Get PDF blob
        const blob = await response.blob();

        if (blob.size === 0) {
            throw new Error('PDF file is empty');
        }

        // Handle PDF display/download
        if (params.format === 'view') {
            // Open in new tab
            const url = window.URL.createObjectURL(blob);
            const newWindow = window.open(url, '_blank');

            if (!newWindow) {
                // If popup blocked, fallback to download
                console.warn('Popup blocked, falling back to download');
                downloadBlob(blob, params.filename);
            } else {
                // Clean up URL after a delay to allow the browser to load the PDF
                setTimeout(() => {
                    window.URL.revokeObjectURL(url);
                }, 10000);
            }
        } else {
            // Direct download
            downloadBlob(blob, params.filename);
        }

        showNotification('Laporan PDF berhasil dibuat', 'success');

    } catch (error) {
        console.error('Export PDF Error:', error);

        let errorMessage = 'Gagal membuat laporan PDF';

        if (error.name === 'AbortError') {
            errorMessage = 'Timeout: Server terlalu lama merespons';
        } else if (error.message.includes('Server error')) {
            errorMessage = `Server error: ${error.message}`;
        } else if (error.message.includes('NetworkError') || error.message.includes('fetch')) {
            errorMessage = 'Koneksi ke server bermasalah';
        } else {
            errorMessage = error.message || errorMessage;
        }

        showNotification(errorMessage, 'error');
    }
}

/**
 * Helper function to download blob as file
 */
function downloadBlob(blob, filename) {
    try {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;

        document.body.appendChild(a);
        a.click();

        // Clean up
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

    } catch (error) {
        console.error('Error downloading blob:', error);
        throw new Error('Gagal mendownload file');
    }
}

/**
 * Collect current status data from frontend (realtime data)
 */
function collectCurrentStatusData() {
    try {
        const statusData = {
            nodes: [],
            summary: {
                total: 0,
                online: 0,
                offline: 0,
                partial: 0,
                timestamp: new Date().toISOString()
            }
        };

        // Method 1: From global window.nodes if available
        if (window.nodes && Array.isArray(window.nodes)) {
            statusData.nodes = window.nodes.map(node => ({
                endpoint: node.endpoint || node.ip_address,
                ip_address: node.ip_address,
                name: node.name || node.building,
                status: normalizeStatus(node.status),
                last_updated: node.last_updated || new Date().toISOString()
            }));
        }

        // Method 2: From global phoneData/endpointData
        else if (window.phoneData && Array.isArray(window.phoneData)) {
            statusData.nodes = window.phoneData.map(phone => ({
                endpoint: phone.endpoint || phone.ip_address,
                ip_address: phone.ip_address,
                name: phone.name || phone.building,
                status: normalizeStatus(phone.status),
                last_updated: phone.last_updated || new Date().toISOString()
            }));
        }

        // Method 3: From DOM table elements
        else {
            const tables = [
                '#phone-table tbody',
                '#status-table tbody',
                '#nodes-table tbody',
                '.nodes-table tbody'
            ];

            let tableFound = false;
            for (const selector of tables) {
                const table = document.querySelector(selector);
                if (table) {
                    const rows = table.querySelectorAll('tr');
                    statusData.nodes = Array.from(rows).map(row => {
                        const cells = row.querySelectorAll('td');
                        if (cells.length < 3) return null;

                        const endpoint = cells[0]?.textContent?.trim() || '';
                        const ipAddress = cells[1]?.textContent?.trim() || '';
                        const name = cells[2]?.textContent?.trim() || '';

                        // Find status badge/indicator
                        const statusElement = row.querySelector('.status-badge, .badge, .status-indicator, [class*="status"]');
                        let status = 'offline';

                        if (statusElement) {
                            const statusText = statusElement.textContent?.toLowerCase().trim() || '';
                            const statusClass = statusElement.className?.toLowerCase() || '';

                            if (statusText.includes('online') || statusText.includes('aktif') ||
                                statusClass.includes('green') || statusClass.includes('success')) {
                                status = 'online';
                            } else if (statusText.includes('partial') || statusText.includes('in use') ||
                                statusClass.includes('yellow') || statusClass.includes('warning')) {
                                status = 'partial';
                            }
                        }

                        return {
                            endpoint: endpoint || ipAddress,
                            ip_address: ipAddress,
                            name: name,
                            status: status,
                            last_updated: new Date().toISOString()
                        };
                    }).filter(Boolean);

                    tableFound = true;
                    break;
                }
            }

            if (!tableFound) {
                console.warn('No data table found, using preview statistics');
                // Fallback: get data from preview statistics
                const totalEl = document.getElementById('preview-total');
                const onlineEl = document.getElementById('preview-online');
                const offlineEl = document.getElementById('preview-offline');

                if (totalEl && onlineEl && offlineEl) {
                    const total = parseInt(totalEl.textContent) || 0;
                    const online = parseInt(onlineEl.textContent) || 0;
                    const offline = parseInt(offlineEl.textContent) || 0;

                    // Generate dummy nodes data based on statistics
                    for (let i = 1; i <= total; i++) {
                        statusData.nodes.push({
                            endpoint: `endpoint-${i}`,
                            ip_address: `192.168.1.${i}`,
                            name: `Telepon ${i}`,
                            status: i <= online ? 'online' : 'offline',
                            last_updated: new Date().toISOString()
                        });
                    }
                }
            }
        }

        // Calculate summary from collected nodes
        statusData.summary.total = statusData.nodes.length;
        statusData.summary.online = statusData.nodes.filter(n => n.status === 'online').length;
        statusData.summary.offline = statusData.nodes.filter(n => n.status === 'offline').length;
        statusData.summary.partial = statusData.nodes.filter(n => n.status === 'partial').length;

        console.log('Collected current status data:', statusData);
        return statusData;

    } catch (error) {
        console.error('Error collecting current status data:', error);
        return {
            nodes: [],
            summary: { total: 0, online: 0, offline: 0, partial: 0, timestamp: new Date().toISOString() },
            error: error.message
        };
    }
}
function updatePdfPreviewStats() {
    try {
        const totalEl = document.getElementById('preview-total');
        const onlineEl = document.getElementById('preview-online');
        const offlineEl = document.getElementById('preview-offline');
        const uptimeEl = document.getElementById('preview-uptime');
        const periodEl = document.getElementById('preview-period');

        if (!totalEl) {
            console.warn('Preview elements not found');
            return;
        }

        // Get current form data to determine period
        const form = document.getElementById('pdf-export-form');
        let currentPeriod = 30; // default

        if (form) {
            const formData = new FormData(form);
            const dateMethod = formData.get('dateMethod');

            if (dateMethod === 'custom') {
                const startDate = formData.get('start_date');
                const endDate = formData.get('end_date');

                if (startDate && endDate) {
                    const start = new Date(startDate);
                    const end = new Date(endDate);
                    const timeDiff = end.getTime() - start.getTime();
                    currentPeriod = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
                }
            } else {
                currentPeriod = parseInt(formData.get('period')) || 30;
            }
        }

        // Update period display
        if (periodEl) {
            periodEl.textContent = currentPeriod;
        }

        // Check if nodes data is available
        if (!window.nodes || !Array.isArray(window.nodes)) {
            // Try to get data from global variables or DOM
            let nodesData = [];

            // Check if data is available in window object
            if (window.phoneData && Array.isArray(window.phoneData)) {
                nodesData = window.phoneData;
            } else if (window.endpointData && Array.isArray(window.endpointData)) {
                nodesData = window.endpointData;
            } else {
                // Try to get from table if available
                const table = document.querySelector('#phone-table tbody, #status-table tbody');
                if (table) {
                    const rows = table.querySelectorAll('tr');
                    nodesData = Array.from(rows).map(row => {
                        const statusCell = row.querySelector('.status-badge, .badge');
                        const status = statusCell ? statusCell.textContent.toLowerCase() : 'unknown';
                        return {
                            status: status.includes('online') || status.includes('aktif') ? 'online' : 'offline'
                        };
                    });
                }
            }

            if (nodesData.length === 0) {
                console.warn('No nodes data available for preview, using sample data');
                // Use sample data for demonstration
                nodesData = [
                    {status: 'online'}, {status: 'online'}, {status: 'offline'},
                    {status: 'online'}, {status: 'online'}, {status: 'online'},
                    {status: 'offline'}, {status: 'online'}, {status: 'online'},
                    {status: 'online'}
                ];
            }

            window.nodes = nodesData;
        }

        const total = window.nodes.length;
        const online = window.nodes.filter(n => {
            const status = normalizeStatus(n.status);
            return status === 'online' || status === 'aktif';
        }).length;
        const offline = total - online;
        const avgUptime = total > 0 ? Math.round((online / total) * 100) : 0;

        // Update display with animation
        animateNumberUpdate(totalEl, parseInt(totalEl.textContent) || 0, total);
        animateNumberUpdate(onlineEl, parseInt(onlineEl.textContent) || 0, online);
        animateNumberUpdate(offlineEl, parseInt(offlineEl.textContent) || 0, offline);
        animateNumberUpdate(uptimeEl, parseInt(uptimeEl.textContent) || 0, avgUptime, '%');

        // Update colors based on status
        if (avgUptime >= 90) {
            uptimeEl.className = uptimeEl.className.replace(/text-\w+-600/, 'text-green-600');
        } else if (avgUptime >= 75) {
            uptimeEl.className = uptimeEl.className.replace(/text-\w+-600/, 'text-yellow-600');
        } else {
            uptimeEl.className = uptimeEl.className.replace(/text-\w+-600/, 'text-red-600');
        }

    } catch (error) {
        console.error('Error updating preview stats:', error);
        // Fallback to static values
        const totalEl = document.getElementById('preview-total');
        const onlineEl = document.getElementById('preview-online');
        const offlineEl = document.getElementById('preview-offline');
        const uptimeEl = document.getElementById('preview-uptime');

        if (totalEl) totalEl.textContent = '0';
        if (onlineEl) onlineEl.textContent = '0';
        if (offlineEl) offlineEl.textContent = '0';
        if (uptimeEl) uptimeEl.textContent = '0%';
    }
}

/**
 * Animate number updates for better UX
 */
function animateNumberUpdate(element, startValue, endValue, suffix = '') {
    if (!element || startValue === endValue) {
        if (element) element.textContent = endValue + suffix;
        return;
    }

    const duration = 500; // 500ms animation
    const startTime = performance.now();
    const difference = endValue - startValue;

    function updateNumber(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease out animation
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const currentValue = Math.round(startValue + (difference * easeProgress));

        element.textContent = currentValue + suffix;

        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        }
    }

    requestAnimationFrame(updateNumber);
}

/**
 * Normalize status values for consistency
 */
function normalizeStatus(status) {
    if (!status) return 'unknown';

    const statusLower = status.toString().toLowerCase().trim();

    if (statusLower.includes('online') || statusLower.includes('aktif') || statusLower.includes('up')) {
        return 'online';
    } else if (statusLower.includes('offline') || statusLower.includes('down') || statusLower.includes('tidak')) {
        return 'offline';
    }

    return statusLower;
}

function quickExportPdf() {
    exportPdfReport({
        period: '30',
        quarter: 'IV',
        year: new Date().getFullYear().toString(),
        format: 'download',
        report_type: 'summary'
    });
}

async function exportPdf(period = 30, quarter = 'IV', year = new Date().getFullYear()) {
    console.warn('exportPdf is deprecated, use exportPdfReport instead');
    return exportPdfReport({
        period: period.toString(),
        quarter: quarter,
        year: year.toString(),
        format: 'download'
    });
}

// Export functions to global scope with error handling
try {
    // Main export functions
    window.showPdfExportModal = showPdfExportModal;
    window.handlePdfExport = handlePdfExport;
    window.exportPdfReport = exportPdfReport;
    window.exportHistory = exportHistory;
    window.quickExportPdf = quickExportPdf;
    window.exportPdf = exportPdf; // Legacy support

    // Helper functions
    window.closePdfModal = closePdfModal;
    window.toggleDateMethod = toggleDateMethod;
    window.setQuickDate = setQuickDate;
    window.setupDateEventListeners = setupDateEventListeners;
    window.updateCustomDatePreview = updateCustomDatePreview;
    window.updatePdfPreviewStats = updatePdfPreviewStats;
    window.downloadBlob = downloadBlob;
    window.animateNumberUpdate = animateNumberUpdate;
    window.normalizeStatus = normalizeStatus;

    console.log('PDF export functions loaded successfully');

} catch (error) {
    console.error('Error loading PDF export functions:', error);
}

<?php

/**
 * Enhanced Export PDF Report with Realtime Data Support
 * POST/GET /api/history/export-pdf
 */
public function exportPdf(Request $request)
{
    try {
        // Validate request parameters
        $validator = Validator::make($request->all(), [
            'date_method' => 'string|in:preset,custom',
            'start_date' => 'nullable|date|required_if:date_method,custom',
            'end_date' => 'nullable|date|required_if:date_method,custom|after_or_equal:start_date',
            'period' => 'nullable|integer|min:1|max:365',
            'quarter' => 'string|in:I,II,III,IV',
            'year' => 'integer|min:2020|max:2030',
            'report_type' => 'string|in:summary,detailed,kpi',
            'include_charts' => 'string|in:true,false',
            'include_ranking' => 'string|in:true,false',
            'include_history' => 'string|in:true,false',
            'include_recommendations' => 'string|in:true,false',
            'timeframe' => 'string|in:days,from_start,quarter',
            'current_status_data' => 'array|nullable', // New field for realtime data
            'current_status_data.nodes' => 'array|nullable',
            'current_status_data.summary' => 'array|nullable'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Invalid parameters',
                'messages' => $validator->errors()
            ], 400);
        }

        // Get and process parameters
        $dateMethod = $request->get('date_method', 'preset');
        $reportType = $request->get('report_type', 'summary');
        $quarter = $request->get('quarter', 'IV');
        $year = $request->get('year', date('Y'));

        // Determine date range based on method
        if ($dateMethod === 'custom') {
            $startDate = Carbon::parse($request->get('start_date'));
            $endDate = Carbon::parse($request->get('end_date'))->endOfDay();
            $period = $startDate->diffInDays($endDate) + 1;
        } else {
            $period = (int) $request->get('period', 30);
            $timeframe = $request->get('timeframe', 'days');

            // Calculate dates based on timeframe
            switch ($timeframe) {
                case 'from_start':
                    $startDate = Carbon::create($year, 1, 1)->startOfDay();
                    $endDate = Carbon::now()->endOfDay();
                    break;
                case 'quarter':
                    [$startDate, $endDate] = $this->getQuarterDateRange($quarter, $year);
                    break;
                case 'days':
                default:
                    $endDate = Carbon::now()->endOfDay();
                    $startDate = Carbon::now()->subDays($period - 1)->startOfDay();
                    break;
            }
        }

        // Validate date range
        $daysDiff = round($startDate->diffInDays($endDate) + 1);
        if ($daysDiff > 365) {
            return response()->json([
                'error' => 'Date range too large',
                'message' => 'Maximum date range is 365 days'
            ], 400);
        }

        // Get report options
        $includeCharts = $request->get('include_charts', 'true') === 'true';
        $includeRanking = $request->get('include_ranking', 'true') === 'true';
        $includeHistory = $request->get('include_history', 'false') === 'true';
        $includeRecommendations = $request->get('include_recommendations', 'false') === 'true';

        // **MAIN CHANGE: Use realtime data if available, fallback to database**
        $currentStatusData = $request->get('current_status_data');

        if ($currentStatusData && isset($currentStatusData['nodes']) && count($currentStatusData['nodes']) > 0) {
            // Use realtime data from frontend
            \Log::info('Using realtime status data from frontend', [
                'nodes_count' => count($currentStatusData['nodes']),
                'timestamp' => $currentStatusData['summary']['timestamp'] ?? 'unknown'
            ]);

            $nodes = collect($currentStatusData['nodes'])->map(function($nodeData) {
                return (object) [
                    'endpoint' => $nodeData['endpoint'],
                    'ip_address' => $nodeData['ip_address'],
                    'name' => $nodeData['name'],
                    'status' => $nodeData['status'],
                    'last_updated' => $nodeData['last_updated'] ?? now()->toISOString()
                ];
            });

            // Use realtime summary
            $totalNodes = $currentStatusData['summary']['total'];
            $onlineNodes = $currentStatusData['summary']['online'];
            $offlineNodes = $currentStatusData['summary']['offline'];
            $partialNodes = $currentStatusData['summary']['partial'];

            $dataSource = 'realtime_frontend';

        } else {
            // Fallback to database data
            \Log::info('No realtime data provided, using database data');

            $nodes = Node::all();
            $totalNodes = $nodes->count();
            $onlineNodes = $nodes->where('status', 'online')->count();
            $offlineNodes = $nodes->where('status', 'offline')->count();
            $partialNodes = $nodes->where('status', 'partial')->count();

            $dataSource = 'database';
        }

        // Calculate percentages
        $onlinePercentage = $totalNodes > 0 ? round(($onlineNodes / $totalNodes) * 100, 1) : 0;
        $offlinePercentage = $totalNodes > 0 ? round(($offlineNodes / $totalNodes) * 100, 1) : 0;

        // Get period-specific data (always from database for historical analysis)
        $periodStats = $this->getPeriodStatistics($startDate, $endDate);
        $frequentlyOfflineEndpoints = $this->getFrequentlyOfflineEndpoints($startDate, $endDate, 10);
        $endpointsData = $this->generateEndpointsData($nodes, $startDate, $endDate);
        $rankingData = $includeRanking ? $this->generateRankingData($nodes, $startDate, $endDate) : [];
        $historyData = $includeHistory ? $this->generateHistoryData($startDate, $endDate) : [];
        $recommendations = $includeRecommendations ? $this->generateRecommendations($endpointsData, $periodStats) : [];

        // Calculate average uptime for the period
        $avgUptime = $this->calculateAverageUptime($nodes, $startDate, $endDate);

        // Prepare report data
        $reportData = [
            // KPI Information
            'indikator' => 'KPI-TI-001',
            'nama_indikator' => 'Availability Sistem Telepon Internal',
            'formula' => '(Total Waktu Online / Total Waktu Monitoring) × 100%',
            'target' => '≥ 95%',
            'realisasi' => $avgUptime . '%',
            'status_kpi' => $avgUptime >= 95 ? 'TERCAPAI' : 'TIDAK TERCAPAI',

            // Report metadata
            'report_type' => $reportType,
            'date_method' => $dateMethod,
            'quarter' => $quarter,
            'year' => $year,
            'period_days' => $daysDiff,
            'generated_date' => Carbon::now()->format('d/m/Y H:i:s'),
            'start_date' => $startDate->format('d/m/Y'),
            'end_date' => $endDate->format('d/m/Y'),
            'start_date_long' => $startDate->locale('id')->translatedFormat('l, j F Y'),
            'end_date_long' => $endDate->locale('id')->translatedFormat('l, j F Y'),

            // Current statistics (from realtime data if available)
            'total_phones' => $totalNodes,
            'online_phones' => $onlineNodes,
            'offline_phones' => $offlineNodes,
            'partial_phones' => $partialNodes,
            'online_percentage' => $onlinePercentage,
            'offline_percentage' => $offlinePercentage,
            'avg_uptime' => $avgUptime,

            // Data source information
            'data_source' => $dataSource,
            'data_timestamp' => $currentStatusData['summary']['timestamp'] ?? now()->toISOString(),

            // Period statistics (always from database)
            'period_stats' => $periodStats,
            'frequently_offline' => $frequentlyOfflineEndpoints,

            // Data tables
            'endpoints_data' => $endpointsData,
            'ranking_data' => $rankingData,
            'history_data' => $historyData,
            'recommendations' => $recommendations,

            // Report options
            'include_charts' => $includeCharts,
            'include_ranking' => $includeRanking,
            'include_history' => $includeHistory,
            'include_recommendations' => $includeRecommendations,

            // Report signature
            'prepared_by' => 'Sistem Monitoring Telepon',
            'position' => 'Admin IT',
            'department' => 'Departemen Teknologi Informasi'
        ];

        // Add realtime data note to report if using frontend data
        if ($dataSource === 'realtime_frontend') {
            $reportData['realtime_note'] = 'Status telepon pada saat laporan dibuat: ' .
                Carbon::parse($currentStatusData['summary']['timestamp'])->format('d/m/Y H:i:s');
        }

        // Select appropriate view based on report type
        $viewName = match($reportType) {
            'detailed' => 'reports.phone-status-detailed-pdf',
            'kpi' => 'reports.phone-status-kpi-pdf',
            default => 'reports.phone-status-pdf'
        };

        // Generate PDF
        $pdf = Pdf::loadView($viewName, $reportData);

        // Configure PDF settings based on report type
        $orientation = $reportType === 'detailed' ? 'landscape' : 'portrait';
        $pdf->setPaper('A4', $orientation);
        $pdf->setOptions([
            'dpi' => 150,
            'defaultFont' => 'DejaVu Sans',
            'isRemoteEnabled' => true,
            'isHtml5ParserEnabled' => true,
            'chroot' => public_path(),
        ]);

        // Generate filename
        $filename = $this->generatePdfFilename($reportData);

        // Log successful PDF generation
        \Log::info('PDF Report generated successfully', [
            'filename' => $filename,
            'data_source' => $dataSource,
            'total_nodes' => $totalNodes,
            'report_type' => $reportType
        ]);

        return $pdf->download($filename);

    } catch (\Exception $e) {
        \Log::error('PDF Export Error: ' . $e->getMessage(), [
            'trace' => $e->getTraceAsString(),
            'request_data' => $request->all()
        ]);

        return response()->json([
            'error' => 'Failed to generate PDF report',
            'message' => $e->getMessage(),
            'code' => $e->getCode()
        ], 500);
    }
}

/**
 * Enhanced endpoints data generation with realtime awareness
 */
private function generateEndpointsData($nodes, $startDate, $endDate): array
{
    $endpointsData = [];

    foreach ($nodes as $node) {
        // Handle both database models and realtime objects
        $endpoint = is_object($node) ? ($node->endpoint ?? $node->ip_address) : $node['endpoint'];
        $ipAddress = is_object($node) ? ($node->ip_address ?? '') : $node['ip_address'];
        $name = is_object($node) ? ($node->name ?? 'Unknown') : $node['name'];
        $currentStatus = is_object($node) ? ($node->status ?? 'offline') : $node['status'];

        // Get historical data from database
        $uptimeData = $this->calculateRealUptime($endpoint, $startDate, $endDate);
        $statistics = $this->getEndpointStatistics($endpoint, $startDate, $endDate);
        $totalOffline = $this->getTotalOfflineDuration($endpoint, $startDate, $endDate);

        $endpointsData[] = [
            'endpoint' => $endpoint,
            'building' => $name,
            'ip_address' => $ipAddress,
            'current_status' => $this->formatStatus($currentStatus), // Use realtime status
            'uptime_period' => $uptimeData['uptimePercentage'] . '%',
            'total_offline_duration' => $totalOffline['formatted'],
            'total_events' => $statistics['total_events'],
            'offline_events' => $statistics['offline_events'],
            'online_events' => $statistics['online_events'],
            'reliability_score' => $this->calculateReliabilityScore($uptimeData['uptimePercentage'], $statistics['offline_events']),
            'last_updated' => is_object($node) ? ($node->last_updated ?? now()->format('d/m/Y H:i:s')) : $node['last_updated']
        ];
    }

    // Sort by reliability score (lowest first to show problematic ones first)
    usort($endpointsData, function($a, $b) {
        return $a['reliability_score'] - $b['reliability_score'];
    });

    return $endpointsData;
}

/**
 * Enhanced ranking data generation with realtime awareness
 */
private function generateRankingData($nodes, $startDate, $endDate)
{
    $rankingData = [];

    foreach ($nodes as $node) {
        // Handle both database models and realtime objects
        $endpoint = is_object($node) ? ($node->endpoint ?? $node->ip_address) : $node['endpoint'];
        $ipAddress = is_object($node) ? ($node->ip_address ?? '') : $node['ip_address'];
        $name = is_object($node) ? ($node->name ?? 'Unknown') : $node['name'];

        $uptimeData = $this->calculateRealUptime($endpoint, $startDate, $endDate);
        $statistics = $this->getEndpointStatistics($endpoint, $startDate, $endDate);
        $totalOfflineDuration = $this->getTotalOfflineDuration($endpoint, $startDate, $endDate);

        // Only include endpoints that have had offline events
        if ($statistics['offline_events'] > 0) {
            $rankingData[] = [
                'endpoint' => $endpoint,
                'building' => $name,
                'ip_address' => $ipAddress,
                'uptime_period' => $uptimeData['uptimePercentage'] . '%',
                'total_offline_duration' => $totalOfflineDuration['formatted'],
                'total_events' => $statistics['total_events'],
                'offline_events' => $statistics['offline_events'],
                'online_events' => $statistics['online_events'],
                'last_activity' => $this->getLastActivity($endpoint),
                'offline_score' => $statistics['offline_events'] // For sorting
            ];
        }
    }

    // Sort by offline events (descending - most problematic first)
    usort($rankingData, function($a, $b) {
        return $b['offline_score'] - $a['offline_score'];
    });

    // Add ranking numbers
    foreach ($rankingData as $index => &$data) {
        $data['rank'] = $index + 1;
    }

    return array_slice($rankingData, 0, 20); // Top 20 most problematic
}

/**
 * Enhanced average uptime calculation with realtime awareness
 */
private function calculateAverageUptime($nodes, $startDate, $endDate): float
{
    $totalUptime = 0;
    $nodeCount = 0;

    foreach ($nodes as $node) {
        // Handle both database models and realtime objects
        $endpoint = is_object($node) ? ($node->endpoint ?? $node->ip_address) : $node['endpoint'];

        $uptimeData = $this->calculateRealUptime($endpoint, $startDate, $endDate);
        if ($uptimeData['dataAvailable']) {
            $totalUptime += $uptimeData['uptimePercentage'];
            $nodeCount++;
        }
    }

    return $nodeCount > 0 ? round($totalUptime / $nodeCount, 1) : 0;
}

/**
 * Enhanced filename generation with data source info
 */
private function generatePdfFilename($reportData): string
{
    $type = ucfirst($reportData['report_type']);
    $dataSource = $reportData['data_source'] === 'realtime_frontend' ? 'Realtime' : 'Historical';

    if ($reportData['date_method'] === 'custom') {
        $start = str_replace('/', '-', $reportData['start_date']);
        $end = str_replace('/', '-', $reportData['end_date']);
        return "Laporan_{$type}_{$dataSource}_Status_Telepon_{$start}_to_{$end}.pdf";
    } else {
        $quarter = $reportData['quarter'];
        $year = $reportData['year'];
        $period = $reportData['period_days'];
        return "Laporan_{$type}_{$dataSource}_Status_Telepon_Q{$quarter}_{$year}_{$period}hari.pdf";
    }
}

// ... other existing methods remain the same ...

<?php

// routes/web.php or routes/api.php

// Support both GET (backward compatibility) and POST (with realtime data)
Route::match(['GET', 'POST'], '/api/history/export-pdf', [HistoryController::class, 'exportPdf'])
    ->name('history.export-pdf');

// Alternative approach - separate routes if needed
Route::get('/api/history/export-pdf', [HistoryController::class, 'exportPdf'])
    ->name('history.export-pdf.get');

Route::post('/api/history/export-pdf', [HistoryController::class, 'exportPdf'])
    ->name('history.export-pdf.post');

?>
