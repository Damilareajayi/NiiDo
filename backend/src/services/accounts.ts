import crypto from "crypto";
import admin from "firebase-admin";
import { db, Timestamp } from "../firebase";

export function generatePassword() {
  return crypto.randomBytes(6).toString("base64url"); // ~8 chars, URL-safe
}

export async function createStudentAccount(schoolId: string, data: {
  name: string;
  grade: string;
  gender?: "male" | "female" | "other";
  age?: number;
  language?: string;
  email?: string;
  teacherId?: string;
}) {
  const password = generatePassword();
  const email = data.email
    || `${data.name.toLowerCase().replace(/[^a-z0-9]/g, "")}.${crypto.randomBytes(3).toString("hex")}@students.niido.app`;

  const userRecord = await admin.auth().createUser({
    email,
    password,
    displayName: data.name,
  });

  const studentDoc = {
    role: "student",
    schoolId,
    name: data.name,
    email,
    grade: data.grade,
    ...(data.gender ? { gender: data.gender } : {}),
    ...(data.age !== undefined ? { age: data.age } : {}),
    ...(data.teacherId ? { teacherId: data.teacherId } : {}),
    language: data.language || "en",
    createdAt: Timestamp.now(),
    lastActive: Timestamp.now(),
    // No payment processor wired up yet — always starts "free" until manually
    // upgraded (see backend/scripts/set-premium.ts) or real billing lands.
    subscriptionTier: "free",
  };

  await Promise.all([
    db.collection("users").doc(userRecord.uid).set(studentDoc),
    db.collection("students").doc(userRecord.uid).set(studentDoc, { merge: true }),
  ]);

  return { uid: userRecord.uid, email, temporaryPassword: password };
}
