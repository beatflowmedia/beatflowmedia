const fs = require("fs");
const path = require("path");

const musicFolder = path.join(__dirname, "../public/music"); // Absolute path to music folder
const imagesFolder = path.join(__dirname, "../public/images"); // Absolute path to images folder
const outputFile = path.join(__dirname, "../src/musicData.json"); // JSON output location

console.log("📂 Music folder absolute path:", musicFolder);
console.log("📂 Images folder absolute path:", imagesFolder);
console.log("📂 Output file path:", outputFile);

// Default values for fields (dummy data for missing fields)
const defaultBiography = "No biography available.";
const defaultCredits = [];
const defaultOnTour = [];
const defaultNextInQueue = null;
const defaultVideoSrc = null;
const defaultVideoPoster = null;

// Other default values (as requested)
const defaultArtist = "Beat Flow";          // Changed default artist
const defaultCover = "/images/Logo.png";       // Changed default cover image
const defaultCategory = "R&B";

const generateMusicData = () => {
  // Ensure the music folder exists
  if (!fs.existsSync(musicFolder)) {
    console.log("❌ Music folder not found! Creating it...");
    try {
      fs.mkdirSync(musicFolder, { recursive: true });
      console.log("✅ Music folder created.");
    } catch (err) {
      console.error("❌ Error creating music folder:", err);
      return;
    }
  }

  let musicFiles;
  try {
    musicFiles = fs.readdirSync(musicFolder).filter((file) => file.endsWith(".mp3"));
  } catch (err) {
    console.error("❌ Error reading music folder:", err);
    return;
  }
  console.log("🎵 Found MP3 files:", musicFiles);

  if (musicFiles.length === 0) {
    console.log("⚠️ No MP3 files found in /public/music!");
    return;
  }

  // Read existing music data if the file exists (handle empty file gracefully)
  let existingMusicData = [];
  if (fs.existsSync(outputFile)) {
    try {
      const data = fs.readFileSync(outputFile, "utf8");
      existingMusicData = data.trim() ? JSON.parse(data) : [];
      console.log("✅ Existing music data loaded. Total songs:", existingMusicData.length);
    } catch (err) {
      console.error("❌ Error reading or parsing existing music data:", err);
      existingMusicData = [];
    }
  } else {
    console.log("ℹ️ No existing musicData.json found. A new one will be created.");
  }

  // Build a map of existing songs by fileName for quick lookup
  const existingSongsMap = new Map();
  existingMusicData.forEach((song) => {
    if (song.fileName) {
      existingSongsMap.set(song.fileName, song);
    }
  });

  // Generate new song data from found MP3 files, including all fields with dummy data
  const newSongs = musicFiles.map((file) => {
    const title = path.basename(file, path.extname(file)); // Remove .mp3 extension

    // Check if an image exists for this song in /public/images/
    const imageFile = path.join(imagesFolder, `${title}.jpg`);
    let cover = defaultCover;
    try {
      if (fs.existsSync(imageFile)) {
        cover = `/images/${title}.jpg`;
      }
    } catch (err) {
      console.error("❌ Error checking for image file:", err);
    }

    const songData = {
      id: null, // We'll assign IDs later
      title: title,
      artist: defaultArtist,
      fileName: file,
      cover: cover,
      category: defaultCategory,
      biography: defaultBiography,
      credits: defaultCredits,
      onTour: defaultOnTour,
      nextInQueue: defaultNextInQueue,
      videoSrc: defaultVideoSrc,
      videoPoster: defaultVideoPoster,
    };

    // Only add the new song if it doesn't already exist (by fileName)
    return !existingSongsMap.has(file) ? songData : null;
  }).filter(Boolean);

  console.log("🎵 New songs to add:", newSongs.length);

  // Update existing songs: add missing fields with dummy data if they don't exist
  const updatedExistingSongs = existingMusicData.map((song) => ({
    ...song,
    biography: song.biography || defaultBiography,
    credits: song.credits !== undefined ? song.credits : defaultCredits,
    onTour: song.onTour !== undefined ? song.onTour : defaultOnTour,
    nextInQueue: song.nextInQueue !== undefined ? song.nextInQueue : defaultNextInQueue,
    videoSrc: song.videoSrc !== undefined ? song.videoSrc : defaultVideoSrc,
    videoPoster: song.videoPoster !== undefined ? song.videoPoster : defaultVideoPoster,
  }));

  // Combine updated existing songs with new songs
  let finalMusicData = [...updatedExistingSongs, ...newSongs];

  // Reassign IDs sequentially by sorting the array by some stable criterion (e.g. fileName)
  // Then map over the sorted array to assign new IDs
  finalMusicData.sort((a, b) => a.fileName.localeCompare(b.fileName));
  finalMusicData = finalMusicData.map((song, index) => ({
    ...song,
    id: index + 1,
  }));

  try {
    fs.writeFileSync(outputFile, JSON.stringify(finalMusicData, null, 2), "utf8");
    console.log(`✅ musicData.json updated. Total songs now: ${finalMusicData.length}`);
  } catch (err) {
    console.error("❌ Error writing to musicData.json:", err);
  }
};

generateMusicData();
