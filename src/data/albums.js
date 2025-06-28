// Album data model and mock data
// This will be replaced with real data integration later

export const albums = [
  {
    id: "album-1",
    name: "Fading Sun",
    cover: "/images/Fading Sun.jpg",
    artist: "Percy Rice",
    releaseDate: "2023-08-15",
    songs: ["song-1", "song-2", "song-3"]
  },
  {
    id: "album-2",
    name: "Echoes of Forever",
    cover: "/images/Echoes of Forever.jpg",
    artist: "Darlene Rice",
    releaseDate: "2022-11-02",
    songs: ["song-4", "song-5"]
  }
  // Add more albums as needed
];

// Album shape:
// id: string
// name: string
// cover: string (image path)
// artist: string
// releaseDate: string (YYYY-MM-DD)
// songs: array of song ids
