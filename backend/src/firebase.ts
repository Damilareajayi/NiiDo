import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

let serviceAccount: any;

if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  try {
    let rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON.trim();
    let sanitizedJson = "";
    let inQuote = false;
    for (let i = 0; i < rawJson.length; i++) {
      const char = rawJson[i];
      if (char === "\"" && (i === 0 || rawJson[i - 1] !== "\\")) {
        inQuote = !inQuote;
        sanitizedJson += char;
      } else if (inQuote && (char === "\n" || char === "\r")) {
        sanitizedJson += "\\n";
        if (char === "\r" && rawJson[i + 1] === "\n") {
          i++;
        }
      } else {
        sanitizedJson += char;
      }
    }
    serviceAccount = JSON.parse(sanitizedJson);
  } catch (e: any) {
    throw new Error(`Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON: ${e.message}`);
  }
} else {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (!serviceAccountPath) {
    throw new Error("Either FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON is required");
  }

  const serviceAccountFullPath = path.isAbsolute(serviceAccountPath)
    ? serviceAccountPath
    : path.join(process.cwd(), serviceAccountPath);

  if (!fs.existsSync(serviceAccountFullPath)) {
    throw new Error(`Firebase service account file not found at ${serviceAccountFullPath}`);
  }

  serviceAccount = JSON.parse(fs.readFileSync(serviceAccountFullPath, "utf-8"));
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

export const db = process.env.FIRESTORE_DATABASE_ID
  ? getFirestore(process.env.FIRESTORE_DATABASE_ID)
  : getFirestore();
export const Timestamp = admin.firestore.Timestamp;
export default admin;
