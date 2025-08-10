# Firestore Setup Guide

## Prerequisites

1. **Google Cloud Project**: You need a Google Cloud Project with Firestore enabled
2. **Service Account**: Create a service account with appropriate permissions

## Step-by-Step Setup

### 1. Create a Firebase/Google Cloud Project

1. Go to [Firebase Console](https://console.firebase.google.com/) or [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable Firestore Database:
   - In Firebase Console: Go to "Firestore Database" → "Create database"
   - Choose "Start in production mode" or "Test mode" (you can change this later)
   - Select a location for your database

### 2. Create a Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "IAM & Admin" → "Service Accounts"
3. Click "Create Service Account"
4. Give it a name like "billfusion-firestore"
5. Grant the following roles:
   - **Cloud Datastore User** (for Firestore operations)
   - **Firebase Admin** (for Firebase operations)

### 3. Generate Service Account Key

1. Click on your newly created service account
2. Go to "Keys" tab
3. Click "Add Key" → "Create new key"
4. Choose "JSON" format
5. Download the JSON file (keep it secure!)

### 4. Configure Environment Variables

You have two options to configure Firebase credentials:

#### Option A: Using Service Account JSON (Recommended for Production)

1. Open the downloaded JSON file
2. Copy the entire content
3. In your `.env` file, add:
```bash
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project-id",...}
```
(Replace with your actual JSON content - all in one line)

#### Option B: Using Individual Environment Variables (Easier for Development)

Extract values from your JSON file and add to `.env`:
```bash
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account@your-project-id.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
```

### 5. Security Rules (Optional but Recommended)

In Firebase Console → Firestore Database → Rules, you can set up security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to all documents
    // Note: This is for development - use more restrictive rules in production
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

For production, implement proper user-based security rules.

### 6. Firestore Collections Structure

Your app will automatically create these collections:
- `users` - User profiles and authentication data
- `clients` - Client information
- `invoices` - Invoice data with embedded items
- `payments` - Payment records

## Testing the Connection

After setup, start your development server:
```bash
npm run dev
```

Check the console for any Firebase connection errors. If successful, you should see no Firebase-related error messages.

## Important Notes

1. **Never commit your service account JSON or private keys to version control**
2. **Use environment variables for all sensitive data**
3. **Set up proper Firestore security rules for production**
4. **Consider using Firebase emulator for development**
5. **Monitor your Firestore usage and billing**

## Troubleshooting

### Common Issues:

1. **"Failed to initialize Firebase"**: Check your service account JSON or environment variables
2. **Permission denied**: Ensure your service account has the correct roles
3. **Private key format errors**: Make sure private key includes proper newlines (`\n`)

### Debug Steps:
1. Verify all environment variables are loaded correctly
2. Check that your project ID matches your Firebase project
3. Ensure Firestore is enabled in your Firebase project
4. Verify service account permissions in Google Cloud Console