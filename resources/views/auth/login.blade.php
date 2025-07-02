{{-- resources/views/auth/login.blade.php --}}
<x-guest-layout>
    <div class="max-w-md mx-auto bg-white shadow-lg p-8 rounded-xl mt-10">
        <h2 class="text-2xl font-bold text-center mb-6">Masuk ke Akun Kamu</h2>
        
        <!-- Session Status -->
        <x-auth-session-status class="mb-4" :status="session('status')" />

        <form method="POST" action="{{ route('login') }}">
            @csrf

            <!-- Email -->
            <div class="mb-4">
                <label for="email" class="block font-semibold mb-1">Email</label>
                <input id="email" class="border w-full p-2 rounded focus:ring focus:ring-blue-200" type="email" name="email" required autofocus>
            </div>

            <!-- Password -->
            <div class="mb-4">
                <label for="password" class="block font-semibold mb-1">Password</label>
                <input id="password" class="border w-full p-2 rounded focus:ring focus:ring-blue-200" type="password" name="password" required>
            </div>

            <!-- Remember Me -->
            <div class="mb-4 flex items-center">
                <input id="remember_me" type="checkbox" class="mr-2" name="remember">
                <label for="remember_me">Ingat Saya</label>
            </div>

            <div>
                <button class="bg-blue-500 text-white w-full p-2 rounded hover:bg-blue-600 transition">Login</button>
            </div>
        </form>
    </div>
</x-guest-layout>
