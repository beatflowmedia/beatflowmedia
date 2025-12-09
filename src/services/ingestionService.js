// src/services/ingestionService.js
// Ingestion & Validation Agent: Handles upload, metadata, validation, and virus scan hooks
import { db } from "../firebaseConfig";
import { collection, addDoc } from "firebase/firestore";

// TODO: Add resumable upload, file validation, and virus scan integration
export async function uploadSongWithMetadata({
  title,
  artist,
  category,
  biography,
  credits,
  onTour,
  nextInQueueTitle,
  nextInQueueArtist,
  nextInQueueCover,
  videoSrc,
  videoPoster,
  musicFile,
  coverFile
}) {
  // Example: Construct metadata object
  const newSong = {
    title: title.trim(),
    artist: artist.trim() || "Unknown Artist",
    category,
    biography: biography.trim() || "No biography available.",
    credits: credits.trim()
      ? credits
          .split(",")
          .map((item) => ({ name: item.trim(), role: "Contributor" }))
      : [],
    onTour: onTour.trim()
      ? onTour.split(";").map((entry) => {
          const parts = entry.split(",");
          return {
            date: parts[0] ? parts[0].trim() : "",
            location: parts[1] ? parts[1].trim() : "",
            venue: parts[2] ? parts[2].trim() : ""
          };
        })
      : [],
    nextInQueue:
      nextInQueueTitle && nextInQueueArtist && nextInQueueCover
        ? {
            title: nextInQueueTitle.trim(),
            artist: nextInQueueArtist.trim(),
            cover: nextInQueueCover.trim()
          }
        : null,
    videoSrc: videoSrc.trim() || null,
    videoPoster: videoPoster.trim() || null,
    // For the files, we just store their names as placeholders.
    fileName: musicFile ? musicFile.name : "",
    cover: coverFile ? coverFile.name : ""
  };

  // TODO: Implement actual file upload to storage and get URLs
  // TODO: Integrate validation and virus scan before upload

  // Add the new song to the "songs" collection in Firestore
  await addDoc(collection(db, "songs"), newSong);
}
