// ===== Enhanced Security Module =====

const SecurityModule = {
    // Rate limiting for login attempts
    loginAttempts: {},
    MAX_ATTEMPTS: 5,
    LOCKOUT_TIME: 15 * 60 * 1000, // 15 minutes

    // Better password hashing using SHA-256
    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password + 'aipos_salt_2024'); // Add salt
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    },

    // Sanitize input to prevent XSS
    sanitizeInput(input) {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    },

    // Validate email format
    validateEmail(email) {
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email);
    },

    // Validate password strength
    validatePassword(password) {
        const errors = [];
        
        if (password.length < 8) {
            errors.push('Password must be at least 8 characters');
        }
        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        if (!/[0-9]/.test(password)) {
            errors.push('Password must contain at least one number');
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    },

    // Check login rate limiting
    checkLoginRateLimit(email) {
        const now = Date.now();
        const attempts = this.loginAttempts[email];

        if (!attempts) {
            this.loginAttempts[email] = { count: 1, lastAttempt: now };
            return { allowed: true };
        }

        // Reset if lockout time has passed
        if (now - attempts.lastAttempt > this.LOCKOUT_TIME) {
            this.loginAttempts[email] = { count: 1, lastAttempt: now };
            return { allowed: true };
        }

        // Check if max attempts exceeded
        if (attempts.count >= this.MAX_ATTEMPTS) {
            const timeLeft = Math.ceil((this.LOCKOUT_TIME - (now - attempts.lastAttempt)) / 60000);
            return {
                allowed: false,
                message: `Too many login attempts. Please try again in ${timeLeft} minutes.`
            };
        }

        // Increment attempts
        this.loginAttempts[email].count++;
        this.loginAttempts[email].lastAttempt = now;
        return { allowed: true };
    },

    // Reset login attempts on successful login
    resetLoginAttempts(email) {
        delete this.loginAttempts[email];
    },

    // Encrypt sensitive data before storage
    encryptData(data, userPassword) {
        // Simple XOR encryption (for demo - use Web Crypto API for production)
        const key = userPassword.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
        const encrypted = JSON.stringify(data).split('').map(char => 
            String.fromCharCode(char.charCodeAt(0) ^ (key % 256))
        ).join('');
        return btoa(encrypted); // Base64 encode
    },

    // Decrypt sensitive data
    decryptData(encryptedData, userPassword) {
        try {
            const key = userPassword.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
            const decoded = atob(encryptedData);
            const decrypted = decoded.split('').map(char => 
                String.fromCharCode(char.charCodeAt(0) ^ (key % 256))
            ).join('');
            return JSON.parse(decrypted);
        } catch (e) {
            console.error('Decryption failed:', e);
            return null;
        }
    },

    // Check if running on HTTPS (important for PWA)
    isSecureContext() {
        return window.isSecureContext;
    },

    // Validate session token
    validateSession() {
        const session = localStorage.getItem('aipos_session');
        if (!session) return false;

        try {
            const sessionData = JSON.parse(session);
            const now = new Date().getTime();
            
            // Check if session expired
            if (now - sessionData.loginTime > 7 * 24 * 60 * 60 * 1000) {
                localStorage.removeItem('aipos_session');
                return false;
            }

            return true;
        } catch (e) {
            return false;
        }
    },

    // Generate secure random token
    generateToken(length = 32) {
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    },

    // Content Security Policy enforcement
    enforceCSP() {
        // This would typically be set in HTTP headers, but we can log warning
        if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
            console.warn('CSP not configured. Add CSP meta tag for enhanced security.');
        }
    },

    // Prevent clickjacking
    preventClickjacking() {
        if (window.self !== window.top) {
            window.top.location = window.self.location;
        }
    },

    // Initialize security features
    init() {
        this.enforceCSP();
        this.preventClickjacking();
        
        // Warn if not HTTPS in production
        if (!this.isSecureContext() && location.hostname !== 'localhost') {
            console.warn('⚠️ App should be served over HTTPS for full PWA features!');
        }
    }
};
