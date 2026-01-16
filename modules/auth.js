// ===== Authentication Module - User Login & Signup =====

const AuthModule = {
    currentUser: null,

    init() {
        this.checkAutoLogin();
    },

    // Simple hash function for password (client-side)
    hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(16);
    },

    // Check if user is already logged in
    checkAutoLogin() {
        const session = localStorage.getItem('aipos_session');
        if (session) {
            const sessionData = JSON.parse(session);
            const now = new Date().getTime();
            
            // Check if session is still valid (7 days)
            if (now - sessionData.loginTime < 7 * 24 * 60 * 60 * 1000) {
                this.currentUser = sessionData.email;
                return true;
            } else {
                // Session expired
                localStorage.removeItem('aipos_session');
            }
        }
        return false;
    },

    // Get all registered users
    getAllUsers() {
        return JSON.parse(localStorage.getItem('aipos_users') || '{}');
    },

    // Save users database
    saveUsers(users) {
        localStorage.setItem('aipos_users', JSON.stringify(users));
    },

    // Register new user
    signup(email, password, name) {
        if (!email || !password) {
            return { success: false, message: 'Email and password are required' };
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return { success: false, message: 'Invalid email format' };
        }

        // Validate password length
        if (password.length < 6) {
            return { success: false, message: 'Password must be at least 6 characters' };
        }

        const users = this.getAllUsers();

        // Check if user already exists
        if (users[email]) {
            return { success: false, message: 'Email already registered. Please login.' };
        }

        // Create new user
        users[email] = {
            email: email,
            name: name || email.split('@')[0],
            password: this.hashPassword(password),
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        };

        this.saveUsers(users);
        this.createUserData(email);
        
        return { success: true, message: 'Account created successfully!' };
    },

    // Login existing user
    login(email, password) {
        if (!email || !password) {
            return { success: false, message: 'Email and password are required' };
        }

        const users = this.getAllUsers();
        const user = users[email];

        if (!user) {
            return { success: false, message: 'Email not found. Please signup first.' };
        }

        // Verify password
        if (user.password !== this.hashPassword(password)) {
            return { success: false, message: 'Incorrect password' };
        }

        // Update last login
        user.lastLogin = new Date().toISOString();
        this.saveUsers(users);

        // Create session
        this.createSession(email);
        this.currentUser = email;

        return { success: true, message: 'Login successful!', user: user };
    },

    // Create login session
    createSession(email) {
        const session = {
            email: email,
            loginTime: new Date().getTime()
        };
        localStorage.setItem('aipos_session', JSON.stringify(session));
    },

    // Logout user
    logout() {
        localStorage.removeItem('aipos_session');
        this.currentUser = null;
        
        // Clear all app data from memory (but keep in storage)
        window.location.reload();
    },

    // Create initial user data structure
    createUserData(email) {
        const userKey = `user_${email}`;
        const initialData = {
            habits: [],
            tasks: [],
            focus_sessions: [],
            daily_stats: {},
            chat_history: [],
            user_profile: {
                firstVisit: new Date().toISOString(),
                lastVisit: new Date().toISOString(),
                totalVisits: 1,
                streak: 0,
                lastActiveDate: new Date().toDateString()
            },
            settings: {
                adaptiveUI: true,
                darkMode: true,
                animations: true,
                focusDuration: 25,
                breakDuration: 5
            }
        };

        localStorage.setItem(userKey, JSON.stringify(initialData));
    },

    // Get current user's data
    getUserData() {
        if (!this.currentUser) return null;
        
        const userKey = `user_${this.currentUser}`;
        const data = localStorage.getItem(userKey);
        
        if (!data) {
            this.createUserData(this.currentUser);
            return this.getUserData();
        }
        
        return JSON.parse(data);
    },

    // Save current user's data
    saveUserData(data) {
        if (!this.currentUser) return false;
        
        const userKey = `user_${this.currentUser}`;
        localStorage.setItem(userKey, JSON.stringify(data));
        return true;
    },

    // Get specific data for current user
    getUserItem(key) {
        const userData = this.getUserData();
        if (!userData) return null;
        return userData[key];
    },

    // Save specific data for current user
    saveUserItem(key, value) {
        const userData = this.getUserData();
        if (!userData) return false;
        
        userData[key] = value;
        return this.saveUserData(userData);
    },

    // Check if user is logged in
    isLoggedIn() {
        return this.currentUser !== null;
    },

    // Get current user info
    getCurrentUser() {
        if (!this.currentUser) return null;
        
        const users = this.getAllUsers();
        return users[this.currentUser];
    },

    // Delete account (optional feature)
    deleteAccount(password) {
        if (!this.currentUser) return { success: false, message: 'Not logged in' };
        
        const users = this.getAllUsers();
        const user = users[this.currentUser];
        
        if (user.password !== this.hashPassword(password)) {
            return { success: false, message: 'Incorrect password' };
        }

        // Remove user data
        const userKey = `user_${this.currentUser}`;
        localStorage.removeItem(userKey);
        
        // Remove user account
        delete users[this.currentUser];
        this.saveUsers(users);
        
        // Logout
        this.logout();
        
        return { success: true, message: 'Account deleted successfully' };
    }
};
