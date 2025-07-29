<x-app-layout>
    <x-slot name="header">
        <div class="flex items-center justify-between">
            <h2 class="text-2xl font-light text-gray-900">
                {{ __('Profile Settings') }}
            </h2>
        </div>
    </x-slot>

    <div class="py-8">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <!-- Profile Card -->
            <div class="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
                <div class="p-6 sm:p-8">
                    <div class="flex items-start">
                        <div class="flex-shrink-0 mr-6 hidden sm:block">
                            <div class="relative">
                                <div class="h-20 w-20 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center">
                                    <span class="text-2xl font-medium text-blue-600">{{ substr(Auth::user()->name, 0, 1) }}</span>
                                </div>
                                <button class="absolute -bottom-2 -right-2 bg-white p-1.5 rounded-full shadow-sm border border-gray-200 hover:bg-gray-50 transition">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div class="flex-1 min-w-0">
                            <h3 class="text-lg font-medium text-gray-900 mb-1">{{ Auth::user()->name }}</h3>
                            <p class="text-gray-500 text-sm mb-4">{{ Auth::user()->email }}</p>
                            <p class="text-gray-400 text-xs">Member since {{ Auth::user()->created_at->format('F Y') }}</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tab Navigation -->
            <div class="mb-8 border-b border-gray-200">
                <nav class="-mb-px flex space-x-8">
                    <a href="#" class="border-blue-500 text-blue-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
                        Personal Information
                    </a>
                    <a href="#" class="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
                        Security
                    </a>
                    <a href="#" class="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
                        Notifications
                    </a>
                </nav>
            </div>

            <!-- Forms Section -->
            <div class="space-y-6">
                <div class="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div class="p-6 sm:p-8">
                        <div class="mb-6">
                            <h3 class="text-lg font-medium text-gray-900">Profile Information</h3>
                            <p class="mt-1 text-sm text-gray-500">Update your account's profile information and email address.</p>
                        </div>
                        @include('profile.partials.update-profile-information-form')
                    </div>
                </div>

                <div class="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div class="p-6 sm:p-8">
                        <div class="mb-6">
                            <h3 class="text-lg font-medium text-gray-900">Update Password</h3>
                            <p class="mt-1 text-sm text-gray-500">Ensure your account is using a long, random password to stay secure.</p>
                        </div>
                        @include('profile.partials.update-password-form')
                    </div>
                </div>

                <div class="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div class="p-6 sm:p-8">
                        <div class="mb-6">
                            <h3 class="text-lg font-medium text-gray-900">Delete Account</h3>
                            <p class="mt-1 text-sm text-gray-500">Once your account is deleted, all of its resources and data will be permanently deleted.</p>
                        </div>
                        @include('profile.partials.delete-user-form')
                    </div>
                </div>
            </div>
        </div>
    </div>
</x-app-layout>