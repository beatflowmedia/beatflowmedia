import { PLACEHOLDER_IMAGE } from '../utils/placeholders';
// src/data/artistData.js
export const artistData = {
  name: "Lalah Hathaway",
  cover: PLACEHOLDER_IMAGE,
  monthlyListeners: 5501001,
  biography:
    "Since making her debut, Lalah Hathaway has consistently held the top spot on contemporary jazz charts...",
  credits: [
    { name: "Boney James", role: "Main Artist, Composer, Producer" },
    { name: "Lalah Hathaway", role: "Main Artist" },
    { name: "Jairus Mozee", role: "Composer" },
  ],
  onTour: [
    {
      date: "Apr 2",
      location: "North Bethesda",
      venue: "The Music Center at Strathmore"
    },
    {
      date: "Apr 3",
      location: "Richmond",
      venue: "The National"
    },
  ],
  nextInQueue: {
    title: "Forever, For Always, For Love",
    artist: "Lalah Hathaway",
    cover: PLACEHOLDER_IMAGE
  }
};
