import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  doc, 
  getDocFromServer 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

let db;
try {
  // Initialize with robust persistent local cache for multi-tab environments and connect to the correct database instance
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  }, firebaseConfig.firestoreDatabaseId);
} catch (e) {
  console.warn('Failed to initialize Firestore with persistent multi-tab cache, falling back to default:', e);
  db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
}

export { db };
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Test Connection
async function testConnection() {
  try {
    // Wrap with a race-promise to prevent long-hanging operations on load
    const testPromise = getDocFromServer(doc(db, 'test', 'connection'));
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('connection timeout')), 2500));
    
    await Promise.race([testPromise, timeoutPromise]);
  } catch (error) {
    console.warn("Firestore connection check: operating in offline mode.", error instanceof Error ? error.message : error);
  }
}
testConnection();

export { signInWithPopup, signOut };

