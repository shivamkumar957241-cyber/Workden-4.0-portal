import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCe-rpOm26-rKWO4BaAnHdMknGWj34IczE",
  authDomain: "workden-4o-portal.firebaseapp.com",
  projectId: "workden-4o-portal",
  storageBucket: "workden-4o-portal.firebasestorage.app",
  messagingSenderId: "813003691431",
  appId: "1:813003691431:web:23ac4c63154d26d106d282",
  measurementId: "G-E6XB96N7D0"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
    const snap = await getDocs(collection(db, "Holiday"));
    console.log("Holidays:", snap.docs.map(d => d.data()));
    process.exit(0);
}
run();
