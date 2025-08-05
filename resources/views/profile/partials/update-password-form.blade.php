<section>
    <form method="post" action="{{ route('password.update') }}" class="space-y-6">
        @csrf
        @method('put')

        <!-- Current Password -->
        <div>
            <label for="update_password_current_password" class="block text-sm font-semibold text-gray-700 mb-2">
                {{ __('Current Password') }}
            </label>
            <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>
                <input
                    id="update_password_current_password"
                    name="current_password"
                    type="password"
                    class="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                    placeholder="Enter your current password"
                    autocomplete="current-password"
                />
                <button type="button" onclick="togglePassword('update_password_current_password')" class="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                </button>
            </div>
            @if($errors->updatePassword->get('current_password'))
                <div class="mt-2 flex items-center text-sm text-red-600">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    @foreach($errors->updatePassword->get('current_password') as $error)
                        <span>{{ $error }}</span>
                    @endforeach
                </div>
            @endif
        </div>

        <!-- New Password -->
        <div>
            <label for="update_password_password" class="block text-sm font-semibold text-gray-700 mb-2">
                {{ __('New Password') }}
            </label>
            <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                </div>
                <input
                    id="update_password_password"
                    name="password"
                    type="password"
                    class="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                    placeholder="Enter your new password"
                    autocomplete="new-password"
                    oninput="checkPasswordStrength(this.value)"
                />
                <button type="button" onclick="togglePassword('update_password_password')" class="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                </button>
            </div>

            <!-- Password Strength Indicator -->
            <div class="mt-2">
                <div class="flex items-center space-x-2">
                    <div class="flex-1">
                        <div class="bg-gray-200 rounded-full h-2">
                            <div id="strength-bar" class="h-2 rounded-full transition-all duration-300 bg-gray-300" style="width: 0%"></div>
                        </div>
                    </div>
                    <span id="strength-text" class="text-xs font-medium text-gray-500">Weak</span>
                </div>
                <div class="mt-2 text-xs text-gray-600">
                    <div class="grid grid-cols-2 gap-2">
                        <div id="check-length" class="flex items-center">
                            <span class="w-4 h-4 mr-1">❌</span> 8+ characters
                        </div>
                        <div id="check-uppercase" class="flex items-center">
                            <span class="w-4 h-4 mr-1">❌</span> Uppercase letter
                        </div>
                        <div id="check-lowercase" class="flex items-center">
                            <span class="w-4 h-4 mr-1">❌</span> Lowercase letter
                        </div>
                        <div id="check-number" class="flex items-center">
                            <span class="w-4 h-4 mr-1">❌</span> Number
                        </div>
                    </div>
                </div>
            </div>

            @if($errors->updatePassword->get('password'))
                <div class="mt-2 flex items-center text-sm text-red-600">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    @foreach($errors->updatePassword->get('password') as $error)
                        <span>{{ $error }}</span>
                    @endforeach
                </div>
            @endif
        </div>

        <!-- Confirm Password -->
        <div>
            <label for="update_password_password_confirmation" class="block text-sm font-semibold text-gray-700 mb-2">
                {{ __('Confirm New Password') }}
            </label>
            <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <input
                    id="update_password_password_confirmation"
                    name="password_confirmation"
                    type="password"
                    class="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                    placeholder="Confirm your new password"
                    autocomplete="new-password"
                    oninput="checkPasswordMatch()"
                />
                <button type="button" onclick="togglePassword('update_password_password_confirmation')" class="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                </button>
            </div>
            <div id="password-match" class="mt-2 text-sm hidden">
                <div class="flex items-center">
                    <span id="match-icon" class="mr-2"></span>
                    <span id="match-text"></span>
                </div>
            </div>
            @if($errors->updatePassword->get('password_confirmation'))
                <div class="mt-2 flex items-center text-sm text-red-600">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    @foreach($errors->updatePassword->get('password_confirmation') as $error)
                        <span>{{ $error }}</span>
                    @endforeach
                </div>
            @endif
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-6 border-t border-gray-200">
            <div class="flex items-center gap-4">
                <button
                    type="submit"
                    class="inline-flex items-center px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-yellow-500/50"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    {{ __('Update Password') }}
                </button>

                @if (session('status') === 'password-updated')
                    <div
                        x-data="{ show: true }"
                        x-show="show"
                        x-transition:enter="transition ease-out duration-300"
                        x-transition:enter-start="opacity-0 transform scale-90"
                        x-transition:enter-end="opacity-100 transform scale-100"
                        x-transition:leave="transition ease-in duration-300"
                        x-transition:leave-start="opacity-100 transform scale-100"
                        x-transition:leave-end="opacity-0 transform scale-90"
                        x-init="setTimeout(() => show = false, 3000)"
                        class="inline-flex items-center px-4 py-2 bg-green-100 border border-green-200 rounded-lg text-green-800 text-sm font-medium"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {{ __('Password updated successfully!') }}
                    </div>
                @endif
            </div>
        </div>
    </form>

    <script>
        function togglePassword(inputId) {
            const input = document.getElementById(inputId);
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
        }

        function checkPasswordStrength(password) {
            let strength = 0;
            const checks = {
                length: password.length >= 8,
                uppercase: /[A-Z]/.test(password),
                lowercase: /[a-z]/.test(password),
                number: /[0-9]/.test(password)
            };

            // Update visual indicators
            Object.keys(checks).forEach(check => {
                const element = document.getElementById(`check-${check}`);
                const icon = element.querySelector('span');
                if (checks[check]) {
                    icon.textContent = '✅';
                    strength++;
                } else {
                    icon.textContent = '❌';
                }
            });

            // Update strength bar
            const strengthBar = document.getElementById('strength-bar');
            const strengthText = document.getElementById('strength-text');
            const percentage = (strength / 4) * 100;

            strengthBar.style.width = percentage + '%';

            if (strength === 0) {
                strengthBar.className = 'h-2 rounded-full transition-all duration-300 bg-gray-300';
                strengthText.textContent = 'Very Weak';
                strengthText.className = 'text-xs font-medium text-gray-500';
            } else if (strength === 1) {
                strengthBar.className = 'h-2 rounded-full transition-all duration-300 bg-red-400';
                strengthText.textContent = 'Weak';
                strengthText.className = 'text-xs font-medium text-red-500';
            } else if (strength === 2) {
                strengthBar.className = 'h-2 rounded-full transition-all duration-300 bg-yellow-400';
                strengthText.textContent = 'Fair';
                strengthText.className = 'text-xs font-medium text-yellow-600';
            } else if (strength === 3) {
                strengthBar.className = 'h-2 rounded-full transition-all duration-300 bg-blue-400';
                strengthText.textContent = 'Good';
                strengthText.className = 'text-xs font-medium text-blue-600';
            } else {
                strengthBar.className = 'h-2 rounded-full transition-all duration-300 bg-green-500';
                strengthText.textContent = 'Strong';
                strengthText.className = 'text-xs font-medium text-green-600';
            }
        }

        function checkPasswordMatch() {
            const password = document.getElementById('update_password_password').value;
            const confirmation = document.getElementById('update_password_password_confirmation').value;
            const matchDiv = document.getElementById('password-match');
            const matchIcon = document.getElementById('match-icon');
            const matchText = document.getElementById('match-text');

            if (confirmation.length > 0) {
                matchDiv.classList.remove('hidden');
                if (password === confirmation) {
                    matchIcon.textContent = '✅';
                    matchText.textContent = 'Passwords match';
                    matchText.className = 'text-green-600 font-medium';
                } else {
                    matchIcon.textContent = '❌';
                    matchText.textContent = 'Passwords do not match';
                    matchText.className = 'text-red-600 font-medium';
                }
            } else {
                matchDiv.classList.add('hidden');
            }
        }
    </script>
</section>
