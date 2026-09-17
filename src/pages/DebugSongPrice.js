// Temporary debug page to check song prices
// Navigate to /debug-song-price to use this

import { useState } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { SONG_PRICE } from '../utils/pricing';

export default function DebugSongPrice() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  const loadSongs = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'songs'));
      const songData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSongs(songData);
      console.log('Loaded songs:', songData);
    } catch (error) {
      console.error('Error loading songs:', error);
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fixAllPrices = async () => {
    if (!window.confirm(`Fix all ${songs.length} songs to $29.00?`)) return;

    setUpdating(true);
    let updated = 0;

    try {
      for (const song of songs) {
        if (song.price !== SONG_PRICE) {
          await updateDoc(doc(db, 'songs', song.id), {
            price: SONG_PRICE
          });
          updated++;
          console.log(`Updated ${song.title}: ${song.price} → ${SONG_PRICE}`);
        }
      }
      alert(`✅ Updated ${updated} songs to $29.00`);
      loadSongs(); // Reload
    } catch (error) {
      console.error('Error updating:', error);
      alert('Error: ' + error.message);
    } finally {
      setUpdating(false);
    }
  };

  const fixOne = async (songId, currentPrice) => {
    if (!window.confirm(`Update this song from $${(currentPrice/100).toFixed(2)} to $29.00?`)) return;

    try {
      await updateDoc(doc(db, 'songs', songId), {
        price: SONG_PRICE
      });
      alert('✅ Updated!');
      loadSongs(); // Reload
    } catch (error) {
      console.error('Error:', error);
      alert('Error: ' + error.message);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', background: '#121212', minHeight: '100vh', color: 'white' }}>
      <h1>🔍 Song Price Debugger</h1>
      <p>Expected price: <strong>{SONG_PRICE} cents (${(SONG_PRICE/100).toFixed(2)})</strong></p>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={loadSongs}
          disabled={loading}
          style={{ padding: '10px 20px', marginRight: '10px', cursor: 'pointer' }}
        >
          {loading ? 'Loading...' : 'Load All Songs'}
        </button>

        {songs.length > 0 && (
          <button
            onClick={fixAllPrices}
            disabled={updating}
            style={{ padding: '10px 20px', background: '#1DB954', color: 'white', border: 'none', cursor: 'pointer' }}
          >
            {updating ? 'Updating...' : `Fix All ${songs.length} Songs to $29.00`}
          </button>
        )}
      </div>

      {songs.length > 0 && (
        <>
          <h2>Songs Found: {songs.length}</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#1a1a1a' }}>
            <thead>
              <tr style={{ background: '#2a2a2a' }}>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #333' }}>ID</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #333' }}>Title</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #333' }}>Artist</th>
                <th style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #333' }}>Price (cents)</th>
                <th style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #333' }}>Price ($)</th>
                <th style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #333' }}>Status</th>
                <th style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #333' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {songs.map(song => {
                const isCorrect = song.price === SONG_PRICE;
                const priceInDollars = (song.price || 0) / 100;

                return (
                  <tr key={song.id} style={{ borderBottom: '1px solid #333' }}>
                    <td style={{ padding: '10px', fontSize: '0.8em', color: '#888' }}>{song.id.substring(0, 8)}...</td>
                    <td style={{ padding: '10px' }}>{song.title || 'Untitled'}</td>
                    <td style={{ padding: '10px', color: '#aaa' }}>{song.artist || 'Unknown'}</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace' }}>{song.price || 0}</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace' }}>
                      ${priceInDollars.toFixed(2)}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      {isCorrect ? (
                        <span style={{ color: '#1DB954' }}>✅ Correct</span>
                      ) : (
                        <span style={{ color: '#ff4444' }}>❌ Wrong</span>
                      )}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      {!isCorrect && (
                        <button
                          onClick={() => fixOne(song.id, song.price)}
                          style={{ padding: '5px 10px', background: '#1DB954', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
                        >
                          Fix
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{ marginTop: '20px', padding: '15px', background: '#1a1a1a', borderRadius: '8px' }}>
            <h3>Summary</h3>
            <p>Total songs: <strong>{songs.length}</strong></p>
            <p>Correct price ($29.00): <strong style={{ color: '#1DB954' }}>{songs.filter(s => s.price === SONG_PRICE).length}</strong></p>
            <p>Wrong price: <strong style={{ color: '#ff4444' }}>{songs.filter(s => s.price !== SONG_PRICE).length}</strong></p>
          </div>
        </>
      )}
    </div>
  );
}
