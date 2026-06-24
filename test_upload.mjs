import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const processEnv = {};
env.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v) processEnv[k.trim()] = v.join('=').trim();
});

const firebaseConfig = {
  apiKey: processEnv.VITE_FIREBASE_API_KEY,
  authDomain: processEnv.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: processEnv.VITE_FIREBASE_PROJECT_ID,
  storageBucket: processEnv.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: processEnv.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: processEnv.VITE_FIREBASE_APP_ID,
  measurementId: processEnv.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

async function test() {
  try {
    console.log("Uploading...");
    const storageRef = ref(storage, `banners/test.txt`);
    await uploadString(storageRef, "hello world");
    const url = await getDownloadURL(storageRef);
    console.log("Success:", url);
  } catch (err) {
    console.error("Error:", err);
  }
}
test();
