<!DOCTYPE html>
<html lang="id" class="h-full">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SIMIRA - GIS Monitoring Telepon PT Pindad</title>
    <link rel="icon" href="https://pindad.com/assets/img/favicon.png" type="image/png">
    <meta name="description" content="Sistem Informasi Monitoring Telepon IP PBX PT Pindad dengan teknologi GIS real-time">

    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        primary: '#2563eb',
                        secondary: '#1d4ed8',
                        accent: '#10b981',
                        dark: '#1e293b',
                        corporate: '#0f3d75'
                    },
                    animation: {
                        'fade-in': 'fadeIn 0.6s ease-out',
                        'slide-up': 'slideUp 0.6s ease-out',
                        'pulse-slow': 'pulse 3s infinite'
                    },
                    keyframes: {
                        fadeIn: {
                            '0%': { opacity: '0' },
                            '100%': { opacity: '1' }
                        },
                        slideUp: {
                            '0%': { opacity: '0', transform: 'translateY(20px)' },
                            '100%': { opacity: '1', transform: 'translateY(0)' }
                        }
                    }
                }
            }
        }
    </script>
    <style>
        html { scroll-behavior: smooth; }
        .gradient-bg { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .glass-effect { backdrop-filter: blur(10px); background: rgba(255, 255, 255, 0.9); }
        .hover-lift { transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .hover-lift:hover { transform: translateY(-5px); box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); }
    </style>
</head>

<body class="bg-white text-gray-800 font-sans flex flex-col min-h-screen smooth-scroll">

<!-- Header -->
<header class="py-4 px-4 lg:px-8 border-b border-gray-200 shadow-lg relative">
    <div class="max-w-7xl mx-auto flex justify-between items-center">
        <div class="flex items-center">
            <img src="https://pindad.com/assets/img/theme-1/logo.png" alt="Logo" class="h-10 w-10 object-contain mr-3">
            <h1 class="text-xl md:text-2xl font-bold text-corporate"><span class="text-primary">SI</span>MIRA</h1>
        </div>
        <div class="flex items-center space-x-3">
            <a href="#dokumentasi" class="hidden md:inline text-gray-700 hover:text-primary text-sm px-3 py-2 rounded hover:bg-gray-100">Dokumentasi</a>
            <span class="hidden md:inline bg-accent text-white px-3 py-1 text-xs rounded-full">Akses Internal</span>
            @if (Route::has('login'))
                @auth
                    <a href="{{ url('/dashboard') }}" class="px-4 py-2 bg-primary text-white rounded hover:bg-secondary text-sm">Dashboard</a>
                @else
                    <a href="{{ route('login') }}" class="px-4 py-2 text-gray-700 hover:text-primary text-sm">Log In</a>
                @endauth
            @endif
        </div>
    </div>
</header>

<!-- Hero Section -->
<main class="flex-grow">
    <section class="py-12 px-4 lg:px-8">
        <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
                <h2 class="text-3xl md:text-4xl font-bold mb-4 text-corporate">Sistem Monitoring Telepon Internal <span class="text-primary">PT.Pindad</span></h2>

                <div class="bg-white border border-gray-200 rounded-xl shadow p-6 w-full max-w-md">
                    <h3 class="text-lg font-semibold mb-4 text-corporate">Akses Sistem</h3>
                    <div class="text-sm text-gray-600 mb-4">Masuk menggunakan akun internal Anda:</div>
                    @if (Route::has('login'))
                        @auth
                            <div class="text-sm text-gray-600 mb-4">{{ Auth::user()->name }}</div>
                            <a href="{{ url('/dashboard') }}" class="block w-full text-center py-2 bg-primary text-white rounded hover:bg-secondary">Buka Dashboard</a>
                        @else
                            <a href="{{ route('login') }}" class="block w-full text-center py-2 bg-primary text-white rounded hover:bg-secondary mb-2">Login</a>
                            <p class="text-xs text-center text-blue-500">
                                <a href="{{ route('register') }}" class="">Belum memiliki akun?</a></p>
                        @endauth
                    @endif
                </div>

                <div class="mt-8 flex items-center space-x-6 text-sm text-gray-600">
                        <a href="#dokumentasi"
                           class="flex items-center text-primary hover:text-secondary transition-colors group">
                            <svg class="w-4 h-4 mr-1 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            Panduan Penggunaan
                        </a>
                    </div>
            </div>

            <div class="relative">
                <div class="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl shadow-lg h-96 w-full flex items-center justify-center relative">
                    <!-- Kantor Pusat -->
                    <div class="absolute top-1/4 left-1/4 flex flex-col items-center">
                        <div class="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow">
                            <div class="w-4 h-4 bg-green-500 rounded-full"></div>
                        </div>
                        <span class="mt-2 bg-white px-2 py-1 text-sm rounded shadow">Kantor Pusat</span>
                    </div>

                    <!-- Cabang A -->
                    <div class="absolute top-1/3 right-1/4 flex flex-col items-center">
                        <div class="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow">
                            <div class="w-4 h-4 bg-green-500 rounded-full"></div>
                        </div>
                        <span class="mt-2 bg-white px-2 py-1 text-sm rounded shadow">Cabang A</span>
                    </div>

                    <!-- Cabang B -->
                    <div class="absolute bottom-1/4 left-1/3 flex flex-col items-center">
                        <div class="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow">
                            <div class="w-4 h-4 bg-red-500 rounded-full"></div>
                        </div>
                        <span class="mt-2 bg-white px-2 py-1 text-sm rounded shadow">Cabang B</span>
                    </div>

                    <!-- Gudang -->
                    <div class="absolute bottom-1/3 right-1/3 flex flex-col items-center">
                        <div class="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow">
                            <div class="w-4 h-4 bg-green-500 rounded-full"></div>
                        </div>
                        <span class="mt-2 bg-white px-2 py-1 text-sm rounded shadow">Gudang</span>
                    </div>

                    <!-- Legend -->
                    <div class="absolute bottom-5 left-5 bg-white p-3 rounded-lg shadow text-sm space-y-1">
                        <div class="flex items-center"><div class="w-3 h-3 bg-green-500 rounded-full mr-2"></div>Telepon Menyala</div>
                        <div class="flex items-center"><div class="w-3 h-3 bg-red-500 rounded-full mr-2"></div>Telepon Mati</div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Documentation Section -->
    <section id="dokumentasi" class="py-16 lg:py-24 px-4 lg:px-8 bg-white">
        <div class="max-w-7xl mx-auto">
            <!-- Section Header -->
            <div class="text-center mb-16">
                <h2 class="text-3xl lg:text-4xl font-bold text-corporate mb-4">Informasi SIMIRA</h2>
                <p class="text-lg text-gray-600 max-w-3xl mx-auto">
                    Berikut Informasi tentang mengoperasikan sistem monitoring telepon SIMIRA
            </div>

            <!-- Main Documentation Content -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-16">

                <!-- System Description -->
                <div class="bg-white-50 rounded-2xl shadow-lg p-8 hover-lift">
                    <div class="flex items-start mb-6">
                        <div class="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                        </div>
                        <div>
                            <h3 class="text-xl lg:text-2xl font-bold text-corporate mb-2">Deskripsi Sistem</h3>
                            <p class="text-primary font-medium">Geographic Information System (GIS) Phone Monitoring</p>
                        </div>
                    </div>

                    <div class="space-y-4 text-gray-700 leading-relaxed">
                        <p>
                            <strong class="text-corporate">SIMIRA (Sistem Informasi Monitoring Telepon)</strong> adalah platform monitoring berbasis web untuk
                            <strong class="text-accent">telepon IP PBX PT Pindad</strong>. Sistem ini mengintegrasikan teknologi
                            <strong>Geographic Information System (GIS)</strong> dengan <strong>Leaflet.js</strong> untuk visualisasi real-time.
                        </p>

                        <div class="bg-white/80 p-4 rounded-lg border-l-4 border-primary">
                            <h4 class="font-semibold text-corporate mb-2">Fitur Utama:</h4>
                            <ul class="text-sm space-y-1">
                                <li>• <strong>Real-time monitoring</strong> status telepon (available, unavailable, in use)</li>
                                <li>• <strong>Auto-logging</strong> perubahan status perangkat</li>
                                <li>• <strong>PDF reports</strong> uptime/downtime analysis</li>
                                <li>• <strong>Interactive maps</strong> dengan visualisasi geografis</li>
                            </ul>
                        </div>

                        <div class="bg-gradient-to-r from-accent/10 to-primary/10 p-4 rounded-lg">
                            <p class="text-sm">
                                <strong class="text-accent">💡 Tujuan:</strong> Meningkatkan efisiensi Infrastruktur Jaringan dalam
                                mendeteksi, menganalisis, dan menangani gangguan komunikasi internal secara proaktif.
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Usage Guide -->
                <div class="bg-white-50 rounded-2xl shadow-lg p-8 hover-lift">
                    <div class="flex items-start mb-6">
                        <div class="w-12 h-12 bg-accent rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                            </svg>
                        </div>
                        <div>
                            <h3 class="text-xl lg:text-2xl font-bold text-corporate mb-2">Panduan Penggunaan</h3>
                        </div>
                    </div>

                    <div class="space-y-5">
                        <!-- Step 1 -->
                        <div class="border-l-3 border-primary pl-4">
                            <h4 class="font-semibold text-corporate mb-2">1. Login ke Sistem</h4>
                            <ul class="text-gray-700 text-sm space-y-1">
                                <li>• Buka halaman utama GIS Phone Monitoring</li>
                                <li>• Masukkan username dan password sesuai hak akses Anda (Admin/User)</li>
                            </ul>
                        </div>

                        <!-- Step 2 -->
                        <div class="border-l-3 border-primary pl-4">
                            <h4 class="font-semibold text-corporate mb-2">2. Dashboard</h4>
                            <ul class="text-gray-700 text-sm space-y-1">
                                <li>• Setelah login, Anda akan diarahkan ke halaman <strong>Dashboard</strong></li>
                                <li>• Menampilkan statistik telepon dan peta monitoring status perangkat</li>
                            </ul>
                        </div>

                        <!-- Step 3 -->
                        <div class="border-l-3 border-primary pl-4">
                            <h4 class="font-semibold text-corporate mb-2">3. Monitoring Telepon</h4>
                            <div class="text-gray-700 text-sm space-y-2">
                                <p>Peta menampilkan indikator warna:</p>
                                <div class="flex flex-wrap gap-3">
                                    <span class="flex items-center"><div class="w-3 h-3 bg-green-500 rounded-full mr-1"></div>Available</span>
                                    <span class="flex items-center"><div class="w-3 h-3 bg-red-500 rounded-full mr-1"></div>Unavailable</span>
                                    <span class="flex items-center"><div class="w-3 h-3 bg-yellow-500 rounded-full mr-1"></div>In Use</span>
                                </div>
                                <p class="mt-2">• Klik titik telepon untuk melihat detail informasi perangkat</p>
                            </div>
                        </div>

                        <!-- Step 4 -->
                        <div class="border-l-3 border-accent pl-4">
                            <h4 class="font-semibold text-corporate mb-2">4. Menu Manage (Khusus Admin)</h4>
                            <p class="text-gray-700 text-sm">• Menambah, mengedit, atau menghapus data perangkat telepon</p>
                        </div>

                        <!-- Step 5 -->
                        <div class="border-l-3 border-primary pl-4">
                            <h4 class="font-semibold text-corporate mb-2">5. Menu Logs & Laporan</h4>
                            <ul class="text-gray-700 text-sm space-y-1">
                                <li>• <strong>Logs:</strong> Riwayat perubahan status perangkat telepon</li>
                                <li>• <strong>Ekspor Laporan:</strong> Buat laporan performa dalam format PDF</li>
                                <li>• <strong>Manajemen User:</strong> Kelola data pengguna (Khusus Admin)</li>
                            </ul>
                        </div>
                    </div>

                </div>
            </div>

            <!-- Feature Highlights -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                <div class="text-center p-6 lg:p-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl hover-lift border border-blue-200">
                    <div class="w-16 h-16 bg-primary rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg">
                        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                        </svg>
                    </div>
                    <h3 class="text-xl font-bold text-corporate mb-3">Real-time Monitoring</h3>
                    <p class="text-gray-600 leading-relaxed">Pantau status semua perangkat telepon IP PBX secara langsung dengan visualisasi peta interaktif dan update otomatis.</p>
                    <div class="mt-4 inline-flex items-center text-primary text-sm font-medium">
                        <div class="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                        Live Status Updates
                    </div>
                </div>

                <div class="text-center p-6 lg:p-8 bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl hover-lift border border-green-200">
                    <div class="w-16 h-16 bg-accent rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg">
                        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                    </div>
                    <h3 class="text-xl font-bold text-corporate mb-3">Buat Laporan</h3>
                    <p class="text-gray-600 leading-relaxed">Generate laporan performa uptime/downtime otomatis dalam format PDF dengan analisis mendalam dan statistik lengkap.</p>
                    <div class="mt-4 inline-flex items-center text-accent text-sm font-medium">
                        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3"/>
                        </svg>
                        Export PDF Reports
                    </div>
                </div>

                <div class="text-center p-6 lg:p-8 bg-gradient-to-br from-purple-50 to-indigo-100 rounded-2xl hover-lift border border-purple-200">
                    <div class="w-16 h-16 bg-secondary rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg">
                        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
                        </svg>
                    </div>
                    <h3 class="text-xl font-bold text-corporate mb-3">Multi-User Access</h3>
                    <p class="text-gray-600 leading-relaxed">Sistem dengan role-based access control. Admin mendapat akses penuh, User akses monitoring dengan keamanan terjamin.</p>
                    <div class="mt-4 flex justify-center space-x-4 text-sm">
                        <span class="px-3 py-1 bg-secondary/10 text-secondary rounded-full font-medium">Admin</span>
                        <span class="px-3 py-1 bg-gray-100 text-gray-700 rounded-full font-medium">User</span>
                    </div>
                </div>
            </div>
        </div>
    </section>
</main>

<!-- Footer -->
<footer class="py-8 px-4 lg:px-8 bg-gray-900 text-gray-300">
    <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
        <div class="flex items-center">
            <img src="https://pindad.com/assets/img/theme-1/logo.png" class="h-8 w-8 object-contain mr-3">
            <h1 class="text-xl font-semibold text-white"><span class="text-primary">SI</span>MIRA</h1>
        </div>
        <p class="text-sm text-center md:text-right">© 2025 SIMIRA Pindad. Hak Cipta Dilindungi.</p>
    </div>
</footer>

<button id="backToTop"
        class="fixed bottom-8 right-8 w-12 h-12 bg-primary text-white rounded-full shadow-lg hover:bg-secondary transition-all duration-300 opacity-0 translate-y-4 pointer-events-none focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        aria-label="Back to top">
    <svg class="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"/>
    </svg>
</button>

<script>
    // Enhanced smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });

                // Update URL without triggering scroll
                if (history.pushState) {
                    history.pushState(null, null, this.getAttribute('href'));
                }
            }
        });
    });

    // Back to top functionality
    const backToTopBtn = document.getElementById('backToTop');

    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTopBtn.classList.remove('opacity-0', 'translate-y-4', 'pointer-events-none');
            backToTopBtn.classList.add('opacity-100', 'translate-y-0', 'pointer-events-auto');
        } else {
            backToTopBtn.classList.add('opacity-0', 'translate-y-4', 'pointer-events-none');
            backToTopBtn.classList.remove('opacity-100', 'translate-y-0', 'pointer-events-auto');
        }
    });

    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // Enhanced animations on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-slide-up');
            }
        });
    }, observerOptions);

    // Observe elements for animation
    document.querySelectorAll('.hover-lift').forEach(el => {
        observer.observe(el);
    });

    // Accessibility improvements
    document.addEventListener('keydown', (e) => {
        // Escape key to close any focused elements
        if (e.key === 'Escape') {
            document.activeElement.blur();
        }
    });

    // Focus management for better accessibility
    const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            const focusableContent = document.querySelectorAll(focusableElements);
            const firstFocusable = focusableContent[0];
            const lastFocusable = focusableContent[focusableContent.length - 1];

            if (e.shiftKey) {
                if (document.activeElement === firstFocusable) {
                    lastFocusable.focus();
                    e.preventDefault();
                }
            } else {
                if (document.activeElement === lastFocusable) {
                    firstFocusable.focus();
                    e.preventDefault();
                }
            }
        }
    });
</script>

</body>
</html>
