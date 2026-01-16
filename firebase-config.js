// ===== Firebase Configuration =====
// This file contains Firebase setup for cloud synchronization

// DEMO MODE: App works without Firebase!
// To enable cloud sync, replace these values with YOUR Firebase credentials
// Get them from: https://console.firebase.google.com

const firebaseConfig = {
    // REPLACE THESE WITH YOUR FIREBASE PROJECT CREDENTIALS:
    apiKey: "DEMO-KEY-REPLACE-WITH-YOUR-FIREBASE-API-KEY",
    authDomain: "DEMO-PROJECT.firebaseapp.com",
    projectId: "DEMO-PROJECT-ID",
    storageBucket: "DEMO-PROJECT.appspot.com",
    messagingSenderId: "000000000000",
    appId: "1:000000000000:web:demo123456789"
};


// Check if Firebase is configured
const isFirebaseConfigured = () => {
    return firebaseConfig.apiKey !== "DEMO-KEY-REPLACE-WITH-YOUR-FIREBASE-API-KEY" 
        && !firebaseConfig.apiKey.includes("DEMO");
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
