import { useState, useRef, useEffect } from "react";
import ContextMenu from "./ContextMenu";
import PropTypes from 'prop-types';
import { db } from '../firebaseConfig';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

const RightPanel = ({ visible, content, onClose }) => {
  // content: { type: "artist"|"playlist", info: {...}, artistId?: string, artistName?: string }
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const menuButtonRef = useRef(null);
  const [artistData, setArtistData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch artist data from Firestore when artist panel is shown
  useEffect(() => {
    const fetchArtistData = async () => {
      if (!visible || !content || content.type !== 'artist') return;

      setLoading(true);
      try {
        const { artistId, artistName, info = {} } = content;

        // Try to get artist profile from Firestore
        let artistProfile = null;

        // Option 1: Query by artistId (if provided)
        if (artistId) {
          const artistDoc = await getDoc(doc(db, 'artists', artistId));
          if (artistDoc.exists()) {
            artistProfile = { id: artistDoc.id, ...artistDoc.data() };
          }
        }

        // Option 2: Query by artist name (fallback)
        if (!artistProfile && (artistName || info.name)) {
          const name = artistName || info.name;
          const artistQuery = query(
            collection(db, 'artists'),
            where('name', '==', name)
          );
          const artistSnapshot = await getDocs(artistQuery);
          if (!artistSnapshot.empty) {
            const doc = artistSnapshot.docs[0];
            artistProfile = { id: doc.id, ...doc.data() };
          }
        }

        // Load tour dates if artist profile found
        if (artistProfile) {
          const toursQuery = query(
            collection(db, 'tours'),
            where('artistId', '==', artistProfile.id)
          );
          const toursSnapshot = await getDocs(toursQuery);
          artistProfile.tourDates = toursSnapshot.docs
            .map(doc => doc.data())
            .sort((a, b) => new Date(a.date) - new Date(b.date));
        }

        setArtistData(artistProfile);
      } catch (error) {
        console.error('Error fetching artist data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchArtistData();
  }, [visible, content]);

  if (!visible || !content) return null;

  // Handle artist and playlist display
  const { type, info = {} } = content;

  // --- Artist "peek" ---
  if (type === "artist") {
    // Merge Firestore data with passed info (Firestore takes priority)
    const mergedData = artistData ? { ...info, ...artistData } : info;

    const {
      name,
      cover,
      profileImage,
      bannerImage,
      monthlyListeners,
      bio,
      biography,
      genre,
      socialLinks = {},
      credits = [],
      onTour = [],
      tourDates = [],
      videoSrc,
      videoPoster
    } = mergedData;

    // Use Firestore fields if available
    const displayName = name;
    const displayCover = profileImage || cover || "/artistImages/default.jpg";
    const displayBio = bio || biography;
    const displayTours = tourDates.length > 0 ? tourDates : onTour;

    const artistMenu = [
      { icon: "➕", label: "Add to playlist", onClick: () => {} },
      { icon: "❤️", label: "Save to your Liked Songs", onClick: () => {} },
      { icon: "📤", label: "Share", onClick: () => {} },
      { type: "divider" },
      { icon: "👤", label: "Go to artist", onClick: () => {} },
    ];

    return (
      <div className="bg-gray-900 text-white p-6 overflow-y-auto" style={{ height: "100%", width: "100%" }}>
        {/* Loading state */}
        {loading && (
          <div className="flex justify-center items-center h-full">
            <div className="text-gray-400">Loading artist info...</div>
          </div>
        )}

        {!loading && (
          <>
            {/* Header: More menu and close */}
            <div className="flex justify-between items-center mb-4">
              <button
                ref={menuButtonRef}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setMenuPos({ x: rect.right, y: rect.bottom });
                  setShowMenu(true);
                }}
                className="text-gray-400 hover:text-white text-2xl px-2"
                title="More options"
              >
                &#x22EE;
              </button>
              <button
                className="text-gray-400 hover:text-white text-xl"
                onClick={onClose}
                title="Close"
              >
                ✖
              </button>
            </div>
            {/* Dropdown */}
            <ContextMenu
              visible={showMenu}
              x={menuPos.x}
              y={menuPos.y}
              items={artistMenu}
              onClose={() => setShowMenu(false)}
            />

            {/* Main: Cover, Name, Stats */}
            <div className="flex flex-col items-center mb-4">
              <img
                src={displayCover}
                alt={displayName}
                className="w-40 h-40 rounded-full object-cover shadow"
              />
              <h2 className="text-2xl font-bold mt-4 mb-1">{displayName}</h2>
              {genre && (
                <div className="text-gray-400 text-sm mb-1">{genre}</div>
              )}
              {monthlyListeners && (
                <div className="text-green-400 text-sm mb-2">
                  {monthlyListeners.toLocaleString()} monthly listeners
                </div>
              )}
            </div>

            {/* Bio */}
            {displayBio && (
              <div className="mb-4 text-gray-300 leading-relaxed">{displayBio}</div>
            )}

            {/* Social Links */}
            {Object.keys(socialLinks).some(key => socialLinks[key]) && (
              <div className="mb-4">
                <h3 className="font-bold mb-2 text-lg">Connect</h3>
                <div className="flex flex-wrap gap-2">
                  {socialLinks.website && (
                    <a
                      href={socialLinks.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded text-sm transition"
                    >
                      🌐 Website
                    </a>
                  )}
                  {socialLinks.spotify && (
                    <a
                      href={socialLinks.spotify}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-green-600 hover:bg-green-500 px-3 py-1 rounded text-sm transition"
                    >
                      🎵 Spotify
                    </a>
                  )}
                  {socialLinks.instagram && (
                    <a
                      href={socialLinks.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-pink-600 hover:bg-pink-500 px-3 py-1 rounded text-sm transition"
                    >
                      📷 Instagram
                    </a>
                  )}
                  {socialLinks.facebook && (
                    <a
                      href={socialLinks.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded text-sm transition"
                    >
                      👤 Facebook
                    </a>
                  )}
                  {socialLinks.twitter && (
                    <a
                      href={socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-sky-500 hover:bg-sky-400 px-3 py-1 rounded text-sm transition"
                    >
                      🐦 Twitter
                    </a>
                  )}
                  {socialLinks.youtube && (
                    <a
                      href={socialLinks.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-red-600 hover:bg-red-500 px-3 py-1 rounded text-sm transition"
                    >
                      📺 YouTube
                    </a>
                  )}
                  {socialLinks.soundcloud && (
                    <a
                      href={socialLinks.soundcloud}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-orange-600 hover:bg-orange-500 px-3 py-1 rounded text-sm transition"
                    >
                      🔊 SoundCloud
                    </a>
                  )}
                  {socialLinks.tiktok && (
                    <a
                      href={socialLinks.tiktok}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-black hover:bg-gray-800 px-3 py-1 rounded text-sm transition"
                    >
                      🎬 TikTok
                    </a>
                  )}
                </div>
              </div>
            )}

        {/* Video (optional) */}
        {videoSrc && (
          <div className="mb-4">
            <video
              className="w-full aspect-[16/9] object-cover rounded"
              controls
              autoPlay
              muted
              poster={videoPoster || cover}
            >
              <source src={videoSrc} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        )}

        {/* Credits (Spotify-style) */}
        {credits.length > 0 && (
          <div className="mb-4">
            <h3 className="font-bold mb-2 text-lg">Credits</h3>
            <ul>
              {credits.map((credit, i) => (
                <li
                  key={i}
                  className="flex justify-between text-gray-200 py-1 border-b border-gray-700 last:border-none"
                >
                  <span>{credit.name}</span>
                  <span className="text-gray-400 text-sm">{credit.role}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

            {/* On Tour (optional) */}
            {displayTours.length > 0 && (
              <div className="mb-4">
                <h3 className="font-bold mb-2 text-lg">Upcoming Shows</h3>
                <ul>
                  {displayTours.map((tourItem, i) => (
                    <li
                      key={i}
                      className="py-1 border-b border-gray-700 last:border-none"
                    >
                      <div className="text-white font-semibold">
                        {new Date(tourItem.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                      <div className="text-gray-400 text-sm">
                        {tourItem.venue} • {tourItem.city}, {tourItem.country}
                      </div>
                      {tourItem.ticketLink && (
                        <a
                          href={tourItem.ticketLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-500 hover:text-green-400 text-xs"
                        >
                          Get Tickets →
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button className="bg-green-500 text-white font-bold px-4 py-2 rounded hover:bg-green-600 transition">
                Play
              </button>
              <button className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 transition">
                Follow
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // --- Playlist "peek" (Spotify style) ---
  if (type === "playlist") {
    const { name, cover, songs = [], description } = info;

    return (
      <div className="bg-gray-900 text-white p-6 overflow-y-auto" style={{ height: "100%", width: "100%" }}>
        <div className="flex justify-between items-center mb-4">
          <span className="font-bold text-lg">Playlist Details</span>
          <button
            className="text-gray-400 hover:text-white text-xl"
            onClick={onClose}
            title="Close"
          >
            ✖
          </button>
        </div>
        <div className="flex flex-col items-center mb-4">
          <img
            src={cover || "/playlist-default.jpg"}
            alt={name}
            className="w-40 h-40 rounded-lg object-cover shadow"
          />
          <h2 className="text-2xl font-bold mt-4 mb-2">{name}</h2>
          {description && <p className="text-gray-300 mb-2">{description}</p>}
          <div className="text-gray-400 text-sm">
            {songs.length} song{songs.length !== 1 ? "s" : ""}
          </div>
        </div>
        {/* List a preview of songs */}
        <div className="mb-4">
          <h3 className="font-bold mb-2 text-lg">Songs</h3>
          <ul>
            {songs.slice(0, 5).map((song, i) => (
              <li
                key={i}
                className="flex items-center text-gray-200 py-1 border-b border-gray-800 last:border-none"
              >
                <img
                  src={song.cover}
                  alt={song.title}
                  className="w-10 h-10 mr-2 rounded object-cover"
                />
                <div>
                  <div>{song.title}</div>
                  <div className="text-xs text-gray-400">{song.artist}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <button className="bg-green-500 text-white font-bold px-4 py-2 rounded hover:bg-green-600 transition w-full">
          Play Playlist
        </button>
      </div>
    );
  }

  // Fallback: Unknown panel type
  return null;
};

RightPanel.propTypes = {
  visible: PropTypes.bool,
  content: PropTypes.object, // { type: "artist", info: {...} } or { type: "playlist", info: {...} }
  onClose: PropTypes.func.isRequired
};

export default RightPanel;
