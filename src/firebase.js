import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// ── Internal app Firebase (data source) ─────────────────────
const internalConfig = {
  apiKey:            import.meta.env.VITE_INTERNAL_API_KEY,
  authDomain:        import.meta.env.VITE_INTERNAL_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_INTERNAL_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_INTERNAL_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_INTERNAL_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_INTERNAL_APP_ID,
};

const internalApp = initializeApp(internalConfig, 'internal');
export const auth     = getAuth(internalApp);
export const db       = getFirestore(internalApp);
export const provider = new GoogleAuthProvider();
export default internalApp;
