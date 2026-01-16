// ===== Storage Module - LocalStorage Persistence Layer =====

const Storage = {
    // Keys
    KEYS: {
        TASKS: 'aipos_tasks',
        HABITS: 'aipos_habits',
        FOCUS_SESSIONS: 'aipos_focus_sessions',
        DAILY_STATS: 'aipos_daily_stats',
        SETTINGS: 'aipos_settings',
        CHAT_HISTORY: 'aipos_chat_history',
        USER_PROFILE: 'aipos_user_profile'
    },

    // Initialize storage with default values
    init() {
        if (!this.get(this.KEYS.TASKS)) this.set(this.KEYS.TASKS, []);
        if (!this.get(this.KEYS.HABITS)) this.set(this.KEYS.HABITS, []);
        if (!this.get(this.KEYS.FOCUS_SESSIONS)) this.set(this.KEYS.FOCUS_SESSIONS, []);
        if (!this.get(this.KEYS.DAILY_STATS)) this.set(this.KEYS.DAILY_STATS, {});
        if (!this.get(this.KEYS.CHAT_HISTORY)) this.set(this.KEYS.CHAT_HISTORY, []);
        if (!this.get(this.KEYS.SETTINGS)) {
            this.set(this.KEYS.SETTINGS, {
                adaptiveUI: true,
                darkMode: true,
                animations: true,
                focusDuration: 25,
                breakDuration: 5
            });
        }
        if (!this.get(this.KEYS.USER_PROFILE)) {
            this.set(this.KEYS.USER_PROFILE, {
                firstVisit: new Date().toISOString(),
                lastVisit: new Date().toISOString(),
                totalVisits: 1,
                streak: 0,
                lastActiveDate: null
            });
        }
        this.updateVisit();
    },

    // Get data from localStorage (user-specific if logged in)
    get(key) {
        try {
            // If user is logged in, get from user-specific storage
            if (typeof AuthModule !== 'undefined' && AuthModule.isLoggedIn()) {
                const keyName = key.replace('aipos_', '');
                return AuthModule.getUserItem(keyName);
            }
            
            // Fallback to regular storage (for non-authenticated access)
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Storage get error:', e);
            return null;
        }
    },

    // Set data to localStorage (user-specific if logged in)
    set(key, value) {
        try {
            // If user is logged in, save to user-specific storage
            if (typeof AuthModule !== 'undefined' && AuthModule.isLoggedIn()) {
                const keyName = key.replace('aipos_', '');
                const result = AuthModule.saveUserItem(keyName, value);
                
                // Trigger cloud sync if available
                if (typeof CloudSync !== 'undefined' && CloudSync.isEnabled) {
                    CloudSync.syncToCloud().catch(err => console.error('Cloud sync error:', err));
                }
                
                return result;
            }
            
            // Fallback to regular storage
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Storage set error:', e);
            return false;
        }
    },

    // Update visit tracking
    updateVisit() {
        const profile = this.get(this.KEYS.USER_PROFILE);
        const today = new Date().toDateString();
        const lastVisit = profile.lastActiveDate;
        
        if (lastVisit !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            
            if (lastVisit === yesterday.toDateString()) {
                profile.streak++;
            } else if (lastVisit !== today) {
                profile.streak = 1;
            }
            
            profile.lastActiveDate = today;
            profile.totalVisits++;
            profile.lastVisit = new Date().toISOString();
            this.set(this.KEYS.USER_PROFILE, profile);
        }
    },

    // Get today's date string
    getTodayKey() {
        return new Date().toISOString().split('T')[0];
    },

    // Get or create today's stats
    getTodayStats() {
        const stats = this.get(this.KEYS.DAILY_STATS);
        const today = this.getTodayKey();
        
        if (!stats[today]) {
            stats[today] = {
                tasksCompleted: 0,
                tasksCreated: 0,
                focusTime: 0,
                focusSessions: 0,
                habitsCompleted: 0,
                idleTime: 0,
                lastActivity: Date.now(),
                focusScore: 0
            };
            this.set(this.KEYS.DAILY_STATS, stats);
        }
        
        return stats[today];
    },

    // Update today's stats
    updateTodayStats(updates) {
        const stats = this.get(this.KEYS.DAILY_STATS);
        const today = this.getTodayKey();
        
        if (!stats[today]) {
            stats[today] = this.getTodayStats();
        }
        
        Object.assign(stats[today], updates);
        this.set(this.KEYS.DAILY_STATS, stats);
        return stats[today];
    },

    // Export all data
    exportData() {
        const data = {};
        Object.values(this.KEYS).forEach(key => {
            data[key] = this.get(key);
        });
        return data;
    },

    // Import data
    importData(data) {
        Object.entries(data).forEach(([key, value]) => {
            this.set(key, value);
        });
    },

    // Clear all data
    clearAll() {
        Object.values(this.KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
        this.init();
    }
};

// Initialize storage on load
Storage.init();
