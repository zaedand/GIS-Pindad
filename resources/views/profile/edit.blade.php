<x-app-layout>
    <x-slot name="header">
        <div class="flex items-center justify-between">
            <h2 class="font-semibold text-xl text-gray-800 leading-tight">
                {{ __('Profile Settings') }}
            </h2>
        </div>
    </x-slot>

    <div class="py-8 bg-white min-h-screen">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <!-- Enhanced Profile Card -->
            <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden mb-8 hover:shadow-2xl transition-all duration-300">
                <div class="bg-blue-600 h-32 relative">
                    <div class="absolute inset-0 bg-black/20"></div>
                    <div class="absolute -bottom-12 left-8">
                        <div class="relative">
                            <div class="h-24 w-24 rounded-full bg-white shadow-lg flex items-center justify-center ring-4 ring-white">
                                <span class="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                    {{ substr(Auth::user()->name, 0, 1) }}
                                </span>
                            </div>
                            <button class="absolute -bottom-1 -right-1 bg-indigo-600 hover:bg-indigo-700 p-2 rounded-full shadow-lg text-white transition-all duration-200 hover:scale-110">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="pt-16 pb-8 px-8">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h3 class="text-2xl font-bold text-gray-900 mb-2">{{ Auth::user()->name }}</h3>
                            <p class="text-gray-600 mb-1 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                </svg>
                                {{ Auth::user()->email }}
                            </p>
                            <p class="text-gray-400 text-sm flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 8a2 2 0 01-2-2V9a2 2 0 012-2h8a2 2 0 012 2v6a2 2 0 01-2 2H8z" />
                                </svg>
                                Account created at {{ Auth::user()->created_at->format('F Y') }}
                            </p>
                        </div>
                        <div class="mt-4 sm:mt-0">
                            <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <span class="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                                Active
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Enhanced Tab Navigation -->
            <div class="mb-8">
                <div class="bg-white/60 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-2">
                    <nav class="flex space-x-2">
                        <button onclick="showTab('profile')" id="tab-profile" class="tab-button active flex-1 flex items-center justify-center bg-indigo-600 text-white rounded-lg py-3 px-4 font-medium text-sm transition-all duration-200 hover:bg-indigo-700">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Profile
                        </button>
                        <button onclick="showTab('password')" id="tab-password" class="tab-button flex-1 flex items-center justify-center text-gray-600 hover:text-indigo-600 hover:bg-white/50 rounded-lg py-3 px-4 font-medium text-sm transition-all duration-200">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Update Password
                        </button>
                        <button onclick="showTab('delete')" id="tab-delete" class="tab-button flex-1 flex items-center justify-center text-gray-600 hover:text-red-600 hover:bg-white/50 rounded-lg py-3 px-4 font-medium text-sm transition-all duration-200">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete Account
                        </button>
                    </nav>
                </div>
            </div>

            <!-- Tab Contents -->
            <div class="space-y-8">

                <!-- Profile Tab Content -->
                <div id="content-profile" class="tab-content">
                    <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden hover:shadow-2xl transition-all duration-300">
                        <div class="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100 p-6 sm:p-8">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center">
                                    <div class="flex-shrink-0">
                                        <div class="h-12 w-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div class="ml-4">
                                        <h3 class="text-xl font-bold text-gray-900">Profile Information</h3>
                                        <p class="mt-1 text-sm text-gray-600">View and manage your account information.</p>
                                    </div>
                                </div>
                                <button onclick="toggleEditProfile()" id="edit-profile-btn" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 hover:scale-105 shadow-lg">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Ubah Profil
                                </button>
                            </div>
                        </div>
                        <div class="p-6 sm:p-8">
                            <!-- Profile Display Mode -->
                            <div id="profile-display" class="space-y-6">
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div class="bg-gray-50 rounded-lg p-4">
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                                        <p class="text-lg font-semibold text-gray-900">{{ Auth::user()->name }}</p>
                                    </div>
                                    <div class="bg-gray-50 rounded-lg p-4">
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                                        <p class="text-lg font-semibold text-gray-900">{{ Auth::user()->email }}</p>
                                    </div>
                                </div>
                                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div class="flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p class="text-sm text-blue-800">
                                            <strong>Account Status:</strong> Your account is active and all information is up to date.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <!-- Profile Edit Mode (Hidden by default) -->
                            <div id="profile-edit" class="hidden">
                                @include('profile.partials.update-profile-information-form')
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Password Tab Content -->
                <div id="content-password" class="tab-content hidden">
                    <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden hover:shadow-2xl transition-all duration-300">
                        <div class="bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-gray-100 p-6 sm:p-8">
                            <div class="flex items-center">
                                <div class="flex-shrink-0">
                                    <div class="h-12 w-12 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                </div>
                                <div class="ml-4">
                                    <h3 class="text-xl font-bold text-gray-900">Update Password</h3>
                                    <p class="mt-1 text-sm text-gray-600">Ensure your account is using a long, random password to stay secure.</p>
                                </div>
                            </div>
                        </div>
                        <div class="p-6 sm:p-8">
                            <div class="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <div class="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                    <div>
                                        <p class="text-sm text-yellow-800 font-medium">Password Security Tips:</p>
                                        <ul class="text-xs text-yellow-700 mt-1 list-disc list-inside">
                                            <li>Use at least 8 characters with mixed case, numbers, and symbols</li>
                                            <li>Avoid using personal information or common words</li>
                                            <li>Consider using a password manager</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            @include('profile.partials.update-password-form')
                        </div>
                    </div>
                </div>

                <!-- Delete Account Tab Content -->
                <div id="content-delete" class="tab-content hidden">
                    <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden hover:shadow-2xl transition-all duration-300">
                        <div class="bg-gradient-to-r from-red-50 to-pink-50 border-b border-gray-100 p-6 sm:p-8">
                            <div class="flex items-center">
                                <div class="flex-shrink-0">
                                    <div class="h-12 w-12 bg-gradient-to-r from-red-500 to-pink-600 rounded-xl flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </div>
                                </div>
                                <div class="ml-4">
                                    <h3 class="text-xl font-bold text-gray-900">Delete Account</h3>
                                    <p class="mt-1 text-sm text-gray-600">Permanently remove your account and all associated data.</p>
                                </div>
                            </div>
                        </div>
                        <div class="p-6 sm:p-8">
                            <div class="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                                <div class="flex items-start">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-red-600 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                    <div>
                                        <p class="text-sm text-red-800 font-medium mb-2">⚠️ Warning: This action cannot be undone!</p>
                                        <p class="text-sm text-red-700">When you delete your account, the following will happen:</p>
                                        <ul class="text-sm text-red-700 mt-2 list-disc list-inside space-y-1">
                                            <li>All your personal data will be permanently deleted</li>
                                            <li>You will lose access to all your saved information</li>
                                            <li>This action cannot be reversed</li>
                                            <li>You will need to create a new account to use our services again</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            @include('profile.partials.delete-user-form')
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Tab switching functionality
        function showTab(tabName) {
            // Hide all tab contents
            const contents = document.querySelectorAll('.tab-content');
            contents.forEach(content => {
                content.classList.add('hidden');
            });

            // Remove active class from all tabs
            const tabs = document.querySelectorAll('.tab-button');
            tabs.forEach(tab => {
                tab.classList.remove('active', 'bg-indigo-600', 'text-white');
                tab.classList.add('text-gray-600', 'hover:text-indigo-600', 'hover:bg-white/50');
            });

            // Show selected tab content
            document.getElementById(`content-${tabName}`).classList.remove('hidden');

            // Activate selected tab
            const activeTab = document.getElementById(`tab-${tabName}`);
            activeTab.classList.add('active', 'bg-indigo-600', 'text-white');
            activeTab.classList.remove('text-gray-600', 'hover:text-indigo-600', 'hover:bg-white/50');

            // Special styling for delete tab
            if (tabName === 'delete') {
                activeTab.classList.remove('bg-indigo-600');
                activeTab.classList.add('bg-red-600', 'hover:bg-red-700');
            }
        }

        // Profile edit toggle functionality
        function toggleEditProfile() {
            const displayMode = document.getElementById('profile-display');
            const editMode = document.getElementById('profile-edit');
            const editBtn = document.getElementById('edit-profile-btn');

            if (displayMode.classList.contains('hidden')) {
                // Switch to display mode
                displayMode.classList.remove('hidden');
                editMode.classList.add('hidden');
                editBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Ubah Profil
                `;
            } else {
                // Switch to edit mode
                displayMode.classList.add('hidden');
                editMode.classList.remove('hidden');
                editBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Batal
                `;
            }
        }

        // Initialize default tab
        document.addEventListener('DOMContentLoaded', function() {
            showTab('profile');
        });
    </script>

    <style>
        .tab-content {
            animation: fadeIn 0.3s ease-in-out;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .tab-button.active {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
        }
    </style>
</x-app-layout>
