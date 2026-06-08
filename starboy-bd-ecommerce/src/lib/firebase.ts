import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCUIN5oRpr47c4JjK-8e_efta_Weh60Akc",
  authDomain: "dg-hub-841e8.firebaseapp.com",
  projectId: "dg-hub-841e8",
  storageBucket: "dg-hub-841e8.firebasestorage.app",
  messagingSenderId: "176161341119",
  appId: "1:176161341119:web:bc0f787e2ccabb5ba2100a"
};


let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;

// Only initialize Firebase if we're in the browser and config is present.
// During SSR/build we leave them undefined so prerendering never crashes.
if (typeof window !== "undefined" && firebaseConfig.apiKey) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
}

export { app, auth, db, storage }
