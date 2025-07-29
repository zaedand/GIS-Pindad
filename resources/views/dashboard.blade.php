
<x-app-layout>
    <x-slot name="header">
            <h2 class="font-semibold text-xl text-gray-800 leading-tight">
            Phone Monitoring System - Selamat datang {{ Auth::user()->name }}
        </h2>
    </x-slot>

    <div class="py-8">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            <!-- Stats Overview -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div class="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Total Telepon</p>
                            <p class="text-3xl font-bold text-gray-900" id="total-phones">0</p>
                        </div>
                        <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                            <i class="fas fa-phone text-white"></i>
                        </div>
                    </div>
                </div>

                <div class="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Online</p>
                            <p class="text-3xl font-bold text-green-600" id="online-phones">0</p>
                        </div>
                        <div class="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                            <i class="fas fa-check-circle text-white"></i>
                        </div>
                    </div>
                </div>

                <div class="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Offline</p>
                            <p class="text-3xl font-bold text-red-600 animate-blink" id="offline-phones">0</p>
                        </div>
                        <div class="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center">
                            <i class="fas fa-exclamation-triangle text-white"></i>
                        </div>
                    </div>
                </div>

                <div class="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">In Use</p>
                            <p class="text-3xl font-bold text-yellow-600" id="in-use-phones">0</p>
                        </div>
                        <div class="w-12 h-12 bg-gradient-to-br from-yellow-500 to-pink-500 rounded-xl flex items-center justify-center">
                            <i class="fas fa-clock text-white"></i>
                        </div>
                    </div>
                </div>
            </div>
            <!-- Main Content -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                <!-- Map Section -->
                <div class="lg:col-span-3 bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-lg">
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="text-xl font-semibold text-gray-800 flex items-center gap-2">
                            <i class="fas fa-map-marker-alt text-indigo-500"></i>
                            Peta Gedung & Status Telepon
                        </h2>
                        <button onclick="refreshMap()" class="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-300 hover:-translate-y-1 text-sm">
                            <i class="fas fa-sync-alt mr-2"></i>
                            Refresh
                        </button>
                    </div>

                    <div id="map" class="h-[60dvh] rounded-xl overflow-hidden shadow-inner"></div>

                    <div id= "device-status" class="flex flex-wrap gap-4 mt-4 text-sm">
                        <div class="flex items-center gap-2">
                            <div class="w-3 h-3 bg-green-500 rounded-full shadow-lg"></div>
                            <span class="text-gray-700 font-medium">Online</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <div class="w-3 h-3 bg-red-500 rounded-full shadow-lg"></div>
                            <span class="text-gray-700 font-medium">Offline</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <div class="w-3 h-3 bg-yellow-500 rounded-full shadow-lg"></div>
                            <span class="text-gray-700 font-medium">In Use</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Activity Log -->
            
        </div>
    </div>

@push('scripts')
    @vite('resources/js/dashMap.js')
@endpush

</x-app-layout>
