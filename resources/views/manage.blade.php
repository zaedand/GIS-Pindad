<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GIS Monitoring Telepon - Internal</title>
    <link rel="icon" href="https://pindad.com/assets/img/favicon.png" type="image/png">

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
                    }
                }
            }
        }
    </script>
</head>
<body class="bg-white text-gray-800 font-sans">

<!-- Header -->
<header class="py-4 px-4 lg:px-8 border-b border-gray-200 shadow-lg  relative">
    <div class="max-w-7xl mx-auto flex justify-between items-center">
        <div class="flex items-center">
            <img src="https://pindad.com/assets/img/theme-1/logo.png" alt="Logo" class="h-10 w-10 object-contain mr-3">
            <h1 class="text-xl md:text-2xl font-bold text-corporate"><span class="text-primary">Phone</span>MonitoringSystem</h1>
        </div>
        <div class="flex items-center space-x-3">
            <span class="hidden md:inline bg-accent text-white px-3 py-1 text-xs rounded-full">Akses Internal</span>
                                                <a href="http://localhost:8000/login" class="px-4 py-2 text-gray-700 hover:text-primary text-sm">Log In</a>
                                    </div>
    </div>
</header>

<!-- Hero Section -->
<section class="py-12 px-4 lg:px-8">
    <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div>
            <h2 class="text-3xl md:text-4xl font-bold mb-4 text-corporate">Sistem Monitoring Telepon Internal <span class="text-primary">Perusahaan</span></h2>

            <div class="bg-white border border-gray-200 rounded-xl shadow p-6 w-full max-w-md">
                <h3 class="text-lg font-semibold mb-4 text-corporate">Akses Sistem</h3>
                <div class="text-sm text-gray-600 mb-4">Masuk menggunakan akun internal Anda:</div>
                                                            <a href="http://localhost:8000/login" class="block w-full text-center py-2 bg-primary text-white rounded hover:bg-secondary mb-2">Login</a>
                        <p class="text-xs text-center text-blue-500">
                            <a href="http://localhost:8000/register" class="">Belum memiliki akun?</a></p>
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

<!-- Footer -->
<footer class="py-8 px-4 lg:px-8 bg-gray-900 text-gray-300">
    <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
        <div class="flex items-center">
            <img src="https://pindad.com/assets/img/theme-1/logo.png" class="h-8 w-8 object-contain mr-3">
            <h1 class="text-xl font-semibold text-white"><span class="text-primary">Phone</span>MonitoringSystem</h1>
        </div>
        <p class="text-sm text-center md:text-right">© 2025 Sistem Monitoring Telepon Pindad. Hak Cipta Dilindungi.</p>
    </div>
</footer>

</body>
</html>
