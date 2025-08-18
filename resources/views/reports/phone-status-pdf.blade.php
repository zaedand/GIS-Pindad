<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            margin: 0;
            padding: 20px;
            line-height: 1.4;
        }

        .header {
            display: flex;
            align-items: center;
            margin-bottom: 20px;
        }

        .header .logo {
            width: 100px;
            height: auto;
            margin-right: 15px;
        }

        .header .title {
            font-size: 20px;
            font-weight: bold;
            margin: 0; /* hilangkan margin default h3 */
        }

        .header .header-text {
            flex: 1;
            text-align: center; /* teks di tengah */
        }

        .header .header-text h3 {
            margin: 0;
            font-size: 18px;
            font-weight: bold;
        }
        .header .header-text p {
            margin: 0;
            font-size: 16px;
            font-weight: bold;
            line-height: 1.4;
        }

        .metadata-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
        }

        .metadata-table td {
            padding: 6px 8px;
            vertical-align: top;
            font-size: 12px;
        }

        .metadata-table td:first-child {
            width: 150px;
            font-weight: bold;
        }

        .section-title {
            font-weight: bold;
            font-size: 13px;
            margin: 25px 0 10px 0;
            color: #333;
            border-bottom: 2px solid #333;
            padding-bottom: 5px;
        }

        .summary-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }

        .summary-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px dotted #ccc;
        }

        .summary-label {
            font-weight: bold;
        }

        .summary-value {
            font-weight: normal;
        }

        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 12px;
        }

        .data-table th, .data-table td {
            border: 1px solid #333;
            padding: 4px 3px;
            text-align: left;
        }

        .data-table th {
            background-color: #f0f0f0;
            font-weight: bold;
            text-align: center;
            font-size: 12px;
        }

        .data-table td {
            font-size: 12px;
        }

        .uptime-good { color: #10b981; font-weight: bold; }
        .uptime-warning { color: #f59e0b; font-weight: bold; }
        .uptime-critical { color: #ef4444; font-weight: bold; }

        .page-break {
            page-break-before: always;
        }

        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }

        /* Print styles */
        @media print {
            body { margin: 0; }
            .page-break { page-break-before: always; }
        }
        .footer-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 40px;
            font-size: 12px;
            text-align: center;
        }

        .footer-table th,
        .footer-table td {
            border: 1px solid #333;
            padding: 6px;
            vertical-align: middle;
        }

        .footer-table th {
            background-color: #f5f5f5;
            font-weight: bold;
        }

        .footer-table td:first-child {
            font-weight: bold;
            text-align: left;
            width: 18%;
        }

        .signature-space td {
            height: 60px;
        }

    </style>
</head>
<body>
    <!-- Header Section -->
    <div class="header">
    @php
        $logoPath = public_path('img/logo_PINDAD_sedang10.jpg');
        $logoBase64 = base64_encode(file_get_contents($logoPath));
    @endphp

    <img src="data:image/jpeg;base64,{{ $logoBase64 }}" class="logo" alt="Logo Pindad"><h3 class="title">PT PINDAD (Persero)</h3>

    <div class="header-text">

        <p>
            PENGUKURAN KEY PERFORMANCE INDICATORS<br>
            TRIWULAN {{ $quarter }} TAHUN {{ $year }}<br>
            DIVISI TEKNOLOGI INFORMASI<br>
            {{ strtoupper($department) }}
        </p>
    </div>
</div>


    <!-- Report Metadata -->
    <table class="metadata-table">
        <tr>
            <td>Indikator</td>
            <td>: {{ $indikator }}</td>
        </tr>
        <tr>
            <td>Nama Indikator</td>
            <td>: {{ $nama_indikator }}</td>
        </tr>
        <tr>
            <td>Formula</td>
            <td>: {{ $formula }}</td>
        </tr>
        <tr>
            <td>Target</td>
            <td>: {{ $target }}</td>
        </tr>
        <tr>
            <td>Realisasi</td>
            <td>: {{ $realisasi }}</td>
        </tr>
        <tr>
            <td>Periode Monitoring</td>
            <td>: {{ $start_date }} s/d {{ $end_date }} ({{ $period_days }} hari)</td>
        </tr>
        <tr>
            <td>Tanggal Generate</td>
            <td>: {{ $generated_date }}</td>
        </tr>
    </table>

    <!-- Summary Section -->
    <div class="section-title">Ringkasan Status Telepon</div>
    <div class="summary-grid">
        <div>
            <div class="summary-item">
                <span class="summary-label">Total Telepon Terdaftar</span>
                <span class="summary-value">: {{ $total_phones }}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Telepon Online</span>
                <span class="summary-value">: {{ $online_phones }} ({{ $online_percentage }})</span>
            </div>
        </div>
        <div>
            <div class="summary-item">
                <span class="summary-label">Telepon Offline</span>
                <span class="summary-value">: {{ $offline_phones }} ({{ $offline_percentage }})</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Telepon Yang Sering Offline</span>
                <span class="summary-value">
                    :
                    @if(!empty($frequently_offline))
                        {{ implode(', ', array_map(fn($item) => $item['endpoint'] ?? $item, $frequently_offline)) }}
                    @else
                        Tidak ada
                    @endif
                </span>
            </div>
            </div>
        </div>
    </div>

    <!-- Data Table Section -->
    <div class="section-title">Data Status Semua Endpoint</div>
    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 8%;">No</th>
                <th style="width: 12%;">Endpoint</th>
                <th style="width: 20%;">Gedung</th>
                <th style="width: 15%;">Alamat IP</th>
                <th style="width: 8%;">Uptime<br>(Periode)</th>
                <th style="width: 8%;">Total<br>Events</th>
                <th style="width: 7%;">Offline<br>Events</th>
                <th style="width: 7%;">Online<br>Events</th>
            </tr>
        </thead>
        <tbody>
            @if(is_array($endpoints_data) && count($endpoints_data) > 0)
                @foreach($endpoints_data as $index => $endpoint)
                <tr>
                    <td class="text-center">{{ $index + 1 }}</td>
                    <td class="text-center font-bold">{{ $endpoint['endpoint'] ?? 'N/A' }}</td>
                    <td>{{ $endpoint['building'] ?? 'N/A' }}</td>
                    <td class="text-center">{{ $endpoint['ip_address'] ?? 'N/A' }}</td>
                    <td class="text-center
                        @php
                            $uptime = (int)str_replace('%', '', $endpoint['uptime_period'] ?? '0%');
                        @endphp
                        @if($uptime >= 95) uptime-good
                        @elseif($uptime >= 80) uptime-warning
                        @else uptime-critical
                        @endif">
                        {{ $endpoint['uptime_period'] ?? '0%' }}
                    </td>
                    <td class="text-center">{{ $endpoint['total_events'] ?? 0 }}</td>
                    <td class="text-center">{{ $endpoint['offline_events'] ?? 0 }}</td>
                    <td class="text-center">{{ $endpoint['online_events'] ?? 0 }}</td>
                </tr>
                @endforeach
            @else
                <tr>
                    <td colspan="8" class="text-center">Tidak ada data endpoint tersedia</td>
                </tr>
            @endif
        </tbody>
    </table>

    @if(is_array($ranking_data) && count($ranking_data) > 0)
    <!-- Page Break -->
    <div class="page-break"></div>

    <!-- Ranking Section -->
    <div class="section-title">Rank Endpoint Offline (Top 20)</div>
    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 6%;">Rank</th>
                <th style="width: 12%;">Endpoint</th>
                <th style="width: 22%;">Gedung</th>
                <th style="width: 10%;">Uptime<br>(Periode)</th>
                <th style="width: 12%;">Total Offline<br>Duration</th>
                <th style="width: 8%;">Total<br>Events</th>
                <th style="width: 8%;">Offline<br>Events</th>
                <th style="width: 8%;">Online<br>Events</th>
                <th style="width: 14%;">Last Activity</th>
            </tr>
        </thead>
        <tbody>
            @foreach($ranking_data as $data)
            <tr>
                <td class="text-center font-bold">{{ $data['rank'] ?? 'N/A' }}</td>
                <td class="text-center font-bold">{{ $data['endpoint'] ?? 'N/A' }}</td>
                <td>{{ $data['building'] ?? 'N/A' }}</td>
                <td class="text-center
                    @php
                        $uptime = (int)str_replace('%', '', $data['uptime_period'] ?? '0%');
                    @endphp
                    @if($uptime >= 95) uptime-good
                    @elseif($uptime >= 80) uptime-warning
                    @else uptime-critical
                    @endif">
                    {{ $data['uptime_period'] ?? '0%' }}
                </td>
                <td class="text-center">{{ $data['total_offline_duration'] ?? 'N/A' }}</td>
                <td class="text-center">{{ $data['total_events'] ?? 0 }}</td>
                <td class="text-center font-bold status-offline">{{ $data['offline_events'] ?? 0 }}</td>
                <td class="text-center">{{ $data['online_events'] ?? 0 }}</td>
                <td class="text-center">{{ $data['last_activity'] ?? 'N/A' }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @endif

    <!-- Signature Section -->
<table class="footer-table">
    <thead>
        <tr>
            <th></th>
            <th>DISIAPKAN OLEH</th>
            <th>DISETUJUI OLEH</th>
            <th>DISAHKAN OLEH</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><strong>JABATAN</strong></td>
            <td>{{ $prepared_jabatan }}</td>
            <td>{{ $approved_jabatan }}</td>
            <td>{{ $validated_jabatan }}</td>
        </tr>
        <tr>
            <td><strong>NAMA</strong></td>
            <td>{{ $prepared_nama }}</td>
            <td>{{ $approved_nama }}</td>
            <td>{{ $validated_nama }}</td>
        </tr>
        <tr>
            <td><strong>TANGGAL</strong></td>
            <td>{{ $prepared_tanggal }}</td>
            <td>{{ $approved_tanggal ?: '-' }}</td>
            <td>{{ $validated_tanggal }}</td>
        </tr>
        <tr class="signature-space">
            <td><strong>TANDA TANGAN</strong></td>
            <td></td>
            <td></td>
            <td></td>
        </tr>
    </tbody>
</table>

</body>
</html>
