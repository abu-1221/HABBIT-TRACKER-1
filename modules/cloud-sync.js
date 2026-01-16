// ===== Cloud Sync Module - Firebase Integration =====

const CloudSync = {
    isEnabled: false,
    currentUser: null,
    syncInterval: null,

    init() {
        // Check if Firebase is configured
        if (!window.FirebaseConfig || !window.FirebaseConfig.isConfigured) {
            console.log('Cloud sync disabled: Firebase not configured');
            return;
        }

        this.isEnabled = true;
        const { auth } = window.FirebaseConfig;

        // Listen for auth state changes
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                this.currentUser = user;
                console.log('✅ Cloud sync enabled for:', user.email);
                
                // Sync data when user logs in
                await this.syncFromCloud();
                
                // Set up real-time listeners
                this.setupRealtimeSync();
                
                // Periodic sync every 30 seconds
                this.startPeriodicSync();
            } else {
                this.currentUser = null;
                this.stopPeriodicSync();
                console.log('Cloud sync disabled: No user logged in');
            }
        });
    },

    // Sign up with Firebase
    async signup(email, password, name) {
        if (!this.isEnabled) {
            return { success: false, message: 'Cloud sync not available' };
        }

        const { auth, db } = window.FirebaseConfig;

        try {
            // Create user account
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Update profile
            await user.updateProfile({ displayName: name || email.split('@')[0] });

            // Create user document in Firestore
            await db.collection('users').doc(user.uid).set({
                email: email,
                name: name || email.split('@')[0],
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Initialize empty data collections
            await this.initializeUserData(user.uid);

            return { success: true, message: 'Account created successfully!', user };
        } catch (error) {
            console.error('Signup error:', error);
            return { success: false, message: this.getErrorMessage(error) };
        }
    },

    // Login with Firebase
    async login(email, password) {
        if (!this.isEnabled) {
            return { success: false, message: 'Cloud sync not available' };
        }

        const { auth, db } = window.FirebaseConfig;

        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Update last login
            await db.collection('users').doc(user.uid).update({
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Sync data from cloud
            await this.syncFromCloud();

            return { success: true, message: 'Login successful!', user };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: this.getErrorMessage(error) };
        }
    },

    // Logout
    async logout() {
        if (!this.isEnabled) return;

        const { auth } = window.FirebaseConfig;

        try {
            // Sync one last time before logout
            await this.syncToCloud();
            
            await auth.signOut();
            this.stopPeriodicSync();
            
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            return { success: false, message: error.message };
        }
    },

    // Initialize user data collections
    async initializeUserData(userId) {
        const { db } = window.FirebaseConfig;

        const initialData = {
            habits: [],
            tasks: [],
            settings: {
                theme: 'dark',
                notifications: true,
                soundEffects: true,
                animations: true,
                focusDuration: 25,
                breakDuration: 5
            },
            analytics: {},
            focusSessions: []
        };

        const batch = db.batch();

        Object.keys(initialData).forEach(collection => {
            const ref = db.collection('userData').doc(userId).collection(collection).doc('data');
            batch.set(ref, { data: initialData[collection] });
        });

        await batch.commit();
    },

    // Sync data TO cloud
    async syncToCloud() {
        if (!this.isEnabled || !this.currentUser) return;

        const { db } = window.FirebaseConfig;
        const userId = this.currentUser.uid;

        try {
            // Get all local data
            const habits = Storage.get(Storage.KEYS.HABITS) || [];
            const tasks = Storage.get(Storage.KEYS.TASKS) || [];
            const settings = Storage.get(Storage.KEYS.SETTINGS) || {};
            const dailyStats = Storage.get(Storage.KEYS.DAILY_STATS) || {};

            // Upload to Firestore
            const batch = db.batch();

            batch.set(db.collection('userData').doc(userId).collection('habits').doc('data'), {
                data: habits,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            batch.set(db.collection('userData').doc(userId).collection('tasks').doc('data'), {
                data: tasks,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            batch.set(db.collection('userData').doc(userId).collection('settings').doc('data'), {
                data: settings,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            batch.set(db.collection('userData').doc(userId).collection('analytics').doc('data'), {
                data: dailyStats,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            await batch.commit();
            console.log('✅ Data synced to cloud');
        } catch (error) {
            console.error('Sync to cloud error:', error);
        }
    },

    // Sync data FROM cloud
    async syncFromCloud() {
        if (!this.isEnabled || !this.currentUser) return;

        const { db } = window.FirebaseConfig;
        const userId = this.currentUser.uid;

        try {
            // Fetch all data from Firestore
            const habitsDoc = await db.collection('userData').doc(userId).collection('habits').doc('data').get();
            const tasksDoc = await db.collection('userData').doc(userId).collection('tasks').doc('data').get();
            const settingsDoc = await db.collection('userData').doc(userId).collection('settings').doc('data').get();
            const analyticsDoc = await db.collection('userData').doc(userId).collection('analytics').doc('data').get();

            // Update local storage
            if (habitsDoc.exists) {
                const data = habitsDoc.data();
                Storage.set(Storage.KEYS.HABITS, data.data || []);
            }

            if (tasksDoc.exists) {
                const data = tasksDoc.data();
                Storage.set(Storage.KEYS.TASKS, data.data || []);
            }

            if (settingsDoc.exists) {
                const data = settingsDoc.data();
                Storage.set(Storage.KEYS.SETTINGS, data.data || {});
            }

            if (analyticsDoc.exists) {
                const data = analyticsDoc.data();
                Storage.set(Storage.KEYS.DAILY_STATS, data.data || {});
            }

            console.log('✅ Data synced from cloud');
            
            // Refresh UI
            if (typeof App !== 'undefined' && App.updateDashboard) {
                App.updateDashboard();
            }
        } catch (error) {
            console.error('Sync from cloud error:', error);
        }
    },

    // Setup real-time sync listeners
    setupRealtimeSync() {
        if (!this.isEnabled || !this.currentUser) return;

        const { db } = window.FirebaseConfig;
        const userId = this.currentUser.uid;

        // Listen for habits changes
        db.collection('userData').doc(userId).collection('habits').doc('data')
            .onSnapshot((doc) => {
                if (doc.exists && doc.metadata.hasPendingWrites === false) {
                    const data = doc.data();
                    Storage.set(Storage.KEYS.HABITS, data.data || []);
                    if (typeof HabitsModule !== 'undefined') {
                        HabitsModule.renderHabits();
                    }
                }
            });

        // Listen for tasks changes
        db.collection('userData').doc(userId).collection('tasks').doc('data')
            .onSnapshot((doc) => {
                if (doc.exists && doc.metadata.hasPendingWrites === false) {
                    const data = doc.data();
                    Storage.set(Storage.KEYS.TASKS, data.data || []);
                    if (typeof TasksModule !== 'undefined') {
                        TasksModule.renderTasks();
                    }
                }
            });
    },

    // Start periodic sync
    startPeriodicSync() {
        this.stopPeriodicSync();
        
        // Sync every 30 seconds
        this.syncInterval = setInterval(() => {
            this.syncToCloud();
        }, 30000);
    },

    // Stop periodic sync
    stopPeriodicSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    },

    // Save data and sync
    async saveAndSync(key, data) {
        // Save locally first
        Storage.set(key, data);

        // Then sync to cloud if enabled
        if (this.isEnabled && this.currentUser) {
            await this.syncToCloud();
        }
    },

    // Get error message
    getErrorMessage(error) {
        const errorMessages = {
            'auth/email-already-in-use': 'Email already registered. Please login.',
            'auth/invalid-email': 'Invalid email format.',
            'auth/weak-password': 'Password must be at least 6 characters.',
            'auth/user-not-found': 'No account found with this email.',
            'auth/wrong-password': 'Incorrect password.',
            'auth/too-many-requests': 'Too many attempts. Please try again later.',
            'auth/network-request-failed': 'Network error. Check your connection.'
        };

        return errorMessages[error.code] || error.message || 'An error occurred';
    },

    // Check if user is logged in
    isLoggedIn() {
        if (!this.isEnabled) return false;
        return this.currentUser !== null;
    },

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }
};
