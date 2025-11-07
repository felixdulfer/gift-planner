# Firestore Security Rules Setup

The error "Missing or insufficient permissions" occurs because Firestore security rules need to be configured.

## Quick Fix

1. **Go to Firebase Console**: https://console.firebase.google.com
2. **Select your project**
3. **Go to Firestore Database → Rules**
4. **Copy and paste the contents of `firestore.rules`**
5. **Click "Publish"**

## Deploy Rules via CLI (Alternative)

If you have Firebase CLI installed:

```bash
firebase deploy --only firestore:rules
```

## Temporary Test Mode (Development Only)

For development/testing, you can temporarily use these permissive rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**⚠️ WARNING**: These rules allow any authenticated user to read/write everything. Only use for development!

## Production Rules

The `firestore.rules` file contains production-ready rules that:
- Allow users to create/update their own user document
- Restrict group access to creators and members
- Enforce proper permissions for all collections

After deploying the rules, try registering again.

