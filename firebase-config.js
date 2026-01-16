// ===== Firebase Configuration =====
// This file contains Firebase setup for cloud synchronization

// Firebase configuration
// IMPORTANT: Replace these with your actual Firebase project credentials
// Get them from: https://console.firebase.google.com
const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Check if Firebase is configured
const isFirebaseConfigured = () => {
    return firebaseConfig.apiKey !== "YOUR_API_KEY_HERE";
};

// Initialize Firebase (if configured)
let app, auth, db;

if (isFirebaseConfigured() && typeof firebase !== 'undefined') {
    try {
        app = firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        db = firebase.firestore();
        
        // Enable offline persistence
        db.enablePersistence()
            .catch((err) => {
                if (err.code === 'failed-precondition') {
                    console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
                } else if (err.code === 'unimplemented') {
                    console.warn('The current browser doesn\'t support persistence.');
                }
            });
        
        console.log('✅ Firebase initialized successfully!');
    } catch (error) {
        console.error('Firebase initialization error:', error);
    }
} else {
    console.log('ℹ️ Firebase not configured. Using local storage only.');
}

// Export for use in other modules
window.FirebaseConfig = {
    app,
    auth,
    db,
    isConfigured: isFirebaseConfigured()
};
