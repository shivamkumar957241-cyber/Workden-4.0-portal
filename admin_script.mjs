import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where, addDoc, updateDoc, doc } from "firebase/firestore";

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

const usersData = [
  { name: "Praveen Sharma", mobile: "9887213928", tasks: 13, amount: 1300 },
  { name: "Tamanna Jethi", mobile: "7737327745", tasks: 11, amount: 1100 },
  { name: "Ajay Gocher", mobile: "7023953522", tasks: 7, amount: 700 },
  { name: "Kishan Meena", mobile: "9511553351", tasks: 5, amount: 500 },
  { name: "Abhishek Nayak", mobile: "8529717511", tasks: 1, amount: 100 },
  { name: "Abhishek Kumar Singh", mobile: "6378250488", tasks: 1, amount: 100 }
];

async function processUsers() {
  for (const ud of usersData) {
    console.log(`Processing ${ud.name} (${ud.mobile})...`);
    let userDocRef = null;
    let userData = null;
    let isAppUser = true;
    
    // Check AppUser by phone
    let q = query(collection(db, "AppUser"), where("phone", "==", ud.mobile));
    let snap = await getDocs(q);
    if (snap.empty) {
      // Check User by mobile
      q = query(collection(db, "User"), where("mobile", "==", ud.mobile));
      snap = await getDocs(q);
      if (!snap.empty) {
        userDocRef = doc(db, "User", snap.docs[0].id);
        userData = { id: snap.docs[0].id, ...snap.docs[0].data() };
        isAppUser = false;
      } else {
        // Fallback: check User by phone
        q = query(collection(db, "User"), where("phone", "==", ud.mobile));
        snap = await getDocs(q);
        if (!snap.empty) {
          userDocRef = doc(db, "User", snap.docs[0].id);
          userData = { id: snap.docs[0].id, ...snap.docs[0].data() };
          isAppUser = false;
        }
      }
    } else {
      userDocRef = doc(db, "AppUser", snap.docs[0].id);
      userData = { id: snap.docs[0].id, ...snap.docs[0].data() };
    }

    if (!userData) {
      console.log(`  => User ${ud.mobile} NOT FOUND!`);
      continue;
    }

    console.log(`  => Found user: ${userData.id}`);

    // Add approved tasks to Proof collection
    for (let i = 1; i <= ud.tasks; i++) {
      // Task name from "Task 1 to Task 3" => i%3 + 1
      const taskNum = (i % 3) || 3;
      const baseName = i % 2 === 0 ? `Data Entry` : `Form Filling`;
      const taskName = `${baseName} Task ${taskNum}`;
      
      const proofData = {
        user_id: userData.id,
        user_id_number: userData.user_id || userData.login_user_id,
        user_name: userData.full_name,
        work_type: taskName,
        status: "approved",
        created_date: new Date().toISOString(),
        reviewed_at: new Date().toISOString()
      };
      await addDoc(collection(db, "Proof"), proofData);
    }
    console.log(`  => Added ${ud.tasks} approved tasks`);

    // Credit wallet
    const currentBalance = Number(userData.wallet_balance || 0);
    const newBalance = currentBalance + ud.amount;
    
    await updateDoc(userDocRef, { wallet_balance: newBalance.toString() }); // store as string just in case
    
    await addDoc(collection(db, "WalletTransaction"), {
      user_id: userData.id,
      user_name: userData.full_name,
      amount: ud.amount,
      type: "credit",
      reason: `Bulk task approval credit (${ud.tasks} tasks)`,
      timestamp: new Date().toISOString()
    });

    console.log(`  => Credited ₹${ud.amount}. New Balance: ₹${newBalance}`);
  }
  
  console.log("All done!");
  process.exit(0);
}

processUsers().catch(e => {
  console.error(e);
  process.exit(1);
});
