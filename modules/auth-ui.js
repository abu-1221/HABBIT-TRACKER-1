// ===== Auth UI Manager - Login/Signup Interface =====
// FIXED VERSION - Properly handles async authentication

const AuthUI = {
    renderAuthScreen() {
        const authContainer = document.createElement('div');
        authContainer.id = 'auth-screen';
        authContainer.className = 'auth-container';
        authContainer.innerHTML = `
            <div class="auth-card">
                <div class="auth-header">
                    <div class="auth-logo">
                        <div class="auth-logo-icon">
                            <i data-lucide="brain-circuit"></i>
                        </div>
                        <div class="auth-logo-text">AI-POS</div>
                    </div>
                    <h1 class="auth-heading" id="auth-heading">Welcome Back</h1>
                    <p class="auth-subheading" id="auth-subheading">Sign in to access your productivity dashboard</p>
                </div>

                <div id="auth-message"></div>

                <!-- Login Form -->
                <form id="login-form" class="auth-form">
                    <div class="auth-input-group">
                        <label class="auth-label" for="login-email">Email Address</label>
                        <input type="email" id="login-email" class="auth-input" placeholder="your@email.com" required autocomplete="email">
                    </div>
                    <div class="auth-input-group">
                        <label class="auth-label" for="login-password">Password</label>
                        <input type="password" id="login-password" class="auth-input" placeholder="••••••••" required autocomplete="current-password">
                    </div>
                    <button type="submit" class="auth-btn" id="login-btn">
                        <span>Sign In</span>
                    </button>
                </form>

                <!-- Signup Form (Hidden by default) -->
                <form id="signup-form" class="auth-form" style="display: none;">
                    <div class="auth-input-group">
                        <label class="auth-label" for="signup-name">Full Name</label>
                        <input type="text" id="signup-name" class="auth-input" placeholder="John Doe" autocomplete="name">
                    </div>
                    <div class="auth-input-group">
                        <label class="auth-label" for="signup-email">Email Address</label>
                        <input type="email" id="signup-email" class="auth-input" placeholder="your@email.com" required autocomplete="email">
                    </div>
                    <div class="auth-input-group">
                        <label class="auth-label" for="signup-password">Password</label>
                        <input type="password" id="signup-password" class="auth-input" placeholder="••••••••" required autocomplete="new-password">
                    </div>
                    <div class="auth-input-group">
                        <label class="auth-label" for="signup-confirm-password">Confirm Password</label>
                        <input type="password" id="signup-confirm-password" class="auth-input" placeholder="••••••••" required autocomplete="new-password">
                    </div>
                    <button type="submit" class="auth-btn" id="signup-btn">
                        <span>Create Account</span>
                    </button>
                </form>

                <div class="auth-toggle" id="auth-toggle">
                    <span id="toggle-text">Don't have an account? </span>
                    <a class="auth-toggle-link" id="toggle-link">Sign up</a>
                </div>

                <div class="auth-features">
                    <div class="auth-feature-list">
                        <div class="auth-feature-item">
                            <i data-lucide="shield-check" class="auth-feature-icon"></i>
                            <span>Your data is encrypted and secure</span>
                        </div>
                        <div class="auth-feature-item">
                            <i data-lucide="database" class="auth-feature-icon"></i>
                            <span>All data stored locally on your device</span>
                        </div>
                        <div class="auth-feature-item">
                            <i data-lucide="bell" class="auth-feature-icon"></i>
                            <span>Push notifications for habits & tasks</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertBefore(authContainer, document.body.firstChild);
        lucide.createIcons();
        this.bindAuthEvents();
    },

    bindAuthEvents() {
        const loginForm = document.getElementById('login-form');
        const signupForm = document.getElementById('signup-form');
        const toggleLink = document.getElementById('toggle-link');
        const authHeading = document.getElementById('auth-heading');
        const authSubheading = document.getElementById('auth-subheading');
        const toggleText = document.getElementById('toggle-text');

        let isLoginMode = true;

        // Toggle between login and signup
        toggleLink.addEventListener('click', (e) => {
            e.preventDefault();
            isLoginMode = !isLoginMode;

            if (isLoginMode) {
                loginForm.style.display = 'flex';
                signupForm.style.display = 'none';
                authHeading.textContent = 'Welcome Back';
                authSubheading.textContent = 'Sign in to access your productivity dashboard';
                toggleText.textContent = "Don't have an account? ";
                toggleLink.textContent = 'Sign up';
            } else {
                loginForm.style.display = 'none';
                signupForm.style.display = 'flex';
                authHeading.textContent = 'Create Account';
                authSubheading.textContent = 'Join AI-POS and start tracking your productivity';
                toggleText.textContent = 'Already have an account? ';
                toggleLink.textContent = 'Sign in';
            }

            this.clearMessage();
        });

        // Login form submission - FIXED: Now properly handles async
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;

            if (!email || !password) {
                this.showMessage('Please enter email and password', 'error');
                return;
            }

            const loginBtn = document.getElementById('login-btn');
            const originalText = loginBtn.innerHTML;
            loginBtn.innerHTML = '<span>Signing in...</span>';
            loginBtn.disabled = true;

            try {
                const result = await AuthModule.login(email, password);
                
                if (result && result.success) {
                    this.showMessage(result.message || 'Login successful!', 'success');
                    setTimeout(() => {
                        this.hideAuthScreen();
                        window.location.reload(); // Reload to initialize with user data
                    }, 1000);
                } else {
                    this.showMessage(result?.message || 'Login failed. Please check your credentials.', 'error');
                    loginBtn.innerHTML = originalText;
                    loginBtn.disabled = false;
                }
            } catch (error) {
                console.error('Login error:', error);
                this.showMessage('An error occurred during login. Please try again.', 'error');
                loginBtn.innerHTML = originalText;
                loginBtn.disabled = false;
            }
        });

        // Signup form submission - FIXED: Now properly handles async
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('signup-name').value.trim();
            const email = document.getElementById('signup-email').value.trim();
            const password = document.getElementById('signup-password').value;
            const confirmPassword = document.getElementById('signup-confirm-password').value;

            if (!email || !password) {
                this.showMessage('Please enter email and password', 'error');
                return;
            }

            if (password !== confirmPassword) {
                this.showMessage('Passwords do not match', 'error');
                return;
            }

            const signupBtn = document.getElementById('signup-btn');
            const originalText = signupBtn.innerHTML;
            signupBtn.innerHTML = '<span>Creating account...</span>';
            signupBtn.disabled = true;

            try {
                const result = await AuthModule.signup(email, password, name);
                
                if (result && result.success) {
                    this.showMessage(result.message || 'Account created! Please login.', 'success');
                    // Auto-login after successful signup
                    setTimeout(async () => {
                        const loginResult = await AuthModule.login(email, password);
                        if (loginResult && loginResult.success) {
                            this.hideAuthScreen();
                            window.location.reload();
                        } else {
                            // Switch to login mode
                            document.getElementById('login-email').value = email;
                            toggleLink.click();
                        }
                    }, 1500);
                } else {
                    this.showMessage(result?.message || 'Signup failed. Please try again.', 'error');
                    signupBtn.innerHTML = originalText;
                    signupBtn.disabled = false;
                }
            } catch (error) {
                console.error('Signup error:', error);
                this.showMessage('An error occurred during signup. Please try again.', 'error');
                signupBtn.innerHTML = originalText;
                signupBtn.disabled = false;
            }
        });
    },

    showMessage(message, type) {
        const messageContainer = document.getElementById('auth-message');
        messageContainer.className = type === 'success' ? 'auth-success' : 'auth-error';
        messageContainer.innerHTML = `
            <i data-lucide="${type === 'success' ? 'check-circle' : 'alert-circle'}"></i>
            <span>${message}</span>
        `;
        lucide.createIcons();
    },

    clearMessage() {
        const messageContainer = document.getElementById('auth-message');
        if (messageContainer) {
            messageContainer.className = '';
            messageContainer.innerHTML = '';
        }
    },

    hideAuthScreen() {
        const authScreen = document.getElementById('auth-screen');
        if (authScreen) {
            authScreen.remove();
        }
    },

    showAuthScreen() {
        // Remove existing auth screen if any
        this.hideAuthScreen();
        this.renderAuthScreen();
    }
};
