<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <link rel="shortcut icon" href="https://pindad.com/assets/img/favicon.png" type="image/png">
    <title>{{ config('app.name', 'Laravel') }}</title>

    <!-- Fonts & Tailwind -->
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet">
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

                <div class="mb-6 p-10">
                    <a href="/">
                        <x-application-logo class="w-48 h-auto mx-auto" />
                    </a>
                </div>
            </div>
        </div>


        <!-- Right Form -->
        <div class="bg-white rounded-xl shadow-lg border border-slate-200 p-10 md:w-1/2">

            <div class="mb-8 text-center">
                <h2 class="text-3xl font-bold text-gray-800 mb-2">LOGIN</h2>
                <p class="text-gray-600">
                    @if (Route::has('login'))
                        @auth
                            Selamat datang, <span class="font-semibold text-corporate">{{ Auth::user()->name }}</span>
                            <br>
                            <a href="{{ url('/dashboard') }}" class="text-primary hover:underline">Ke Dashboard</a>
                        @else
                            Gunakan akun internal perusahaan Anda
                        @endauth
                    @endif
                </p>
            </div>

            @if (session('status'))
                <div class="bg-green-100 text-green-700 p-4 rounded mb-6 text-sm">
                    {{ session('status') }}
                </div>
            @endif

            <form method="POST" action="{{ route('login') }}" class="space-y-6">
                @csrf

                <!-- Email -->
                <div>
                    <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email Perusahaan</label>
                    <div class="relative">
                        <input id="email" name="email" type="email" required autofocus autocomplete="email"
                            value="{{ old('email') }}"
                            placeholder="nama@perusahaan.com"
                            class="w-full border border-gray-300 rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary">
                        <div class="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none"
                                viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                    </div>
                    @error('email')
                        <p class="text-red-600 text-sm mt-1">{{ $message }}</p>
                    @enderror
                </div>

                <!-- Password -->
                <div>
                    <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <div class="relative">
                        <input id="password" name="password" type="password" required autocomplete="current-password"
                            placeholder="••••••••"
                            class="w-full border border-gray-300 rounded-lg py-3 pl-10 pr-12 focus:outline-none focus:ring-2 focus:ring-primary">
                        <div class="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none"
                                viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <button type="button" id="togglePassword"
                            class="absolute right-3 inset-y-0 flex items-center text-gray-400 hover:text-gray-600">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none"
                                viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        </button>
                    </div>
                    @error('password')
                        <p class="text-red-600 text-sm mt-1">{{ $message }}</p>
                    @enderror
                </div>

                <!-- Remember Me + Forgot -->
                <div class="flex items-center justify-between">
                    <label class="flex items-center text-sm text-gray-700">
                        <input id="remember_me" name="remember" type="checkbox"
                            class="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary">
                        <span class="ml-2">Ingat saya</span>
                    </label>

                    @if (Route::has('password.request'))
                        <a href="{{ route('password.request') }}" class="text-primary text-sm hover:underline">
                            Lupa password?
                        </a>
                    @endif
                </div>

                <!-- Login Button -->
                <button type="submit"
                    class="w-full bg-primary hover:bg-secondary text-white font-medium py-3 rounded-lg flex justify-center items-center gap-2 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="currentColor"
                        viewBox="0 0 20 20">
                        <path fill-rule="evenodd"
                            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                            clip-rule="evenodd" />
                    </svg>
                    Masuk ke Sistem
                </button>
            </form>

            <p class="text-center text-sm text-gray-500 mt-8 border-t pt-4">
                Sistem ini hanya digunakan untuk Internal PT.Pindad(Persero). Hubungi IT Support jika ada kendala.
            </p>

            <div class="flex justify-center mt-4 text-gray-500 text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21L8.89 10.5a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                IT Support: 1234
            </div>
        </div>
    </div>

    <script>
        document.getElementById('togglePassword').addEventListener('click', function () {
            const password = document.getElementById('password');
            const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
            password.setAttribute('type', type);
        });
    </script>
</body>
</html>
