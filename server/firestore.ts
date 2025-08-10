import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

dotenv.config({ path: './server/.env' });

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
  if (getApps().length === 0) {
    let serviceAccount;
    
    // Try to get service account from environment variable (JSON string)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      } catch (error) {
        console.error('Error parsing FIREBASE_SERVICE_ACCOUNT:', error);
      }
    }
    
    // Fallback to individual environment variables
    if (!serviceAccount && process.env.FIREBASE_PROJECT_ID) {
      serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
      };
    }

    if (!serviceAccount) {
      console.warn('⚠️  Firebase service account configuration not found. Using in-memory storage as fallback.');
      console.warn('   To use Firestore, please configure Firebase environment variables (see FIRESTORE_SETUP.md)');
      return null;
    }

    initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
  }
};

// Initialize Firebase and export Firestore instance
let db: any = null;
const initialized = initializeFirebase();
if (initialized) {
  try {
    db = getFirestore();
  } catch (error) {
    console.warn('⚠️  Failed to get Firestore instance:', error);
  }
}

export { db };