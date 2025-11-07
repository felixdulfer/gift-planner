# Development Mode

Run the development server:

```bash
bun run dev
```

This will:
- Start the Vite dev server with hot module replacement (HMR)
- Connect to your Firebase project for backend services
- Enable live reloading of source code changes

## Prerequisites

1. **Firebase Project**: Create a project at https://console.firebase.google.com
2. **Environment Variables**: Set up your `.env` file with Firebase credentials:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

## Usage

1. **Start dev server:**
   ```bash
   bun run dev
   ```

2. **Access the app:**
   - Frontend: http://localhost:3000

## Hot Reload

- **Frontend**: Changes to source files will trigger Vite HMR (Hot Module Replacement)
- **Firebase**: Changes to Firestore data will be reflected immediately (real-time updates)

## Environment Variables

Set the following in your `.env` file:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

You can find these values in your Firebase project dashboard:
1. Go to https://console.firebase.google.com
2. Select your project
3. Go to Project Settings → General
4. Scroll to "Your apps" section
5. Copy the configuration values

## Firebase Setup

This project uses Firebase for backend services. You'll need to:

1. Enable Authentication (Email/Password) in Firebase Console
2. Create a Firestore database
3. Configure Firestore security rules
4. Set up environment variables with your Firebase config

See the README.md for more details on setting up Firebase.
