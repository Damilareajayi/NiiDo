// Manually flip an account's subscriptionTier until real Stripe billing exists.
// Usage: npx ts-node scripts/set-premium.ts <email> <free|premium>
import "dotenv/config";
import admin from "firebase-admin";
import * as path from "path";

const serviceAccountPath = path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH || "./firebase-service-account.json");
admin.initializeApp({ credential: admin.credential.cert(require(serviceAccountPath)) });
const db = admin.firestore();

async function main() {
  const [, , email, tierArg] = process.argv;
  const tier = tierArg === "premium" ? "premium" : "free";

  if (!email) {
    console.error("Usage: npx ts-node scripts/set-premium.ts <email> <free|premium>");
    process.exit(1);
  }

  const user = await admin.auth().getUserByEmail(email);
  await db.collection("users").doc(user.uid).update({ subscriptionTier: tier });

  console.log(`Set ${email} (${user.uid}) to subscriptionTier: "${tier}"`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
