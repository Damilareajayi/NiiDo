import admin from "firebase-admin";
import fs from "fs";
import path from "path";

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
if (!serviceAccountPath) {
  throw new Error("FIREBASE_SERVICE_ACCOUNT_PATH is required");
}

const serviceAccountFullPath = path.isAbsolute(serviceAccountPath)
  ? serviceAccountPath
  : path.join(process.cwd(), serviceAccountPath);

if (!fs.existsSync(serviceAccountFullPath)) {
  throw new Error(`Firebase service account file not found at ${serviceAccountFullPath}`);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountFullPath, "utf-8"));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

export const db = admin.firestore();
export const Timestamp = admin.firestore.Timestamp;
export default admin;
