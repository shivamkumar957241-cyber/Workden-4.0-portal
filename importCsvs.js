import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc } from "firebase/firestore";
import fs from "fs";
import path from "path";
import csv from "csv-parser";

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

const FOLDER_PATH = path.join(process.cwd(), "New folder 1");

const parseValue = (val) => {
  if (val === "true") return true;
  if (val === "false") return false;
  if (val === "null" || val === "") return null;
  // Try to parse JSON arrays like "[]"
  if (val.startsWith("[") && val.endsWith("]")) {
    try {
      return JSON.parse(val);
    } catch (e) {
      return val;
    }
  }
  // Try to parse JSON objects
  if (val.startsWith("{") && val.endsWith("}")) {
    try {
      return JSON.parse(val);
    } catch (e) {
      return val;
    }
  }
  // If it's a pure number string, parse to number? Nah, some IDs are numbers. Let's keep strings unless it's obviously something else.
  // Wait, wallet_balance, total_earnings are numbers.
  if (!isNaN(val) && val.trim() !== "") {
     // If it's a huge ID string like "8107732960", it's safer to keep as string if it might be a phone number.
     // Let's only convert to number if the key explicitly suggests it or we just keep it as string since javascript is loose.
     // Actually, let's keep all numbers as strings except if they have decimals, maybe? 
     // Let's just keep them as strings to avoid breaking things, base44 handles some conversions, but we are bypassing base44.
  }
  return val;
};

async function processFile(filePath, collectionName) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => {
        const parsedData = {};
        for (const key in data) {
          parsedData[key] = parseValue(data[key]);
        }
        results.push(parsedData);
      })
      .on("end", async () => {
        console.log(`Uploading ${results.length} records to ${collectionName}...`);
        try {
          let count = 0;
          for (const row of results) {
            const id = row.id; // Use existing ID if present
            if (id) {
              await setDoc(doc(db, collectionName, id), row);
            } else {
              // If no id, just use collection to generate one, but wait we need setDoc to doc()
              const newRef = doc(collection(db, collectionName));
              await setDoc(newRef, row);
            }
            count++;
          }
          console.log(`✅ Finished ${collectionName}: ${count} records.`);
          resolve();
        } catch (error) {
          console.error(`❌ Error uploading to ${collectionName}:`, error);
          reject(error);
        }
      })
      .on("error", (error) => {
         console.error(`Error reading ${filePath}:`, error);
         reject(error);
      });
  });
}

async function run() {
  if (!fs.existsSync(FOLDER_PATH)) {
    console.error(`Folder not found: ${FOLDER_PATH}`);
    process.exit(1);
  }

  const files = fs.readdirSync(FOLDER_PATH).filter(f => f.endsWith(".csv"));
  console.log(`Found ${files.length} CSV files to process.`);

  for (const file of files) {
    let collectionName = file.split("_export")[0];
    // Clean up any "(1)" or spaces from filename
    collectionName = collectionName.split(" ")[0]; 
    const filePath = path.join(FOLDER_PATH, file);
    
    console.log(`\nProcessing ${file} -> Collection: ${collectionName}`);
    await processFile(filePath, collectionName);
  }

  console.log("\n🎉 All CSV files have been processed and uploaded to Firestore!");
  process.exit(0);
}

run();
