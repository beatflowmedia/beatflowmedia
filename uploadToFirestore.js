// uploadToFirestore.js (now in root)
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load service account from root
const serviceAccount = JSON.parse(
  fs.readFileSync(path.join(__dirname, "serviceAccountKey.json"), "utf-8")
);

// Load music data from src
const musicData = JSON.parse(
  fs.readFileSync(path.join(__dirname, "src", "musicData.json"), "utf-8")
);

// Init Firebase Admin
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const upload = async () => {
  const songsRef = db.collection("songs");

  for (const song of musicData) {
    try {
      await songsRef.add({
        ...song,
        status: "approved",
        source: "admin",
        submittedAt: new Date()
      });
      console.log(`✅ Uploaded: ${song.title}`);
    } catch (err) {
      console.error(`❌ Failed: ${song.title}`, err.message);
    }
  }
};

upload();
