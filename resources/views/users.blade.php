
<x-app-layout>

    <x-slot name="header">
        <h2 class="font-bold text-xl text-gray-800 leading-tight">
            Phone Monitoring System - Selamat datang {{ Auth::user()->name }}
        </h2>
    </x-slot>

        <!-- Main Content -->
        <main class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <!-- Grid Layout -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

            <!-- Users Management Table -->
            <div class="bg-white rounded-xl shadow-sm p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <i class="fas fa-table text-blue-600 mr-2"></i>
                    Manajemen User
                </h3>
                <div class="mt-4">

                <div class="mb-4 flex items-center gap-2">
                    <input type="text" id="deviceSearch" placeholder="Cari pengguna..."
                        class="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                    <button onclick="filterDevices()"
                            class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
                        Search
                    </button>
                </div>

                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waktu Dibuat</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
    @forelse ($users as $index => $user)
        <tr>
            <td class="px-6 py-4 whitespace-nowrap">{{ $index + 1 }}</td>
            <td class="px-6 py-4 whitespace-nowrap">{{ $user->name }}</td>
            <td class="px-6 py-4 whitespace-nowrap">{{ $user->email }}</td>
            <td class="px-6 py-4 whitespace-nowrap">{{ $user->created_at->format('d-m-Y H:i') }}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <a href="#" class="text-indigo-600 hover:text-indigo-900">Edit</a>
                |
                <form method="POST" action="{{ route('users.destroy', $user->id) }}" class="inline-block"
                      onsubmit="return confirm('Yakin ingin hapus?')">
                    @csrf
                    @method('DELETE')
                    <button type="submit" class="text-red-600 hover:text-red-900">Hapus</button>
                </form>
            </td>
        </tr>
    @empty
        <tr>
            <td colspan="5" class="text-center py-4 text-gray-500">Tidak ada pengguna ditemukan.</td>
        </tr>
    @endforelse
</tbody>

                    </table>
                </div>
            </div>
        </main>
    </div>

    <!-- Modal -->
    <div id="nodeModal" class="fixed inset-0 bg-black bg-opacity-50 z-50 hidden">
    <div class="flex items-center justify-center min-h-screen p-4">
        <div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div class="flex items-center justify-between mb-6">
                <h3 id="modal-title" class="text-lg font-semibold text-gray-900">Tambah Device Baru</h3>
                <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <form id="nodeForm">
                <div class="space-y-4">

                    <div>
                        <label for="nodeName" class="block text-sm font-medium text-gray-700 mb-1">Nama Gedung</label>
                        <input type="text" id="nodeName" name="name" required
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    </div>

                    <div>
                        <label for="nodeIP" class="block text-sm font-medium text-gray-700 mb-1">IP Address</label>
                        <input type="text" id="nodeIP" name="ip" required pattern="^(\d{1,3}\.){3}\d{1,3}$"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    </div>

                    <div>
                        <label for="nodeEndpoint" class="block text-sm font-medium text-gray-700 mb-1">Endpoint</label>
                        <input type="text" id="nodeEndpoint" name="endpoint" required
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    </div>

                    <div>
                    <div>
                        <label for="nodeStatus" class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select id="nodeStatus" name="status_display" disabled
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600">
                            <option value="offline" selected>Offline</option>
                        </select>
                        <input type="hidden" name="status" value="offline">
                    </div>


                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label for="nodeLatitude" class="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                            <input type="number" id="nodeLatitude" name="latitude" step="any" required
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        </div>
                        <div>
                            <label for="nodeLongitude" class="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                            <input type="number" id="nodeLongitude" name="longitude" step="any" required
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        </div>
                    </div>

                    <div>
                        <label for="nodeDescription" class="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
                        <textarea id="nodeDescription" name="description" rows="3"
                                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"></textarea>
                    </div>

                </div>

                <div class="flex justify-end space-x-3 mt-6">
                    <button type="button" onclick="closeModal()"
                            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                        Batal
                    </button>
                    <button type="submit"
                            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700">
                        Simpan
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

@push('scripts')
    @vite('resources/js/users.js')
@endpush

</x-app-layout>
