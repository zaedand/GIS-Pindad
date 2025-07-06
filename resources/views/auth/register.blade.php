<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Daftar Akun -</title>

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />

    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        primary: '#2563eb',
                        secondary: '#1d4ed8',
                        corporate: '#0f3d75'
                    }
                }
            }
        }
    </script>
</head>

<body class="min-h-screen flex items-center justify-center p-4 font-instrument-sans bg-gradient-to-br from-white to-slate-50">
    <div class="flex flex-col md:flex-row w-full max-w-6xl">

        <!-- Left Branding -->
        <div class="bg-white text-black p-10 w-full lg:w-1/2 flex flex-col justify-between">
            <div>
                <div class="flex items-center mb-8">
                    <div class="w-16 h-16 bg-black/10 flex items-center justify-center mr-3 rounded">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h1 class="text-3xl font-semibold">GIS<span class="text-blue-500">Phone</span>Monitor</h1>
                </div>

                <div class="mb-6">
                    <a href="/">
                        <x-application-logo class="w-48 h-auto mx-auto" />
                    </a>
                </div>
            </div>
        </div>

        <!-- Right Form -->
        <div class="bg-white rounded-xl shadow-lg border border-slate-200 p-10 md:w-1/2">
            <div class="text-center mb-10">
                <h2 class="text-3xl font-bold text-gray-800 mb-2">Buat Akun Baru</h2>
                <p class="text-gray-600">Isi formulir di bawah ini untuk mendaftar</p>
            </div>

            <form method="POST" action="{{ route('register') }}">
                @csrf

                <!-- Name -->
                <div class="mb-6">
                    <label for="name" class="block text-sm font-medium text-gray-700 mb-2">Nama Lengkap</label>
                    <div class="relative">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <input id="name" type="text" name="name" value="{{ old('name') }}" required autofocus autocomplete="name" placeholder="Nama lengkap Anda"
                            class="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 focus:border-primary focus:ring focus:ring-primary/20 focus:outline-none transition-all">
                    </div>
                    @error('name')
                        <p class="mt-2 text-sm text-red-600">{{ $message }}</p>
                    @enderror
                </div>

                <!-- Email -->
                <div class="mb-6">
                    <label for="email" class="block text-sm font-medium text-gray-700 mb-2">Email Perusahaan</label>
                    <div class="relative">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <input id="email" type="email" name="email" value="{{ old('email') }}" required autocomplete="email" placeholder="nama@perusahaan.com"
                            class="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 focus:border-primary focus:ring focus:ring-primary/20 focus:outline-none transition-all">
                    </div>
                    @error('email')
                        <p class="mt-2 text-sm text-red-600">{{ $message }}</p>
                    @enderror
                </div>

                <!-- Password -->
                <div class="mb-6">
                    <label for="password" class="block text-sm font-medium text-gray-700 mb-2">Password</label>
                    <div class="relative">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <input id="password" type="password" name="password" required autocomplete="new-password" placeholder="••••••••"
                            class="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 focus:border-primary focus:ring focus:ring-primary/20 focus:outline-none transition-all">
                    </div>
                    @error('password')
                        <p class="mt-2 text-sm text-red-600">{{ $message }}</p>
                    @enderror
                </div>

                <!-- Confirm Password -->
                <div class="mb-8">
                    <label for="password_confirmation" class="block text-sm font-medium text-gray-700 mb-2">Konfirmasi Password</label>
                    <div class="relative">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <input id="password_confirmation" type="password" name="password_confirmation" required autocomplete="new-password" placeholder="••••••••"
                            class="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 focus:border-primary focus:ring focus:ring-primary/20 focus:outline-none transition-all">
                    </div>
                </div>

                <!-- Register Button -->
                <button type="submit" class="w-full bg-primary hover:bg-secondary text-white font-medium py-3 px-4 rounded-lg transition duration-300 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
                    </svg>
                    Daftar Akun
                </button>
            </form>

            <div class="mt-8 text-center">
                <p class="text-sm text-gray-600">
                    Sudah memiliki akun?
                    <a href="{{ route('login') }}" class="text-primary font-medium hover:text-secondary">
                        Masuk di sini
                    </a>
                </p>
            </div>

            <div class="mt-8 pt-6 border-t border-gray-100">
                <p class="text-center text-sm text-gray-500">
                    Sistem ini hanya untuk penggunaan internal perusahaan.<br>Pastikan Anda memiliki izin untuk mendaftar.
                </p>
            </div>
        </div>
    </div>
</body>

</html>
