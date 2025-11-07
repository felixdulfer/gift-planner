import { type FirebaseApp, getApps, initializeApp } from 'firebase/app'
import { type Auth, getAuth } from 'firebase/auth'
import { type Firestore, getFirestore } from 'firebase/firestore'

// Firebase configuration from environment variables
// Get these from Firebase Console: Project Settings → General → Your apps
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
}

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.warn(
        'Missing Firebase environment variables. Please set VITE_FIREBASE_API_KEY and VITE_FIREBASE_PROJECT_ID',
    )
    console.warn(
        'You can find these values in Firebase Console: Project Settings → General → Your apps',
    )
}

// Initialize Firebase (only if not already initialized)
export const app: FirebaseApp =
    getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

// Initialize Firebase services
export const auth: Auth = getAuth(app)
export const db: Firestore = getFirestore(app)
