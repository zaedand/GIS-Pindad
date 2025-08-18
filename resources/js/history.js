function showPdfExportModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4';

    // Calculate default date ranges
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentQuarter = Math.ceil((today.getMonth() + 1) / 3);

    modal.innerHTML = `
        <div class="bg-white rounded-2xl w-full max-w-7xl flex flex-col shadow-2xl" style="max-height: 95vh; min-height: 70vh;">
            <!-- Header - Fixed -->
            <div class="flex-shrink-0 p-4 sm:p-6 border-b border-gray-200 bg-red-500 text-white rounded-t-2xl">
                <div class="flex justify-between items-center">
                    <div>
                        <h2 class="text-xl sm:text-2xl font-bold">
                            <i class="fas fa-file-pdf mr-2"></i>Export Laporan KPI PDF
                        </h2>
                        <p class="mt-1 opacity-90 text-sm sm:text-base">Generate laporan KPI status telepon dengan informasi lengkap</p>
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

                    <!-- Header Information Section -->
                    <div class="bg-blue-50 rounded-xl p-4 sm:p-6 border border-blue-200">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <i class="fas fa-info-circle text-blue-500"></i>
                            Informasi Header Laporan
                        </h3>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Triwulan</label>
                                <select name="quarter" onchange="updatePdfPreviewStats()" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                    <option value="I" ${currentQuarter === 1 ? 'selected' : ''}>Triwulan I</option>
                                    <option value="II" ${currentQuarter === 2 ? 'selected' : ''}>Triwulan II</option>
                                    <option value="III" ${currentQuarter === 3 ? 'selected' : ''}>Triwulan III</option>
                                    <option value="IV" ${currentQuarter === 4 ? 'selected' : ''}>Triwulan IV</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Tahun</label>
                                <select name="year" onchange="updatePdfPreviewStats()" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                    <option value="2023">2023</option>
                                    <option value="2024" ${currentYear === 2024 ? 'selected' : ''}>2024</option>
                                    <option value="2025" ${currentYear === 2025 ? 'selected' : ''}>2025</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Departemen</label>
                                <select name="department" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                    <option value="DEPARTEMEN SERVICE RESPRESENTATIVE TI TUREN" selected>DEPARTEMEN SERVICE RESPRESENTATIVE TI TUREN</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- KPI Information Section -->
                    <div class="bg-green-50 rounded-xl p-4 sm:p-6 border border-green-200">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <i class="fas fa-chart-line text-green-500"></i>
                            Informasi KPI
                        </h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Indikator</label>
                                <input type="text" name="indikator" value="KPI-TI-001" required
                                       class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Nama Indikator</label>
                                <textarea name="nama_indikator" rows="3" required
                                          class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500">Inventarisasi PC PMN Monitoring Produksi Munisi dan Seat Management (PC, Laptop & Printer) Area PT Pindad Turen (Lengkap dan Update Per Triwulan)</textarea>
                            </div>
                            <div class="md:col-span-2">
                                <label class="block text-sm font-medium text-gray-700 mb-2">Formula</label>
                                <textarea name="formula" rows="3" required
                                          class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500">Inventarisasi PC PMN Monitoring Produksi Munisi dan Seat Management (PC, Laptop & Printer) Area PT Pindad Turen (Lengkap dan Update Per Triwulan)</textarea>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Target</label>
                                <input type="text" name="target" value="1 Dokumen" required
                                       class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Realisasi</label>
                                <input type="text" name="realisasi" value="Tercapai 1 dokumen" required
                                       class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500">
                            </div>
                        </div>
                    </div>

                    <!-- Date Range Selection -->
                    <div class="bg-gray-50 rounded-xl p-4 sm:p-6 border border-gray-200">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <i class="fas fa-calendar-alt text-indigo-500"></i>
                            Pilih Periode Laporan
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
                        <div id="preset-options" class="grid grid-cols-2 md:grid-cols-2 gap-4 mb-6">
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
                                           value="${new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]}"
                                           max="${today.toISOString().split('T')[0]}"
                                           class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                           onchange="updateCustomDatePreview()">
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">
                                        <i class="fas fa-calendar-check mr-1"></i>Tanggal Akhir
                                    </label>
                                    <input type="date" name="end_date"
                                           value="${today.toISOString().split('T')[0]}"
                                           max="${today.toISOString().split('T')[0]}"
                                           class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                           onchange="updateCustomDatePreview()">
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

                    <!-- Footer Information Section -->
                    <div class="bg-purple-50 rounded-xl p-4 sm:p-6 border border-purple-200">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <i class="fas fa-signature text-purple-500"></i>
                            Informasi Footer & Tanda Tangan
                        </h3>

                        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <!-- Disiapkan Oleh -->
                            <div class="space-y-4">
                                <h4 class="font-semibold text-gray-700 border-b pb-2">DISIAPKAN OLEH</h4>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Jabatan</label>
                                    <input type="text" name="prepared_jabatan" value="OFFICER MANAJEMEN SISTEM KOMPUTER TUREN" required
                                           class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Nama</label>
                                    <input type="text" name="prepared_nama" value="MUHAMMAD" required
                                           class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Tanggal</label>
                                    <input type="date" name="prepared_tanggal" value="${today.toISOString().split('T')[0]}" required
                                           class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                                </div>
                            </div>

                            <!-- Disetujui Oleh -->
                            <div class="space-y-4">
                                <h4 class="font-semibold text-gray-700 border-b pb-2">DISETUJUI OLEH</h4>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Jabatan</label>
                                    <input type="text" name="approved_jabatan" value="MANAGER" required
                                           class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Nama</label>
                                    <input type="text" name="approved_nama" value="kimi" placeholder="Masukkan nama..." required
                                           class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Tanggal</label>
                                    <input type="date" name="approved_tanggal" value="${today.toISOString().split('T')[0]}"
                                           class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                                </div>
                            </div>

                            <!-- Disahkan Oleh -->
                            <div class="space-y-4">
                                <h4 class="font-semibold text-gray-700 border-b pb-2">DISAHKAN OLEH</h4>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Jabatan</label>
                                    <input type="text" name="validated_jabatan" value="MANAGER LAYANAN TI BANDUNG TUREN" required
                                           class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Nama</label>
                                    <input type="text" name="validated_nama" value="RIZKY" required
                                           class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Tanggal</label>
                                    <input type="date" name="validated_tanggal" value="${today.toISOString().split('T')[0]}" required
                                           class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
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
            document.body.style.overflow = '';
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

        // Validasi form sebelum submit
        if (!validatePdfForm(formData, dateMethod)) {
            return; // Validation failed, stop execution
        }

        // Prepare data untuk dikirim ke controller
        let exportData = {
            format: format,
            report_type: 'kpi',

            // Header information
            quarter: formData.get('quarter'),
            year: formData.get('year'),
            department: formData.get('department'),

            // KPI Information - Data yang diinput user
            indikator: formData.get('indikator'),
            nama_indikator: formData.get('nama_indikator'),
            formula: formData.get('formula'),
            target: formData.get('target'),
            realisasi: formData.get('realisasi'),

            // Footer/Signature Information - Data yang diinput user
            prepared_jabatan: formData.get('prepared_jabatan'),
            prepared_nama: formData.get('prepared_nama'),
            prepared_tanggal: formData.get('prepared_tanggal'),
            approved_jabatan: formData.get('approved_jabatan'),
            approved_nama: formData.get('approved_nama'),
            approved_tanggal: formData.get('approved_tanggal'),
            validated_jabatan: formData.get('validated_jabatan'),
            validated_nama: formData.get('validated_nama'),
            validated_tanggal: formData.get('validated_tanggal'),

            // Date handling
            date_method: dateMethod
        };

        // Handle date selection
        if (dateMethod === 'custom') {
            const startDate = formData.get('start_date');
            const endDate = formData.get('end_date');

            if (!startDate || !endDate) {
                showNotification('Mohon pilih tanggal mulai dan akhir', 'warning');
                return;
            }

            // Validasi tanggal
            const startDateObj = new Date(startDate);
            const endDateObj = new Date(endDate);

            if (startDateObj > endDateObj) {
                showNotification('Tanggal mulai tidak boleh lebih besar dari tanggal akhir', 'warning');
                return;
            }

            // Check date range limit (max 365 days)
            const daysDiff = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 3600 * 24)) + 1;
            if (daysDiff > 365) {
                showNotification('Periode maksimal 365 hari. Periode saat ini: ' + daysDiff + ' hari', 'warning');
                return;
            }

            exportData.start_date = startDate;
            exportData.end_date = endDate;
            exportData.period = daysDiff.toString();
        } else {
            // Preset period
            exportData.period = formData.get('period') || '30';
            exportData.timeframe = formData.get('timeframe') || 'days';
        }

        // Debug log untuk melihat data yang akan dikirim
        console.log('PDF Export Data:', exportData);

        // Close modal
        const modal = form.closest('.fixed');
        if (modal) {
            modal.remove();
            document.body.style.overflow = ''; // Restore scroll
        }

        // Show loading notification
        const loadingMsg = format === 'download' ?
            'Mengunduh laporan KPI... Estimasi: 10-30 detik' :
            'Membuka preview laporan... Estimasi: 10-30 detik';

        showNotification(loadingMsg, 'info');

        // Kirim data ke controller menggunakan fetch API
        sendPdfExportToController(exportData);

    } catch (error) {
        console.error('Error in handlePdfExport:', error);
        showNotification('Terjadi kesalahan saat memproses export PDF: ' + error.message, 'error');
    }
}

function sendPdfExportToController(exportData) {
    // Ubah semua data jadi query string
    const queryString = new URLSearchParams(exportData).toString();
    const exportUrl = `/api/history/export-pdf?${queryString}`;

    // Pakai GET supaya gak ribet CSRF
    fetch(exportUrl, {
        method: 'GET',
        headers: {
            'Accept': 'application/pdf',
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Error ${response.status}`);
        }
        return response.blob();
    })
    .then(blob => {
        // Download PDF
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        // Nama file dari input user
        const quarter = exportData.quarter || 'IV';
        const year = exportData.year || '2025';
        const indikator = exportData.indikator || 'KPI';
        const today = new Date().toISOString().split('T')[0];

        a.download = `Laporan_KPI_${indikator}_Q${quarter}_${year}_${today}.pdf`;
        document.body.appendChild(a);
        a.click();

        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        showNotification('PDF berhasil diunduh!', 'success');
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Gagal membuat PDF: ' + error.message, 'error');
    });
}

function handlePdfDownload(blob, exportData) {
    try {
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;

        // Generate filename berdasarkan data yang diinput
        const quarter = exportData.quarter || 'IV';
        const year = exportData.year || new Date().getFullYear();
        const timestamp = new Date().toISOString().split('T')[0];

        a.download = `Laporan_KPI_${exportData.indikator}_Q${quarter}_${year}_${timestamp}.pdf`;

        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        showNotification('Laporan KPI berhasil diunduh', 'success');
    } catch (error) {
        console.error('Error downloading PDF:', error);
        showNotification('Gagal mengunduh file PDF', 'error');
    }
}

function validatePdfForm(formData, dateMethod) {
    // Validasi field wajib untuk KPI
    const requiredFields = {
        'indikator': 'Indikator KPI',
        'nama_indikator': 'Nama Indikator',
        'formula': 'Formula KPI',
        'target': 'Target KPI',
        'realisasi': 'Realisasi KPI'
    };

    // Validasi field wajib untuk footer
    const requiredFooterFields = {
        'prepared_jabatan': 'Jabatan Penyusun',
        'prepared_nama': 'Nama Penyusun',
        'prepared_tanggal': 'Tanggal Penyusun',
        'approved_jabatan': 'Jabatan Penyetuju',
        'approved_nama': 'Nama Penyetuju',
        'validated_jabatan': 'Jabatan Validator',
        'validated_nama': 'Nama Validator',
        'validated_tanggal': 'Tanggal Validator'
    };

    // Gabungkan semua required fields
    const allRequiredFields = { ...requiredFields, ...requiredFooterFields };

    for (const [field, label] of Object.entries(allRequiredFields)) {
        const value = formData.get(field);
        if (!value || value.trim() === '') {
            showNotification(`Field "${label}" tidak boleh kosong`, 'warning');

            // Focus pada field yang error
            const fieldElement = document.querySelector(`[name="${field}"]`);
            if (fieldElement) {
                fieldElement.focus();
                fieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }

            return false;
        }
    }

    // Validasi tanggal custom
    if (dateMethod === 'custom') {
        const startDate = formData.get('start_date');
        const endDate = formData.get('end_date');

        if (!startDate || !endDate) {
            showNotification('Tanggal mulai dan akhir harus diisi untuk periode custom', 'warning');
            return false;
        }

        // Validasi logika tanggal
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);

        if (startDateObj > endDateObj) {
            showNotification('Tanggal mulai tidak boleh lebih besar dari tanggal akhir', 'warning');
            return false;
        }
    }

    return true;
}

function closePdfModal(button) {
    const modal = button.closest('.fixed');
    if (modal) {
        modal.remove();
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
        updatePdfPreviewStats();
    } else {
        presetOptions.classList.add('hidden');
        customOptions.classList.remove('hidden');
        updateCustomDatePreview();
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

    customRadio.checked = true;
    toggleDateMethod('custom');

    startDateInput.value = startDate.toISOString().split('T')[0];
    endDateInput.value = endDate.toISOString().split('T')[0];

    updateCustomDatePreview();
    updatePdfPreviewStats();
}

function setupDateEventListeners() {
    const startDateInput = document.querySelector('input[name="start_date"]');
    const endDateInput = document.querySelector('input[name="end_date"]');

    if (startDateInput && endDateInput) {
        startDateInput.addEventListener('change', () => {
            if (endDateInput.value < startDateInput.value) {
                endDateInput.value = startDateInput.value;
            }
            endDateInput.min = startDateInput.value;
            updateCustomDatePreview();
            updatePdfPreviewStats();
        });

        endDateInput.addEventListener('change', () => {
            if (startDateInput.value > endDateInput.value) {
                startDateInput.value = endDateInput.value;
            }
            updateCustomDatePreview();
            updatePdfPreviewStats();
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
            const options = {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
            };

            previewStartDate.textContent = startDate.toLocaleDateString('id-ID', options);
            previewEndDate.textContent = endDate.toLocaleDateString('id-ID', options);

            const timeDiff = endDate.getTime() - startDate.getTime();
            const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
            previewTotalDays.textContent = `${daysDiff} hari`;

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

        const form = document.getElementById('pdf-export-form');
        let currentPeriod = 30;

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

        if (periodEl) {
            periodEl.textContent = currentPeriod;
        }

        // Get nodes data or use sample data
        let nodesData = window.nodes || [
            {status: 'online'}, {status: 'online'}, {status: 'offline'},
            {status: 'online'}, {status: 'online'}, {status: 'online'},
            {status: 'offline'}, {status: 'online'}, {status: 'online'},
            {status: 'online'}
        ];

        const total = nodesData.length;
        const online = nodesData.filter(n => {
            const status = (n.status || '').toLowerCase();
            return status === 'online' || status === 'aktif';
        }).length;
        const offline = total - online;
        const avgUptime = total > 0 ? Math.round((online / total) * 100) : 0;

        // Update display with animation
        animateNumberUpdate(totalEl, parseInt(totalEl.textContent) || 0, total);
        animateNumberUpdate(onlineEl, parseInt(onlineEl.textContent) || 0, online);
        animateNumberUpdate(offlineEl, parseInt(offlineEl.textContent) || 0, offline);
        animateNumberUpdate(uptimeEl, parseInt(uptimeEl.textContent) || 0, avgUptime, '%');

        // Update uptime color based on percentage
        if (avgUptime >= 90) {
            uptimeEl.className = uptimeEl.className.replace(/text-\w+-600/, 'text-green-600');
        } else if (avgUptime >= 75) {
            uptimeEl.className = uptimeEl.className.replace(/text-\w+-600/, 'text-yellow-600');
        } else {
            uptimeEl.className = uptimeEl.className.replace(/text-\w+-600/, 'text-red-600');
        }

    } catch (error) {
        console.error('Error updating preview stats:', error);
    }
}

function animateNumberUpdate(element, startValue, endValue, suffix = '') {
    if (!element) return;

    const duration = 500; // 0.5 detik
    const startTime = performance.now();

    function updateNumber(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function untuk animasi yang smooth
        const easedProgress = 1 - Math.pow(1 - progress, 3);

        const currentValue = Math.round(startValue + (endValue - startValue) * easedProgress);
        element.textContent = currentValue + suffix;

        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        }
    }

    requestAnimationFrame(updateNumber);
}

// Alternative function jika menggunakan AJAX dengan jQuery (opsional)
function sendPdfExportWithJQuery(exportData) {
    if (typeof $ === 'undefined') {
        console.error('jQuery not available, using fetch instead');
        sendPdfExportToController(exportData);
        return;
    }

    $.ajax({
        url: '/api/history/export-pdf', // Sesuaikan dengan route controller Anda
        method: 'POST',
        data: exportData,
        dataType: 'json',
        headers: {
            'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
        },
        success: function(response) {
            if (response.success) {
                showNotification(response.message || 'Laporan berhasil diexport', 'success');

                // Jika ada URL download di response
                if (response.download_url) {
                    window.open(response.download_url, '_blank');
                }
            } else {
                showNotification(response.message || 'Export gagal', 'error');
            }
        },
        error: function(xhr, status, error) {
            console.error('Ajax error:', error);
            showNotification('Gagal mengirim data ke server: ' + error, 'error');
        }
    });
}
