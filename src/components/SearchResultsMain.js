// src/components/SearchResultsMain.js
import React from "react";
import PlayButton from "./PlayButton";

export default function SearchResultsMain({
  query = "",
  musicData = [],
  onPlaySong = () => {},
  onArtistSelect = () => {}
}) {
  if (!query.trim()) return null;

  const normalizedQuery = query.trim().toLowerCase();

  const filteredSongs = musicData
    .filter(
      (song) =>
        song.title && song.title.toLowerCase().includes(normalizedQuery),
    )
    .slice(0, 5);

  const allArtists = [
    ...new Set(musicData.map((song) => song.artist).filter(Boolean)),
  ];
  const filteredArtists = allArtists
    .filter((artist) => artist.toLowerCase().includes(normalizedQuery))
    .slice(0, 6);

  const topSongObject = filteredSongs.length > 0 ? filteredSongs[0] : null;
  const topArtistName = filteredArtists.length > 0 ? filteredArtists[0] : null;

  const topResult = topSongObject
    ? { ...topSongObject, type: "Song" }
    : topArtistName
      ? {
          artist: topArtistName,
          type: "Artist",
          cover: "/images/artistPlaceholder.jpg"
        }
      : null;

  const noResults =
    !topResult && filteredSongs.length === 0 && filteredArtists.length === 0;

  return (
    <div className="p-4 text-white">
      {!noResults ? (
        <>
          {topResult && (
            <section className="mb-8">
              <h2 className="text-xl font-bold mb-2">Top result</h2>
              <div
                className="bg-gray-800 p-4 rounded flex items-center gap-4 cursor-pointer hover:bg-gray-700"
                onClick={() => {
                  if (topResult.type === "Song") onPlaySong(topResult);
                  else if (topResult.type === "Artist")
                    onArtistSelect(topResult.artist);
                }}
              >
                {topResult.cover ? (
                  <img
                    src={topResult.cover}
                    alt={topResult.title || topResult.artist}
                    className="w-20 h-20 object-cover rounded flex-shrink-0"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-600 rounded flex-shrink-0" />
                )}
                <div>
                  <p className="text-lg font-semibold">
                    {topResult.title || topResult.artist}
                  </p>
                  <p className="text-sm text-gray-400">
                    {topResult.type || "Playlist"} • BeatFlow
                  </p>
                </div>
              </div>
            </section>
          )}

          {filteredSongs.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-bold mb-2">Songs</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSongs.map((song, index) => (
                  <div
                    key={index}
                    className="bg-gray-800 p-4 rounded flex items-center gap-4 hover:bg-gray-700 cursor-pointer"
                    onClick={() => onPlaySong(song)}
                  >
                    {song.cover ? (
                      <img
                        src={song.cover}
                        alt={`${song.title} cover`}
                        className="w-14 h-14 object-cover rounded"
                      />
                    ) : (
                      <div className="w-14 h-14 bg-gray-600 rounded" />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold">{song.title}</p>
                      <p className="text-sm text-gray-400">
                        {song.artist || "Unknown Artist"}
                      </p>
                    </div>
                    <PlayButton
                      isPlaying={false}
                      onClick={() => onPlaySong(song)}
                      size={20}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {filteredArtists.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-bold mb-2">Artists</h2>
              <div className="flex gap-4 overflow-x-auto">
                {filteredArtists.map((artist, index) => (
                  <div
                    key={index}
                    className="flex-shrink-0 w-32 text-center cursor-pointer"
                    onClick={() => onArtistSelect(artist)}
                  >
                    <img
                      src={`/artistImages/${artist}.jpg`}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/images/artistPlaceholder.jpg";
                      }}
                      alt={artist}
                      className="w-32 h-32 object-cover rounded-full mb-2 mx-auto"
                    />
                    <p className="font-semibold truncate">{artist}</p>
                    <p className="text-sm text-gray-400">Artist</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      ) : (
        <div className="text-center text-gray-400 mt-8">
          No results found for "{query}"
        </div>
      )}
    </div>
  );
}
