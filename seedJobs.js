const admin = require("firebase-admin");
const jobs = require("./jobs.json");

// Initialize with your service account key
admin.initializeApp({
  credential: admin.credential.cert(require("./serviceAccountKey.json"))
});

const db = admin.firestore();

async function seedJobs() {
  for (const job of jobs) {
    // Create a document with a generated id
    await db.collection("jobs").add(job);
    console.log(`Added job: ${job.title}`);
  }
  console.log("All jobs seeded!");
  process.exit();
}

seedJobs();
