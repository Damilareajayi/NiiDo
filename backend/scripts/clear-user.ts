// Manually delete a user from Firebase Auth and Firestore to allow clean testing of onboarding flows.
// Usage: npx ts-node scripts/clear-user.ts <email>
import "dotenv/config";
import admin from "firebase-admin";
import * as path from "path";

const serviceAccountPath = path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH || "./firebase-service-account.json");
admin.initializeApp({ credential: admin.credential.cert(require(serviceAccountPath)) });
const db = admin.firestore();

async function main() {
  const [, , email] = process.argv;

  if (!email) {
    console.error("Usage: npx ts-node scripts/clear-user.ts <email>");
    process.exit(1);
  }

  try {
    const user = await admin.auth().getUserByEmail(email);
    const uid = user.uid;

    // Delete from Firebase Authentication
    await admin.auth().deleteUser(uid);
    console.log(`Deleted Firebase Auth user: ${email} (${uid})`);

    // Delete from Firestore "users" collection
    await db.collection("users").doc(uid).delete();
    console.log(`Deleted doc users/${uid}`);

    // Delete from Firestore "students" collection
    await db.collection("students").doc(uid).delete();
    console.log(`Deleted doc students/${uid}`);

    console.log(`\nSuccessfully cleared all user records for ${email}! You can now sign up again from scratch.`);
  } catch (err: any) {
    console.error(`\nError: ${err.message}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
