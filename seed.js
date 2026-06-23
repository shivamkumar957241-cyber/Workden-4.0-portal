import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, query, where, updateDoc, doc } from "firebase/firestore";

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
  try {
    console.log("Seeding tasks...");
    const tasksToSeed = [
      { name: "Data Entry", description: "Complete data entry tasks", reward: 100, page_route: "/DataEntry" },
      { name: "Form Filling", description: "Complete form filling tasks", reward: 150, page_route: "/FormFilling" },
      { name: "PDF to Word Typing", description: "Type PDF documents into Word format", reward: 200, page_route: "/PdfToWordTyping" },
      { name: "Grammar Correction", description: "Correct grammar in provided text", reward: 120, page_route: "/GrammarCorrection" },
    ];

    // Check if tasks already exist
    const taskSnapshot = await getDocs(collection(db, "Task"));
    if (taskSnapshot.empty) {
      for (const task of tasksToSeed) {
        await addDoc(collection(db, "Task"), { ...task, created_at: new Date().toISOString() });
        console.log(`Created task: ${task.name}`);
      }
    } else {
      console.log("Tasks already exist, skipping.");
    }

    console.log("Activating subscription for shivam...");
    
    // Check in User collection
    const userQ = query(collection(db, "User"), where("login_user_id", "==", "shivam"));
    const userSnapshot = await getDocs(userQ);
    
    let found = false;
    userSnapshot.forEach(async (d) => {
      await updateDoc(doc(db, "User", d.id), { is_subscribed: true, role: "admin" });
      console.log("Updated in User collection!");
      found = true;
    });

    if (!found) {
      // Also check by user_id
      const userQ2 = query(collection(db, "User"), where("user_id", "==", "shivam"));
      const userSnap2 = await getDocs(userQ2);
      userSnap2.forEach(async (d) => {
        await updateDoc(doc(db, "User", d.id), { is_subscribed: true, role: "admin" });
        console.log("Updated in User collection (by user_id)!");
        found = true;
      });
    }

    // Check in AppUser collection
    const appUserQ = query(collection(db, "AppUser"), where("login_user_id", "==", "shivam"));
    const appUserSnap = await getDocs(appUserQ);
    appUserSnap.forEach(async (d) => {
      await updateDoc(doc(db, "AppUser", d.id), { is_subscribed: true, role: "admin" });
      console.log("Updated in AppUser collection!");
      found = true;
    });

    if (!found) {
        // Just create an admin user for Shivam
        console.log("User shivam not found, creating a new AppUser for shivam...");
        await addDoc(collection(db, "AppUser"), {
            full_name: "Shivam Admin",
            login_user_id: "shivam",
            login_password: "995567",
            role: "admin",
            is_subscribed: true,
            created_date: new Date().toISOString()
        });
        console.log("Created admin user shivam!");
    }

    console.log("Done!");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

run();
