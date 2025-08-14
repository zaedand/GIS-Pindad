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
            text-align: center; 
            margin-bottom: 30px;
            position: relative;
        }
        
        .logo { 
            width: 120px; 
            position: absolute; 
            left: 0; 
            top: 0; 
        }
        
        .header h3 {
            margin: 0 0 10px 0;
            font-size: 18px;
            font-weight: bold;
        }
        
        .header p {
            margin: 0;
            font-size: 18px;
            line-height: 1.5;
            font-weight: bold;
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
    </style>
</head>
<body>
    <!-- Header Section -->
    <div class="header">
        @php
            $logoPath = public_path('img/logo_PINDAD_sedang10.jpg');
            $logoBase64 = base64_encode(file_get_contents($logoPath));
        @endphp

        <img src="data:image/jpeg;base64,{{ $logoBase64 }}" class="logo" alt="Logo Pindad">
        <h3>PT PINDAD (Persero)</h3>
        <p>
            PENGUKURAN KEY PERFORMANCE INDICATORS<br>
            TRIWULAN {{ $quarter }} TAHUN {{ $year }}<br>
            DIVISI TEKNOLOGI INFORMASI<br>
            {{ strtoupper($department) }}
        </p>
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
                <span class="summary-value">: {{ $online_phones }} ({{ $online_percentage }}%)</span>
            </div>
        </div>
        <div>
            <div class="summary-item">
                <span class="summary-label">Telepon Offline</span>
                <span class="summary-value">: {{ $offline_phones }} ({{ $offline_percentage }}%)</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Telepon Yang Sering Offline</span>
                <span class="summary-value">: {{ $frequently_offline }}</span>
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
            @foreach($endpoints_data as $index => $endpoint)
            <tr>
                <td class="text-center">{{ $index + 1 }}</td>
                <td class="text-center font-bold">{{ $endpoint['endpoint'] }}</td>
                <td>{{ $endpoint['building'] }}</td>
                <td class="text-center">{{ $endpoint['ip_address'] }}</td>
                <td class="text-center
                    @php
                        $uptime = (int)str_replace('%', '', $endpoint['uptime_period']);
                    @endphp
                    @if($uptime >= 95) uptime-good
                    @elseif($uptime >= 80) uptime-warning
                    @else uptime-critical
                    @endif">
                    {{ $endpoint['uptime_period'] }}
                </td>
                <td class="text-center">{{ $endpoint['total_events'] }}</td>
                <td class="text-center">{{ $endpoint['offline_events'] }}</td>
                <td class="text-center">{{ $endpoint['online_events'] }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    @if(count($ranking_data) > 0)
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
                <td class="text-center font-bold">{{ $data['rank'] }}</td>
                <td class="text-center font-bold">{{ $data['endpoint'] }}</td>
                <td>{{ $data['building'] }}</td>
                <td class="text-center
                    @php
                        $uptime = (int)str_replace('%', '', $data['uptime_period']);
                    @endphp
                    @if($uptime >= 95) uptime-good
                    @elseif($uptime >= 80) uptime-warning
                    @else uptime-critical
                    @endif">
                    {{ $data['uptime_period'] }}
                </td>
                <td class="text-center">{{ $data['total_offline_duration'] }}</td>
                <td class="text-center">{{ $data['total_events'] }}</td>
                <td class="text-center font-bold status-offline">{{ $data['offline_events'] }}</td>
                <td class="text-center">{{ $data['online_events'] }}</td>
                <td class="text-center">{{ $data['last_activity'] }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @endif

    <!-- Signature Section -->
    <table style="width: 100%; margin-top: 40px;">
    <tr>
        <!-- Kiri -->
        <td style="width: 50%; text-align: left; vertical-align: top;">
            Mengetahui,<br>
            Manager Departemen Teknologi Informasi
            <br><br><br><br>
            ____________________________<br>
            Wilanto Sumargo, S.H<br>
            NIP: ________________
        </td>

        <!-- Kanan -->
        <td style="width: 50%; text-align: left; vertical-align: top; padding-left: 400px;">
            Malang, {{ \Carbon\Carbon::createFromFormat('d/m/Y H:i:s', $generated_date, 'Asia/Jakarta')
            ->locale('id')
            ->translatedFormat('d F Y') }}
            <br>Disiapkan oleh,<br>
            Officer Infrastruktur jaringan
            <br><br><br><br>
            ____________________________<br>
            -nama-<br>
            NIP: ________________
        </td>
    </tr>
</table>



    <!-- Footer -->
    <div style="margin-top: 30px; font-size: 9px; color: #666; text-align: center;">
        <p>Laporan ini dibuat secara otomatis oleh sistem monitoring telepon internal PT Pindad (Persero)</p>
        <p>Generated on {{ $generated_date }}</p>
    </div>
</body>
</html>