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

const withdrawalsData = [
  { 
    name: "Kishan Meena", mobile: "9511553351", amount: 500, 
    method: "UPI", upi_id: "95115533351@ybl", utr: "195816088282" 
  },
  { 
    name: "Praveen Sharma (Entry 1)", mobile: "9887213928", amount: 500, 
    method: "UPI", upi_id: "9887213928@ybl", utr: "205419493868" 
  },
  { 
    name: "Ajay Gocher", mobile: "7023953522", amount: 700, 
    method: "UPI", upi_id: "7849947895@ybl", utr: "205149670799" 
  },
  { 
    name: "Praveen Sharma (Entry 2)", mobile: "9887213928", amount: 500, 
    method: "Bank Transfer", bank_name: "ICICI Bank", account_holder: "Praveen Sharma", 
    account_number: "687401415767", ifsc_code: "ICIC0006874", utr: "616215974736" 
  },
  { 
    name: "Tamanna Jethi", mobile: "7737327745", amount: 1000, 
    method: "UPI", upi_id: "7737327745@ybl", utr: "" 
  }
];

async function processWithdrawals() {
  for (const wd of withdrawalsData) {
    console.log(`Processing withdrawal for ${wd.name} (${wd.mobile})...`);
    let userDocRef = null;
    let userData = null;
    let isAppUser = true;
    
    // Fetch by phone
    let q = query(collection(db, "AppUser"), where("phone", "==", wd.mobile));
    let snap = await getDocs(q);
    if (snap.empty) {
      q = query(collection(db, "User"), where("mobile", "==", wd.mobile));
      snap = await getDocs(q);
      if (!snap.empty) {
        userDocRef = doc(db, "User", snap.docs[0].id);
        userData = { id: snap.docs[0].id, ...snap.docs[0].data() };
        isAppUser = false;
      } else {
        q = query(collection(db, "User"), where("phone", "==", wd.mobile));
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
      console.log(`  => User ${wd.mobile} NOT FOUND!`);
      continue;
    }

    // 1. Create WithdrawalRequest
    const withdrawalPayload = {
      user_id: userData.id,
      amount: wd.amount,
      method: wd.method,
      status: "completed",
      txn_id: wd.utr,
      requested_date: new Date().toISOString(),
      approved_date: new Date().toISOString(),
      user_name: userData.full_name,
      user_email: userData.email || userData.login_user_id
    };

    if (wd.method === "UPI") {
      withdrawalPayload.upi_id = wd.upi_id;
    } else if (wd.method === "Bank Transfer") {
      withdrawalPayload.bank_name = wd.bank_name;
      withdrawalPayload.account_holder = wd.account_holder;
      withdrawalPayload.account_number = wd.account_number;
      withdrawalPayload.ifsc_code = wd.ifsc_code;
    }

    await addDoc(collection(db, "WithdrawalRequest"), withdrawalPayload);
    console.log(`  => Added WithdrawalRequest (₹${wd.amount})`);

    // 2. Add WalletTransaction for debit
    await addDoc(collection(db, "WalletTransaction"), {
      user_id: userData.id,
      user_name: userData.full_name,
      amount: wd.amount,
      type: "debit",
      reason: "Withdrawal processed",
      timestamp: new Date().toISOString()
    });

    // 3. Update User Balance & total_withdrawals
    const currentBalance = Number(userData.wallet_balance || 0);
    const newBalance = Math.max(0, currentBalance - wd.amount);
    const currentTotalWd = Number(userData.total_withdrawals || 0);
    const newTotalWd = currentTotalWd + wd.amount;

    await updateDoc(userDocRef, { 
      wallet_balance: newBalance.toString(),
      total_withdrawals: newTotalWd 
    });

    // We must update userData object for Praveen's 2nd entry (wallet balance mutates)
    userData.wallet_balance = newBalance;
    userData.total_withdrawals = newTotalWd;

    console.log(`  => Deducted ₹${wd.amount}. New Balance: ₹${newBalance}. Total Wd: ₹${newTotalWd}`);
  }
  
  console.log("All done!");
  process.exit(0);
}

processWithdrawals().catch(e => {
  console.error(e);
  process.exit(1);
});
