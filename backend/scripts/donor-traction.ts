// Read-only script to compile live NiiDo platform metrics for donor pitches and investor presentations.
// Usage: npx ts-node scripts/donor-traction.ts
import "dotenv/config";
import admin from "firebase-admin";
import * as path from "path";

const serviceAccountPath = path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH || "./firebase-service-account.json");
admin.initializeApp({ credential: admin.credential.cert(require(serviceAccountPath)) });
const db = admin.firestore();

async function main() {
  console.log("⚡ Compiling Live NiiDo Donor Traction Metrics...\n");

  const [usersSnap, studentsSnap, lessonsSnap, schoolsSnap] = await Promise.all([
    db.collection("users").get(),
    db.collection("students").get(),
    db.collection("lessons").get(),
    db.collection("schools").get(),
  ]);

  // Aggregate user roles
  let studentsCount = 0;
  let teachersCount = 0;
  let adminsCount = 0;
  usersSnap.forEach((doc) => {
    const data = doc.data();
    if (data.role === "student") studentsCount++;
    if (data.role === "teacher") teachersCount++;
    if (data.role === "admin") adminsCount++;
  });

  // Compile a clean markdown report
  const report = `
# 📊 NIIDO LIVE TRACTION REPORT
*Generated on: ${new Date().toLocaleDateString()}*

---

## 🚀 1. USER REACH & ACQUISITION
*   **Total Registered Users:** ${usersSnap.size}
*   **Student Accounts:** ${studentsCount}
*   **Teacher Accounts:** ${teachersCount}
*   **School Administrators:** ${adminsCount}

## 🧠 2. COGNITIVE DIAGNOSTICS (NiiDo Read)
*   **Completed LearnerDNA Profiles:** ${studentsSnap.size}
*   *This represents the number of children who now have an individualized, strength-based learning profile.*

## 📚 3. TEACHER ENGAGEMENT (NiiDo Teach)
*   **Total Lesson Plans Generated:** ${lessonsSnap.size}
*   *Assuming an average of 45 minutes saved per lesson plan, NiiDo has saved teachers approximately ${Math.round((lessonsSnap.size * 45) / 60)} hours of administrative prep work.*

## 🏫 4. B2B PIPELINE (Schools)
*   **Registered Schools:** ${schoolsSnap.size}

---
*Developed for the Mastercard Foundation Inclusive EdTech Innovation Cohort*
  `;

  console.log(report);
}

main().catch((err) => {
  console.error(`Error compiling metrics: ${err.message}`);
  process.exit(1);
});
