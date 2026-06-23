import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs } from "firebase/firestore";

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

const holidaysToSeed = [
  { holiday_name: "New Year", holiday_date: "2026-01-01", message: "Happy New Year! Platform is closed today.", emoji: "🎆", is_active: true },
  { holiday_name: "Republic Day", holiday_date: "2026-01-26", message: "Happy Republic Day! Platform is closed today.", emoji: "🇮🇳", is_active: true },
  { holiday_name: "Holi", holiday_date: "2026-03-03", message: "Happy Holi! Platform is closed today.", emoji: "🎨", is_active: true },
  { holiday_name: "Independence Day", holiday_date: "2026-08-15", message: "Happy Independence Day! Platform is closed today.", emoji: "🇮🇳", is_active: true },
  { holiday_name: "Gandhi Jayanti", holiday_date: "2026-10-02", message: "Happy Gandhi Jayanti! Platform is closed today.", emoji: "🕊️", is_active: true },
  { holiday_name: "Diwali", holiday_date: "2026-11-08", message: "Happy Diwali! Platform is closed today.", emoji: "🪔", is_active: true },
  { holiday_name: "Christmas", holiday_date: "2026-12-25", message: "Merry Christmas! Platform is closed today.", emoji: "🎄", is_active: true }
];

async function run() {
  console.log("Seeding holidays...");
  const snap = await getDocs(collection(db, "Holiday"));
  if (!snap.empty) {
    console.log("Holidays already exist. Skipping seed.");
    process.exit(0);
  }

  for (const h of holidaysToSeed) {
    await addDoc(collection(db, "Holiday"), { ...h, created_date: new Date().toISOString() });
    console.log(`Created holiday: ${h.holiday_name}`);
  }
  console.log("Done!");
  process.exit(0);
}

run();
