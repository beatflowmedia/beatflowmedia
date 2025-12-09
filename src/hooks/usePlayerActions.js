import { useCallback } from 'react';
import { usePlayer } from '../context/PlayerContext';

/**
 * Unified Player Actions Hook
 *
 * Provides consistent, DRY player actions across the entire application.
 * Eliminates duplication by centralizing all playback logic.
 *
 * Usage:
 *   const { playSong, playArtist, playPlaylist, togglePlay, ... } = usePlayerActions();
 */
export function usePlayerActions(musicData = []) {
  const { state, dispatch, actions } = usePlayer();

  /**
   * Play a single song
   * If song exists in queue, jump to it. Otherwise add to queue and play.
   */
  const playSong = useCallback((song) => {
    if (!song) return;

    dispatch({
      type: actions.PLAY_SONG,
      payload: song
    });
  }, [dispatch, actions]);

  /**
   * Play all songs by an artist
   * Sets the queue to all artist songs and starts playback
   */
  const playArtist = useCallback((artistName) => {
    if (!artistName || !musicData) return;

    const artistSongs = musicData.filter(song => song.artist === artistName);

    if (artistSongs.length === 0) {
      console.warn(`No songs found for artist: ${artistName}`);
      return;
    }

    dispatch({
      type: actions.SET_QUEUE,
      payload: {
        queue: artistSongs,
        currentIndex: 0
      }
    });

    dispatch({ type: actions.TOGGLE_PLAY });
  }, [musicData, dispatch, actions]);

  /**
   * Play a playlist
   * Sets the queue to playlist songs and starts playback
   */
  const playPlaylist = useCallback((playlist) => {
    if (!playlist?.songs || playlist.songs.length === 0) {
      console.warn('Playlist has no songs');
      return;
    }

    dispatch({
      type: actions.SET_QUEUE,
      payload: {
        queue: playlist.songs,
        currentIndex: 0
      }
    });

    dispatch({ type: actions.TOGGLE_PLAY });
  }, [dispatch, actions]);

  /**
   * Play queue starting at specific index
   */
  const playQueueAt = useCallback((queue, index = 0) => {
    if (!queue || queue.length === 0) return;

    dispatch({
      type: actions.SET_QUEUE,
      payload: {
        queue,
        currentIndex: Math.max(0, Math.min(index, queue.length - 1))
      }
    });

    dispatch({ type: actions.TOGGLE_PLAY });
  }, [dispatch, actions]);

  /**
   * Toggle play/pause for current song
   */
  const togglePlay = useCallback(() => {
    dispatch({ type: actions.TOGGLE_PLAY });
  }, [dispatch, actions]);

  /**
   * Skip to next song
   */
  const skipNext = useCallback(() => {
    dispatch({ type: actions.SKIP_NEXT });
  }, [dispatch, actions]);

  /**
   * Skip to previous song
   */
  const skipPrevious = useCallback(() => {
    dispatch({ type: actions.SKIP_PREVIOUS });
  }, [dispatch, actions]);

  /**
   * Add song to queue
   */
  const enqueueSong = useCallback((song, position) => {
    dispatch({
      type: actions.ENQUEUE,
      payload: { item: song, position }
    });
  }, [dispatch, actions]);

  /**
   * Remove song from queue at index
   */
  const removeFromQueue = useCallback((index) => {
    dispatch({
      type: actions.REMOVE_AT,
      payload: index
    });
  }, [dispatch, actions]);

  /**
   * Clear entire queue
   */
  const clearQueue = useCallback(() => {
    dispatch({ type: actions.CLEAR });
  }, [dispatch, actions]);

  /**
   * Toggle shuffle mode
   */
  const toggleShuffle = useCallback(() => {
    dispatch({ type: actions.TOGGLE_SHUFFLE });
  }, [dispatch, actions]);

  /**
   * Cycle through repeat modes (OFF → ALL → ONE)
   */
  const cycleRepeat = useCallback(() => {
    dispatch({ type: actions.CYCLE_REPEAT });
  }, [dispatch, actions]);

  /**
   * Seek to specific time
   */
  const seekTo = useCallback((time) => {
    dispatch({
      type: actions.SET_CURRENT_TIME,
      payload: time
    });
  }, [dispatch, actions]);

  /**
   * Set volume (0.0 to 1.0)
   */
  const setVolume = useCallback((volume) => {
    dispatch({
      type: actions.SET_VOLUME,
      payload: Math.max(0, Math.min(1, volume))
    });
  }, [dispatch, actions]);

  return {
    // Core playback
    playSong,
    playArtist,
    playPlaylist,
    playQueueAt,
    togglePlay,

    // Navigation
    skipNext,
    skipPrevious,

    // Queue management
    enqueueSong,
    removeFromQueue,
    clearQueue,

    // Playback modes
    toggleShuffle,
    cycleRepeat,

    // Controls
    seekTo,
    setVolume,

    // Current state (read-only)
    currentSong: state.queue[state.currentIndex],
    isPlaying: state.isPlaying,
    queue: state.queue,
    currentIndex: state.currentIndex,
    shuffleOn: state.shuffleOn,
    repeatMode: state.repeatMode,
    currentTime: state.currentTime,
    duration: state.duration,
    volume: state.volume
  };
}

export default usePlayerActions;
